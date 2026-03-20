Write-Host "--- Iniciando limpieza profunda ---" -ForegroundColor Cyan

# 1. Borrar carpetas de construcción de PyInstaller
Remove-Item -Recurse -Force build -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue

# 2. Borrar archivos de especificación (.spec)
Remove-Item -Force *.spec -ErrorAction SilentlyContinue

# 3. Borrar todos los rastros de Python (__pycache__)
Get-ChildItem -Recurse -Filter "__pycache__" -Directory | Remove-Item -Recurse -Force

# 4. Borrar logs locales
Remove-Item -Force app.log -ErrorAction SilentlyContinue

# 5. Borrar la carpeta de datos de la app (Equivalente en Windows: AppData)
$appDataPath = Join-Path $env:APPDATA "EasyTestServer"
if (Test-Path $appDataPath) {
    Remove-Item -Recurse -Force $appDataPath
}

Write-Host "--- Limpieza completada. Ya puedes compilar de nuevo. ---" -ForegroundColor Green