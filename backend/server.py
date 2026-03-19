import os
import json
import shutil
from flask import Flask, request, jsonify, render_template
from werkzeug.utils import secure_filename
from datetime import datetime

app = Flask(__name__)

# Estado global del servidor (Lo que antes era servidor_data)
estado = {
    "materia": "",
    "password": "",
    "ruta": "",
    "modo": "sobreescribir",
    "alumnos": [],
    "window": None,
    "servidor_corriendo": False
}

# Esta función la llamaremos desde el Bridge para configurar el servidor
def configurar_servidor(materia, password, modo, ruta_base):
    estado["materia"] = materia
    estado["password"] = password
    estado["modo"] = modo
    nombre_carpeta_principal = f'entregas_{materia}_{datetime.now().strftime("%Y%m%d")}'
    estado["ruta"] = os.path.join(ruta_base, nombre_carpeta_principal)
    if not os.path.exists(estado["ruta"]):
        os.makedirs(estado["ruta"])
    return estado["ruta"]

@app.route('/', methods=['GET'])
def index():
    return render_template('estudiante.html', materia=estado["materia"])

@app.route('/upload', methods=['POST'])
def upload():
    user_pass = request.form.get('password')
    nombres = request.form.get('nombres')
    apellidos = request.form.get('apellidos')
    archivos = request.files.getlist('archivos')

    if user_pass != estado["password"]:
        return jsonify({"status": "error", "message": "Contraseña incorrecta"}), 403

    if archivos and nombres and apellidos:
        identidad_alumno = f"{apellidos.upper()}, {nombres.title()}"
        # Limpieza de nombres para que Windows no de error al guardar
        safe_id = secure_filename(identidad_alumno).replace(" ", "_")

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
              file.save(os.path.join(estado["ruta"], final_name))

        # Actualizar lista solo si no entregó antes

        if identidad_alumno not in estado["alumnos"]:
            estado["alumnos"].append(identidad_alumno)
            estado["alumnos"].sort()

            if estado["window"]:
                alumnos_json = json.dumps(estado["alumnos"])
                # Disparamos un CustomEvent en el navegador invisible
                script_js = f"window.dispatchEvent(new CustomEvent('actualizarAlumnos', {{detail: {alumnos_json}}}));"
                estado["window"].evaluate_js(script_js)

        return jsonify({"status": "success", "message": f"Examen de {identidad_alumno} subido."})

    return jsonify({"status": "error", "message": "Faltan datos o archivos en el formulario"}), 400

@app.route('/api/alumnos', methods=['GET'])
def obtener_alumnos():
    return jsonify(estado["alumnos"])