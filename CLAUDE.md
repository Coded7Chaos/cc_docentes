# CLAUDE.md

Guía rápida del proyecto para trabajar eficientemente con Claude Code.

## Qué es esto

**Simple Test Server** (nombre interno de datos/carpetas: `EasyTestServer`) es una app de
escritorio para Windows (y ejecutable en Mac para desarrollo) pensada para docentes:

- **Recibir exámenes**: levanta un servidor local al que los alumnos, conectados a la misma
  red Wi-Fi/LAN, suben sus archivos desde el navegador (sin necesidad de internet).
- **Enviar archivos**: levanta un servidor local desde el que los alumnos pueden descargar
  archivos que el docente comparte.

El servidor **solo acepta conexiones de IPs privadas/loopback** (ver `filtrar_solo_local` en
`backend/server.py`) — es intencional, no un bug.

## Stack y arquitectura

- **Backend**: Python, `pywebview` (ventana nativa) + `Flask` servido con `waitress`.
  - `backend/main.py`: punto de entrada. Crea la ventana pywebview, resuelve rutas
    (dev vs. `.exe` empaquetado con PyInstaller), gestiona logs, red, y expone la clase
    `ApiBridge` como puente JS↔Python (`window.pywebview.api.*` en el frontend).
  - `backend/server.py`: la app Flask en sí (rutas `/`, `/upload`, `/download/<id>`,
    `/api/alumnos`), estado global en el dict `estado`, y el filtro de seguridad por IP.
  - `backend/templates/`: HTML servido a los alumnos (no es el frontend React).
- **Frontend**: React 19 + Vite + TypeScript, en `frontend/`. Es la UI que ve el **docente**
  dentro de la ventana pywebview (los alumnos ven las plantillas Flask, no este React).
  - `frontend/src/pages/gestor-examenes.tsx`: orquesta las vistas (`welcome`, `config`,
    `monitoring`, `envio`, `monitoring-envio`) a mano con `useState`, sin router.
  - `frontend/src/types.d.ts`: tipado de `window.pywebview.api` — **actualizar este archivo
    cada vez que se agrega/cambia un método de `ApiBridge` en `main.py`**.
  - En modo dev (`npm run dev`), `window.pywebview` no existe; los componentes lo chequean
    y usan fallbacks/mocks para poder probar la UI en un navegador normal.
- **Empaquetado**: PyInstaller genera el `.exe` (`--onedir`), Inno Setup (`instalador.iss`)
  genera el instalador `SimpleTestServer_Setup.exe`. El instalador desinstala silenciosamente
  cualquier versión previa antes de instalar la nueva (mismo `AppId` fijo).
- **CI/CD**: `.github/workflows/build.yml` compila frontend + backend + instalador en
  `windows-latest`. Se dispara en push a `main` (build de verificación, sube artifact) y en
  tags `v*.*.*` (además publica una GitHub Release con el instalador adjunto — ver
  "Cómo publicar una nueva versión" abajo).

## Cómo correr en desarrollo

```bash
# Terminal 1: frontend (Vite dev server en :5173)
cd frontend
npm install
npm run dev

# Terminal 2: backend/ventana pywebview
pip install -r requirements.txt
python backend/main.py
```

En desarrollo, `main.py` apunta la ventana a `http://localhost:5173` (ver `es_produccion` en
`start()`). El servidor Flask (waitress) arranca igual en un puerto libre desde 5000.

## Convenciones importantes

- El código propio (variables, funciones, docstrings de negocio) está en **español**; no
  mezclar inglés salvo en nombres de librerías/estándares.
- No hay tests automatizados de frontend; `backend/tests.py` es el único lugar con pruebas
  de backend.
- Los logs van a `%LOCALAPPDATA%\EasyTestServer\app.log` en Windows (o
  `~/.config/EasyTestServer/app.log` fuera de Windows) — ver `configurar_logs()` en
  `backend/main.py`.
- Al agregar un método nuevo a `ApiBridge` en `main.py`, siempre reflejarlo en
  `frontend/src/types.d.ts`.

## Actualización automática (GitHub Releases)

La app chequea sola si hay una versión nueva publicada en GitHub Releases del repo
`Coded7Chaos/cc_docentes`, y si el usuario acepta, descarga el instalador, lo corre en modo
silencioso y cierra la app para que el instalador reemplace los archivos.

- **Versión actual**: vive en `backend/version.txt` (se empaqueta con PyInstaller y se lee en
  runtime). En desarrollo normalmente dice `0.0.0-dev`.
- **Lógica de chequeo/descarga**: `backend/updater.py`.
- **Puente a la UI**: métodos `verificar_actualizacion()` y
  `descargar_instalar_actualizacion(url)` en `ApiBridge` (`backend/main.py`).
- **UI**: `frontend/src/components/common/UpdateBanner.tsx`, montado en
  `gestor-examenes.tsx`, chequea al iniciar la app.

### Cómo publicar una nueva versión

1. Verificar que todo lo que se quiere liberar ya está en `main`.
2. Crear y pushear un tag con formato `vX.Y.Z` (semver):
   ```bash
   git tag v1.2.3
   git push origin v1.2.3
   ```
3. El workflow de GitHub Actions (`.github/workflows/build.yml`) se dispara solo, compila el
   instalador con esa versión (se la pasa a Inno Setup y la escribe en
   `backend/version.txt` antes de armar el `.exe`), y publica una **GitHub Release** con el
   tag como nombre y el instalador (`SimpleTestServer_Setup.exe`) como asset.
4. Las instalaciones existentes van a detectar la nueva release la próxima vez que abran la
   app (o si el usuario aprieta "Buscar actualizaciones") y se van a ofrecer a actualizar
   solas.

No hace falta editar `instalador.iss` a mano para cambiar la versión — el número que importa
es el del tag de git.
