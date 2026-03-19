import './App.css'
import { GestorExamenesPage } from './pages/gestor-examenes'

declare global {
  interface Window {
    pywebview: {
      api: {
        selecciona_carpeta: () => Promise<string | null>;
        iniciar_servidor: (m,p, mo, r) => Promise<any>;
        abrir_carpeta: () => void;
        obtener_alumnos_directo: () => Promise<any[]>;
      }
    }
  }
}

function App() {

  return (
    <>
      <GestorExamenesPage />
    </>
  )
}

export default App
