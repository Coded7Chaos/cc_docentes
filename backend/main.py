import webview
import threading
from waitress import serve
from server import app, estado, configurar_servidor # Importamos tu lógica
import os
import socket
import sys
import subprocess


def obtener_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # No envía paquetes reales, solo simula una conexión para ver qué red usa Windows
        s.connect(("8.8.8.8", 80)) 
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
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
    
    raise Exception("No se encontraron puertos libres en el rango especificado.")


class ApiBridge:
    def __init__(self):
        self.window = None

    def obtener_ruta_escritorio(self):
        return os.path.join(os.path.expanduser("~"), "Desktop")
    
    def seleccionar_carpeta(self):
        resultado = self.window.create_file_dialog(webview.FOLDER_DIALOG)
        if resultado:
            return resultado[0]
        return None

    def iniciar_servidor(self, materia, password, modo, ruta_base):
        if estado["servidor_corriendo"]:
            return {"status": "error", "message": "El servidor ya está en marcha."}
        if not ruta_base or ruta_base == "Cargando...":
            ruta_base = self.obtener_ruta_escritorio()

        # 1. Configurar lógica
        ruta = configurar_servidor(materia, password, modo, ruta_base)

        ip_local = obtener_ip()

        puerto = obtener_puerto_libre(5000)

        url_conexion = f"http:{ip_local}:{puerto}]"
        
        # 2. Correr Waitress en un hilo (Thread) para no congelar la pantalla
        threading.Thread(target=lambda: serve(app, host='0.0.0.0', port=puerto), daemon=True).start()
        estado["servidor_corriendo"] = True
        
        return {"status": "ok", "ruta": ruta, "url": url_conexion}

    def abrir_carpeta(self):
        if os.path.exists(estado["ruta"]):
            if sys.platform == "win32":
                #Windows
                os.startfile(estado["ruta"])
            elif sys.platform == "darwin":
                #Mac
                subprocess.Popen(["open", estado["ruta"]])
            else:
                #Linux
                subprocess.Popen(["xdg-open", estado["ruta"]])
    def obtener_alumnos_directo(self):
        return estado["alumnos"]

def start():
    api = ApiBridge()
    # En desarrollo apunta al puerto de Vite (5173), en producción al index.html
    window = webview.create_window('Easy Test Server', 'http://localhost:5173', js_api=api)
    api.window = window
    
    webview.start()

if __name__ == '__main__':
    start()