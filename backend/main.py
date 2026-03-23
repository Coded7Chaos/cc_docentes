import webview
import threading
from waitress import serve
from server import app, estado, configurar_servidor # Importamos tu lógica
import os
import socket
import sys
import subprocess
import logging
from pathlib import Path




# Función para resolver rutas de archivos internos (necesario para PyInstaller)
def obtener_ruta_recurso(ruta_relativa):
    """
    Resuelve la ruta absoluta de un recurso, ya sea en desarrollo (Mac) 
    o en producción (Windows .exe compilado con PyInstaller).
    """
    if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
        # MODO PRODUCCIÓN (.exe): Convertimos el texto _MEIPASS a Path
        base_path = Path(sys._MEIPASS)
    else:
        # MODO DESARROLLO (Mac): __file__ está en backend/main.py, subimos un nivel
        base_path = Path(__file__).parent.parent
        
    # El símbolo '/' une las rutas perfectamente porque base_path ya es un Path
    ruta_final = base_path / ruta_relativa
    
    # Devolvemos la ruta como texto normal (string) por si pywebview o pyinstaller lo requieren así
    return str(ruta_final)

# Configuración de logs en carpeta de usuario
def configurar_logs():
    app_name = "EasyTestServer"
    if sys.platform == "win32":
        log_dir = os.path.join(os.getenv('LOCALAPPDATA'), app_name)
    else:
        log_dir = os.path.join(os.path.expanduser("~"), ".config", app_name)
    
    try:
        os.makedirs(log_dir, exist_ok=True)
        log_path = os.path.join(log_dir, "app.log")
    except Exception:
        log_path = "app.log" # Fallback a carpeta actual si falla todo

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
        handlers=[
            logging.FileHandler(log_path, encoding='utf-8'),
            logging.StreamHandler(sys.stdout)
        ]
    )
    return log_path

configurar_logs()
logger = logging.getLogger(__name__)

def obtener_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(2) # Evita que la app se cuelgue si la red no responde
        # No envía paquetes reales, solo simula una conexión para ver qué red usa Windows
        s.connect(("8.8.8.8", 80)) 
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception as e:
        logger.error(f"Error al obtener IP (posible falta de red): {e}")
        return "127.0.0.1"
    
def obtener_puerto_libre(puerto_inicial=5000):
    puerto = puerto_inicial
    # Probaremos hasta 100 puertos distintos por seguridad
    while puerto < 5100:
        # Creamos un enchufe virtual temporal
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                # Intentamos "apoderarnos" del puerto
                s.bind(('0.0.0.0', puerto))
                # Si llegamos a esta línea sin errores, el puerto está libre.
                # Al salir del bloque 'with', Python suelta el puerto automáticamente.
                return puerto 
            except OSError:
                # Si da error (Errno 48), el puerto está ocupado. Sumamos 1 y el bucle repite.
                puerto += 1
    
    logger.error("No se encontraron puertos libres en el rango 5000-5100")
    raise Exception("No se encontraron puertos libres en el rango especificado.")


class ApiBridge:
    def __init__(self):
        self.window = None
        self.servidor_inicializado = False
        self.puerto_fijo = None

    def asegurar_servidor_iniciado(self):
        if not self.servidor_inicializado:
            # Buscamos un puerto libre solo la primera vez
            self.puerto_fijo = obtener_puerto_libre(5000)
            logger.info(f"Iniciando hilo único de servidor en puerto {self.puerto_fijo}")
            threading.Thread(target=lambda: serve(app, host='0.0.0.0', port=self.puerto_fijo), daemon=True).start()
            self.servidor_inicializado = True

    def obtener_ruta_escritorio(self):
        ruta = os.path.join(os.path.expanduser("~"), "Desktop")
        logger.info(f"Ruta de escritorio obtenida: {ruta}")
        return ruta
    
    def seleccionar_carpeta(self):
        logger.info("Abriendo diálogo de selección de carpeta...")
        resultado = self.window.create_file_dialog(webview.FOLDER_DIALOG)
        if resultado:
            logger.info(f"Carpeta seleccionada: {resultado[0]}")
            return resultado[0]
        logger.info("Selección de carpeta cancelada.")
        return None

    def abrir_archivos(self):
        # Abre diálogo de selección de múltiples archivos
        logger.info("Abriendo diálogo de selección de múltiples archivos...")
        resultado = self.window.create_file_dialog(webview.OPEN_DIALOG, allow_multiple=True)
        if not resultado:
            logger.info("Selección de archivos cancelada.")
            return []
        
        lista_archivos = []
        for path in resultado:
            nombre = os.path.basename(path)
            _, ext = os.path.splitext(nombre)
            lista_archivos.append({
                "path": path,
                "nombre": nombre,
                "extension": ext.lower()
            })
        logger.info(f"Archivos seleccionados: {[f['nombre'] for f in lista_archivos]}")
        return lista_archivos

    def obtener_estado_red(self):
        ip = obtener_ip()
        logger.info(f"Verificando estado de red. IP detectada: {ip}")
        
        if ip == "127.0.0.1":
            return {
                "conectado": False,
                "ip": ip,
                "mensaje": "No se detecta una red local (Wi-Fi o Cable). Los alumnos no podrán conectarse. Prueba activando un Hotspot."
            }
        
        return {
            "conectado": True,
            "ip": ip,
            "mensaje": "Conectado a la red local."
        }

    def iniciar_servidor(self, materia, password, modo, ruta_base):
        logger.info(f"Intento de inicio de servidor: Materia={materia}, Modo={modo}")
        if estado["servidor_corriendo"]:
            logger.warning("Intento de iniciar servidor fallido: ya hay uno en ejecución.")
            return {"status": "error", "message": "El servidor ya está en marcha."}
        
        if not ruta_base or ruta_base == "Cargando...":
            ruta_base = self.obtener_ruta_escritorio()

        modo_backend = "sobreescribir" if modo == "ESTRICTO" else "historial"

        try:
            ruta = configurar_servidor(materia, password, modo_backend, ruta_base)
            ip_local = obtener_ip()
            
            # Aseguramos que el hilo esté corriendo
            self.asegurar_servidor_iniciado()
            
            url_conexion = f"http://{ip_local}:{self.puerto_fijo}"
            
            estado["servidor_corriendo"] = True
            return {"status": "ok", "ruta": ruta, "url": url_conexion}
        except Exception as e:
            logger.exception("Error al iniciar el servidor de recepción")
            return {"status": "error", "message": str(e)}

    def iniciar_servidor_envio(self, archivos):
        logger.info(f"Intento de inicio de servidor de envío con {len(archivos)} archivos.")
        if estado["servidor_corriendo"]:
            logger.warning("Intento de iniciar servidor de envío fallido: ya hay uno en ejecución.")
            return {"status": "error", "message": "El servidor ya está en marcha."}
        
        if not archivos:
            logger.error("No se puede iniciar servidor de envío sin archivos.")
            return {"status": "error", "message": "No se han seleccionado archivos."}

        try:
            # 1. Configurar estado explícito
            estado["tipo"] = "envio"
            estado["archivos_a_enviar"] = archivos
            estado["materia"] = "" # Limpiar por si acaso
            
            ip_local = obtener_ip()
            
            # Aseguramos que el hilo esté corriendo
            self.asegurar_servidor_iniciado()
            
            url_conexion = f"http://{ip_local}:{self.puerto_fijo}"
            
            estado["servidor_corriendo"] = True
            return {"status": "ok", "url": url_conexion}
        except Exception as e:
            logger.exception("Error al iniciar el servidor de envío")
            return {"status": "error", "message": str(e)}

    def abrir_carpeta(self):
        ruta = estado.get("ruta")
        if ruta and os.path.exists(ruta):
            logger.info(f"Abriendo carpeta: {ruta}")
            if sys.platform == "win32":
                #Windows
                os.startfile(ruta)
            elif sys.platform == "darwin":
                #Mac
                subprocess.Popen(["open", ruta])
            else:
                #Linux
                subprocess.Popen(["xdg-open", ruta])
        else:
            logger.warning(f"Intento de abrir carpeta fallido: ruta no válida ({ruta})")

    def obtener_alumnos_directo(self):
        return estado["alumnos"]

    def guardar_archivo_temporal(self, nombre, contenido_base64):
        import base64
        logger.info(f"Guardando archivo temporal proveniente de Drag and Drop: {nombre}")
        try:
            # Crear carpeta temporal en AppData
            app_name = "EasyTestServer"
            if sys.platform == "win32":
                temp_dir = os.path.join(os.getenv('LOCALAPPDATA'), app_name, "temp_upload")
            else:
                temp_dir = os.path.join(os.path.expanduser("~"), ".config", app_name, "temp_upload")
            
            os.makedirs(temp_dir, exist_ok=True)
            ruta_final = os.path.join(temp_dir, nombre)
            
            # Decodificar y guardar
            data = base64.b64decode(contenido_base64)
            with open(ruta_final, "wb") as f:
                f.write(data)
            
            logger.info(f"Archivo temporal guardado con éxito en: {ruta_final}")
            return {"status": "ok", "path": ruta_final}
        except Exception as e:
            logger.error(f"Error al guardar archivo temporal: {e}")
            return {"status": "error", "message": str(e)}

    def detener_servidor(self):
        logger.info("Solicitud de detención de servidor.")
        if not estado["servidor_corriendo"]:
            logger.warning("Intento de detener servidor fallido: no hay ninguno activo.")
            return {"status": "error", "message": "No hay ningún servidor corriendo."}
        
        try:
            # En Waitress no hay un 'stop' directo por hilo, 
            # pero marcamos el estado como detenido para la lógica de la app.
            estado["servidor_corriendo"] = False
            estado["materia"] = ""
            estado["alumnos"] = []
            estado["archivos_a_enviar"] = []
            logger.info("Servidor detenido lógicamente (estado reseteado).")
            return {"status": "ok", "message": "Servidor detenido correctamente."}
        except Exception as e:
            logger.error(f"Error al detener el servidor: {e}")
            return {"status": "error", "message": str(e)}

def start():
    logger.info("Iniciando aplicación PyWebview...")
    api = ApiBridge()
    
    es_produccion = getattr(sys, 'frozen', False)
    
    if es_produccion:
        ruta_html = obtener_ruta_recurso(os.path.join('frontend', 'dist', 'index.html'))
        target_url = ruta_html
    else:
        target_url = 'http://localhost:5173'

    window = webview.create_window(
        'Simple Test Server', 
        target_url, 
        js_api=api, 
        width=1200, 
        height=800, 
        resizable=True # Permitir mover/redimensionar libremente
    )
    api.window = window
    estado["window"] = window
    
    # Iniciamos el servidor Flask de forma ultra-segura
    # (El servidor no hará nada hasta que el usuario le de a 'Iniciar')
    api.asegurar_servidor_iniciado()
    
    logger.info("Lanzando bucle de interfaz...")
    webview.start() # Quitamos el parámetro icon de aquí por ahora para descartar errores de carga
    logger.info("Aplicación cerrada.")

if __name__ == '__main__':
    start()