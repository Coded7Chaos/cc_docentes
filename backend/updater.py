import json
import logging
import shlex
import subprocess
import sys
import tarfile
import tempfile
import urllib.error
import urllib.request
import zipfile
from pathlib import Path

logger = logging.getLogger(__name__)

REPO = "Coded7Chaos/cc_docentes"
URL_ULTIMA_RELEASE = f"https://api.github.com/repos/{REPO}/releases/latest"
USER_AGENT = "SimpleTestServer-Updater"


def _ruta_base() -> Path:
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        return Path(sys._MEIPASS)
    return Path(__file__).parent.parent


def obtener_version_actual() -> str:
    ruta_version = _ruta_base() / "backend" / "version.txt"
    try:
        return ruta_version.read_text(encoding="utf-8").strip()
    except Exception as e:
        logger.error(f"No se pudo leer version.txt: {e}")
        return "0.0.0-dev"


def _parsear_version(version: str) -> tuple:
    version = version.strip().lstrip("vV").split("-")[0]
    numeros = []
    for parte in version.split("."):
        try:
            numeros.append(int(parte))
        except ValueError:
            numeros.append(0)
    while len(numeros) < 3:
        numeros.append(0)
    return tuple(numeros[:3])


def hay_version_mas_nueva(actual: str, remota: str) -> bool:
    return _parsear_version(remota) > _parsear_version(actual)


def _asset_esperado() -> tuple:
    """(substring que debe contener el nombre, extensión) del asset para este sistema operativo."""
    if sys.platform == "win32":
        return ("", ".exe")
    if sys.platform == "darwin":
        return ("mac", ".zip")
    return ("linux", ".tar.gz")


def verificar_actualizacion() -> dict:
    """Consulta la última release publicada en GitHub y la compara con la versión actual."""
    version_actual = obtener_version_actual()
    try:
        peticion = urllib.request.Request(
            URL_ULTIMA_RELEASE,
            headers={"Accept": "application/vnd.github+json", "User-Agent": USER_AGENT},
        )
        with urllib.request.urlopen(peticion, timeout=8) as respuesta:
            data = json.loads(respuesta.read().decode("utf-8"))
    except Exception as e:
        logger.error(f"Error al consultar actualizaciones en GitHub: {e}")
        return {
            "disponible": False,
            "version_actual": version_actual,
            "error": "No se pudo conectar con GitHub para verificar actualizaciones.",
        }

    version_remota = data.get("tag_name", "")
    notas = data.get("body") or ""

    contiene, extension = _asset_esperado()
    url_descarga = next(
        (
            a.get("browser_download_url")
            for a in data.get("assets", [])
            if a.get("name", "").lower().endswith(extension) and contiene in a.get("name", "").lower()
        ),
        None,
    )

    if not version_remota or not hay_version_mas_nueva(version_actual, version_remota):
        return {"disponible": False, "version_actual": version_actual, "version_remota": version_remota}

    if not url_descarga:
        logger.warning(f"La release {version_remota} no tiene un asset para este sistema operativo.")
        return {
            "disponible": False,
            "version_actual": version_actual,
            "version_remota": version_remota,
            "error": "Hay una versión nueva pero no se encontró un instalador para este sistema operativo.",
        }

    return {
        "disponible": True,
        "version_actual": version_actual,
        "version_remota": version_remota,
        "notas": notas,
        "url_descarga": url_descarga,
    }


def _descargar(url_descarga: str, nombre_archivo: str) -> Path:
    destino = Path(tempfile.gettempdir()) / nombre_archivo
    peticion = urllib.request.Request(url_descarga, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(peticion, timeout=60) as respuesta, open(destino, "wb") as archivo:
        archivo.write(respuesta.read())
    return destino


def _lanzar_reemplazo_unix(ruta_actual: Path, ruta_nueva: Path, comando_relanzar: list) -> None:
    """
    Genera y lanza un script que espera a que este proceso termine, reemplaza la
    instalación actual por la nueva, y relanza la app. El script se autoelimina al final.
    """
    script = (
        "#!/bin/bash\n"
        "sleep 2\n"
        f"rm -rf {shlex.quote(str(ruta_actual))}\n"
        f"mv {shlex.quote(str(ruta_nueva))} {shlex.quote(str(ruta_actual))}\n"
        f"{' '.join(shlex.quote(c) for c in comando_relanzar)} >/dev/null 2>&1 &\n"
        'rm -- "$0"\n'
    )
    script_path = Path(tempfile.gettempdir()) / "stserver_update.sh"
    script_path.write_text(script, encoding="utf-8")
    script_path.chmod(0o755)
    subprocess.Popen(["/bin/bash", str(script_path)], start_new_session=True)


def _descargar_e_instalar_windows(url_descarga: str) -> dict:
    instalador = _descargar(url_descarga, "SimpleTestServer_Setup.exe")
    logger.info(f"Instalador de actualización descargado en: {instalador}")
    subprocess.Popen([str(instalador), "/VERYSILENT", "/SUPPRESSMSGBOXES", "/NORESTART"], close_fds=True)
    return {"status": "ok"}


def _descargar_e_instalar_mac(url_descarga: str) -> dict:
    zip_path = _descargar(url_descarga, "SimpleTestServer-mac.zip")
    directorio_extraido = Path(tempfile.mkdtemp(prefix="stserver_update_"))
    with zipfile.ZipFile(zip_path) as z:
        z.extractall(directorio_extraido)

    app_nueva = next(directorio_extraido.glob("*.app"), None)
    if not app_nueva:
        raise RuntimeError("El .zip descargado no contiene un paquete .app")

    # En una app empaquetada (.app) sys._MEIPASS apunta a ".../Nombre.app/Contents/MacOS"
    app_actual = Path(sys._MEIPASS).parent.parent
    logger.info(f"Reemplazando {app_actual} por la versión descargada en {app_nueva}")
    _lanzar_reemplazo_unix(app_actual, app_nueva, comando_relanzar=["open", str(app_actual)])
    return {"status": "ok"}


def _descargar_e_instalar_linux(url_descarga: str) -> dict:
    tar_path = _descargar(url_descarga, "SimpleTestServer-linux.tar.gz")
    directorio_extraido = Path(tempfile.mkdtemp(prefix="stserver_update_"))
    with tarfile.open(tar_path) as t:
        t.extractall(directorio_extraido)

    carpetas = [p for p in directorio_extraido.iterdir() if p.is_dir()]
    if not carpetas:
        raise RuntimeError("El .tar.gz descargado no contiene una carpeta de aplicación")
    carpeta_nueva = carpetas[0]

    # En modo --onedir, sys._MEIPASS es la propia carpeta de instalación actual
    instalacion_actual = Path(sys._MEIPASS)
    ejecutable_nuevo = instalacion_actual / instalacion_actual.name
    logger.info(f"Reemplazando {instalacion_actual} por la versión descargada en {carpeta_nueva}")
    _lanzar_reemplazo_unix(instalacion_actual, carpeta_nueva, comando_relanzar=[str(ejecutable_nuevo)])
    return {"status": "ok"}


def descargar_e_instalar(url_descarga: str) -> dict:
    """
    Descarga la nueva versión y la instala reemplazando la actual.
    Quien llame a esta función debe cerrar la app inmediatamente después de un resultado
    "ok", para que el proceso de reemplazo pueda tocar los archivos en uso.
    """
    try:
        if sys.platform == "win32":
            return _descargar_e_instalar_windows(url_descarga)
        if sys.platform == "darwin":
            return _descargar_e_instalar_mac(url_descarga)
        return _descargar_e_instalar_linux(url_descarga)
    except Exception as e:
        logger.error(f"Error al descargar/instalar la actualización: {e}")
        return {"status": "error", "message": str(e)}
