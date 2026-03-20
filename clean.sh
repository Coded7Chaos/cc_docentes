echo "--- Iniciando limpieza profunda ---"

# 1. Borrar carpetas de construcción de PyInstaller
rm -rf build/
rm -rf dist/

# 2. Borrar archivos de especificación (.spec)
rm -f *.spec

# 3. Borrar todos los rastros de Python (__pycache__)
find . -name "__pycache__" -type d -exec rm -rf {} +

# 4. Borrar logs locales
rm -f app.log

# 5. Borrar la carpeta de datos de la app (Solo en Mac para pruebas)
rm -rf ~/Library/Application\ Support/EasyTestServer
rm -rf ~/.config/EasyTestServer

echo "--- Limpieza completada. Ya puedes compilar de nuevo. ---"