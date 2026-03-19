import unittest
from unittest.mock import MagicMock, patch
import os
import json
import shutil
import sys

# Añadir el directorio actual al path para importar los módulos del backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from server import app, estado, configurar_servidor
from main import ApiBridge, obtener_ip

class TestBackendLogic(unittest.TestCase):

    def setUp(self):
        # Configurar el cliente de pruebas de Flask
        app.config['TESTING'] = True
        self.client = app.test_client()
        
        # Resetear el estado global antes de cada prueba
        estado["tipo"] = None
        estado["materia"] = ""
        estado["password"] = ""
        estado["ruta"] = ""
        estado["alumnos"] = []
        estado["archivos_a_enviar"] = []
        estado["servidor_corriendo"] = False

    def test_obtener_ip(self):
        with patch('socket.socket') as mock_socket:
            mock_socket.return_value.getsockname.return_value = ['192.168.1.50']
            ip = obtener_ip()
            self.assertEqual(ip, '192.168.1.50')

    def test_configurar_servidor(self):
        materia = "Matematica"
        password = "123"
        modo = "sobreescribir"
        ruta_base = os.path.dirname(os.path.abspath(__file__))
        
        ruta_resultado = configurar_servidor(materia, password, modo, ruta_base)
        
        self.assertEqual(estado["materia"], materia)
        self.assertEqual(estado["password"], password)
        self.assertEqual(estado["tipo"], "recepcion")
        self.assertTrue(os.path.exists(ruta_resultado))
        self.assertIn(f"entregas_{materia}", ruta_resultado)
        
        # Limpieza
        if os.path.exists(ruta_resultado):
            shutil.rmtree(ruta_resultado)

    def test_route_index_recepcion(self):
        estado["tipo"] = "recepcion"
        estado["materia"] = "Fisica"
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Fisica', response.data)

    def test_route_index_envio(self):
        estado["tipo"] = "envio"
        estado["archivos_a_enviar"] = [{"nombre": "test.pdf", "path": "/tmp/test.pdf"}]
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'test.pdf', response.data)

    def test_upload_wrong_password(self):
        estado["tipo"] = "recepcion"
        estado["password"] = "secreto"
        response = self.client.post('/upload', data={
            'password': 'error',
            'nombres': 'Juan',
            'apellidos': 'Perez'
        })
        self.assertEqual(response.status_code, 403)
        data = json.loads(response.data)
        self.assertEqual(data["status"], "error")

    def test_api_alumnos(self):
        estado["alumnos"] = ["PEREZ, Juan", "GOMEZ, Ana"]
        response = self.client.get('/api/alumnos')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(len(data), 2)
        self.assertIn("PEREZ, Juan", data)

    def test_detener_servidor(self):
        bridge = ApiBridge()
        estado["servidor_corriendo"] = True
        estado["materia"] = "Algo"
        
        resultado = bridge.detener_servidor()
        self.assertEqual(resultado["status"], "ok")
        self.assertFalse(estado["servidor_corriendo"])
        self.assertEqual(estado["materia"], "")

if __name__ == '__main__':
    unittest.main()
