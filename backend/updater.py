import json
import logging
import os
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request
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
    url_instalador = next(
        (a.get("browser_download_url") for a in data.get("assets", []) if a.get("name", "").lower().endswith(".exe")),
        None,
    )

    if not version_remota or not hay_version_mas_nueva(version_actual, version_remota):
        return {"disponible": False, "version_actual": version_actual, "version_remota": version_remota}

    if not url_instalador:
        logger.warning(f"La release {version_remota} no tiene un instalador (.exe) adjunto.")
        return {
            "disponible": False,
            "version_actual": version_actual,
            "version_remota": version_remota,
            "error": "Hay una versión nueva pero no se encontró un instalador para descargar.",
        }

    return {
        "disponible": True,
        "version_actual": version_actual,
        "version_remota": version_remota,
        "notas": notas,
        "url_descarga": url_instalador,
    }


def descargar_e_instalar(url_descarga: str) -> dict:
    """
    Descarga el instalador y lo lanza en modo silencioso.
    Quien llame a esta función debe cerrar la app inmediatamente después de un resultado
    "ok", para que el instalador pueda reemplazar los archivos en uso.
    """
    try:
        destino = os.path.join(tempfile.gettempdir(), "SimpleTestServer_Setup.exe")
        peticion = urllib.request.Request(url_descarga, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(peticion, timeout=60) as respuesta, open(destino, "wb") as archivo:
            archivo.write(respuesta.read())

        logger.info(f"Instalador de actualización descargado en: {destino}")

        subprocess.Popen([destino, "/VERYSILENT", "/SUPPRESSMSGBOXES", "/NORESTART"], close_fds=True)
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Error al descargar/instalar la actualización: {e}")
        return {"status": "error", "message": str(e)}
