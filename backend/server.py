import os
import json
import shutil
import ipaddress
from flask import Flask, request, jsonify, render_template, send_from_directory, abort
from werkzeug.utils import secure_filename
from datetime import datetime
import logging

import sys

logger = logging.getLogger(__name__)

# Configuración de rutas para plantillas (soporte PyInstaller)
if getattr(sys, 'frozen', False):
    # Si es ejecutable, las plantillas están en la carpeta temporal _MEIPASS
    template_folder = os.path.join(sys._MEIPASS, 'backend', 'templates')
else:
    # En desarrollo están en la carpeta local
    template_folder = 'templates'

app = Flask(__name__, template_folder=template_folder)

def es_ip_local(ip):
    try:
        ip_obj = ipaddress.ip_address(ip)
        return ip_obj.is_private or ip_obj.is_loopback
    except ValueError:
        return False

@app.before_request
def filtrar_solo_local():
    # Permitir localhost y red local
    client_ip = request.remote_addr
    if not es_ip_local(client_ip):
        logger.warning(f"CONEXIÓN BLOQUEADA: Intento de acceso desde IP externa no autorizada: {client_ip}")
        abort(403) # Prohibido

# Estado global del servidor (Lo que antes era servidor_data)
estado = {
    "tipo": None, # "recepcion" o "envio"
    "materia": "",
    "password": "",
    "ruta": "",
    "modo": "sobreescribir",
    "alumnos": [],
    "window": None,
    "servidor_corriendo": False,
    "archivos_a_enviar": [] # Nueva lista para archivos que el docente quiere compartir
}

# Esta función la llamaremos desde el Bridge para configurar el servidor
def configurar_servidor(materia, password, modo, ruta_base):
    logger.info(f"Configurando servidor de RECEPCIÓN: Materia={materia}, Modo={modo}")
    estado["tipo"] = "recepcion"
    estado["materia"] = materia
    estado["password"] = password
    estado["modo"] = modo
    # ... rest of the function (I'll keep the logic below the same but need to ensure 'tipo' is set)
    nombre_carpeta_principal = f'entregas_{materia}_{datetime.now().strftime("%Y%m%d")}'
    estado["ruta"] = os.path.join(ruta_base, nombre_carpeta_principal)
    try:
        if not os.path.exists(estado["ruta"]):
            os.makedirs(estado["ruta"])
            logger.info(f"Carpeta de entregas creada: {estado['ruta']}")
        return estado["ruta"]
    except Exception as e:
        logger.error(f"Error al crear carpeta de entregas: {e}")
        raise

@app.route('/', methods=['GET'])
def index():
    client_ip = request.remote_addr
    logger.info(f"Acceso al index desde {client_ip}. Modo actual: {estado['tipo']}")
    
    if estado["tipo"] == "envio":
        return render_template('descargas.html', archivos=estado["archivos_a_enviar"])
    elif estado["tipo"] == "recepcion":
        return render_template('estudiante.html', materia=estado["materia"])
    
    return "Servidor activo pero no configurado.", 404

@app.route('/download/<int:file_id>')
def download_file(file_id):
    client_ip = request.remote_addr
    if not (0 <= file_id < len(estado["archivos_a_enviar"])):
        logger.warning(f"Intento de descarga fallido (ID no existe): {file_id} desde {client_ip}")
        return "Archivo no encontrado", 404
    
    archivo = estado["archivos_a_enviar"][file_id]
    logger.info(f"Descargando archivo: {archivo['nombre']} solicitado por {client_ip}")
    ruta_completa = archivo["path"]
    directorio = os.path.dirname(ruta_completa)
    nombre = os.path.basename(ruta_completa)

    return send_from_directory(directorio, nombre, as_attachment=True)

@app.route('/upload', methods=['POST'])
def upload():
    client_ip = request.remote_addr
    user_pass = request.form.get('password')
    nombres = request.form.get('nombres')
    apellidos = request.form.get('apellidos')
    archivos = request.files.getlist('archivos')

    if user_pass != estado["password"]:
        logger.warning(f"Intento de subida con contraseña incorrecta desde {client_ip}")
        return jsonify({"status": "error", "message": "Contraseña incorrecta"}), 403

    if archivos and nombres and apellidos:
        identidad_alumno = f"{apellidos.upper()}, {nombres.title()}"
        logger.info(f"Recibiendo entrega de: {identidad_alumno} desde {client_ip}")
        # Limpieza de nombres para que Windows no de error al guardar
        safe_id = secure_filename(identidad_alumno).replace(" ", "_")

        try:
            if len(archivos) > 1:
                if estado["modo"] == "historial":
                    timestamp = datetime.now().strftime("%H%M%S")
                    nombre_carpeta_alumno = f"{safe_id}_{timestamp}"
                else:
                    nombre_carpeta_alumno = safe_id

                ruta_carpeta_alumno = os.path.join(estado["ruta"], nombre_carpeta_alumno)

                if estado["modo"] == "sobreescribir" and os.path.exists(ruta_carpeta_alumno):
                    shutil.rmtree(ruta_carpeta_alumno)
                os.makedirs(ruta_carpeta_alumno, exist_ok=True)
                for file in archivos:
                    if file.filename:
                        filename = secure_filename(file.filename)
                        file.save(os.path.join(ruta_carpeta_alumno, filename))
                logger.info(f"Múltiples archivos guardados en {ruta_carpeta_alumno}")

            else:
                file = archivos[0]
                if file.filename:
                    _, extension = os.path.splitext(file.filename)
                    if estado["modo"] == "historial":
                        timestamp = datetime.now().strftime("%H%M%S")
                        final_name = f"{safe_id}_{timestamp}{extension}"
                    else:
                        final_name = f"{safe_id}{extension}"
                    # Guardar el archivo en la carpeta
                    dest = os.path.join(estado["ruta"], final_name)
                    file.save(dest)
                    logger.info(f"Archivo guardado en {dest}")
        except Exception as e:
            logger.error(f"Error al guardar archivos de {identidad_alumno}: {e}")
            return jsonify({"status": "error", "message": "Error al guardar el archivo en el servidor"}), 500

        # Actualizar lista solo si no entregó antes
        if identidad_alumno not in estado["alumnos"]:
            estado["alumnos"].append(identidad_alumno)
            estado["alumnos"].sort()
            logger.info(f"Nuevo alumno añadido a la lista: {identidad_alumno}")

            if estado["window"]:
                alumnos_json = json.dumps(estado["alumnos"])
                script_js = f"window.dispatchEvent(new CustomEvent('actualizarAlumnos', {{detail: {alumnos_json}}}));"
                estado["window"].evaluate_js(script_js)

        return jsonify({"status": "success", "message": f"Examen de {identidad_alumno} subido."})

    return jsonify({"status": "error", "message": "Faltan datos o archivos en el formulario"}), 400

@app.route('/api/alumnos', methods=['GET'])
def obtener_alumnos():
    return jsonify(estado["alumnos"])