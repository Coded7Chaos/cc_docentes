import React, { useState, useEffect } from 'react';
import { ArrowLeft, Eye, EyeOff, Folder, ChevronDown, WifiOff } from 'lucide-react';
import './ConfiguracionServidor.css';

interface ConfiguracionServidorProps {
  onBack: () => void;
  onStartServer?: (data: { url: string; ruta: string }) => void;
}

type SaveMode = 'ESTRICTO' | 'FLEXIBLE';

const SAVE_MODES: Record<SaveMode, { label: string; description: string }> = {
  ESTRICTO: {
    label: 'ESTRICTO',
    description: 'Solo se acepta un envío en caso de haber más de uno. Se mantiene el último enviado',
  },
  FLEXIBLE: {
    label: 'FLEXIBLE',
    description: 'Se aceptan múltiples envíos. Todos los archivos se conservan con sufijos de tiempo',
  },
};

export const ConfiguracionServidor: React.FC<ConfiguracionServidorProps> = ({ onBack, onStartServer }) => {
  const [materia, setMateria] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saveDir, setSaveDir] = useState('Cargando...');
  const [saveMode, setSaveMode] = useState<SaveMode>('ESTRICTO');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [networkStatus, setNetworkStatus] = useState({ conectado: true, mensaje: '' });

  // Cargar ruta inicial y verificar red desde Python
  useEffect(() => {
    const init = async () => {
      if (window.pywebview && window.pywebview.api) {
        try {
          const [path, status] = await Promise.all([
            window.pywebview.api.obtener_ruta_escritorio(),
            window.pywebview.api.obtener_estado_red()
          ]);
          setSaveDir(path);
          setNetworkStatus({ conectado: status.conectado, mensaje: status.mensaje });
        } catch (error) {
          console.error("Error en inicialización:", error);
          setSaveDir('C:/Desktop');
        }
      } else {
        setSaveDir('C:/Desktop (Modo Dev)');
      }
    };
    init();
  }, []);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  
  const handleModeSelect = (mode: SaveMode) => {
    setSaveMode(mode);
    setIsDropdownOpen(false);
  };

  const handleBrowseDir = async () => {
    if (window.pywebview && window.pywebview.api) {
      try {
        const result = await window.pywebview.api.seleccionar_carpeta();
        if (result) {
          setSaveDir(result);
        }
      } catch (error) {
        console.error("Error al seleccionar carpeta:", error);
      }
    } else {
      const newDir = prompt("Ingrese la ruta de guardado:", saveDir);
      if (newDir) setSaveDir(newDir);
    }
  };

  const handleStartServer = async () => {
    if (!materia || !password) {
        alert("Por favor completa el nombre de la materia y la contraseña");
        return;
    }

    if (!networkStatus.conectado) {
        const continuar = window.confirm("Aviso: No se detecta una red local. Los alumnos no podrán conectarse a menos que actives un Hotspot. ¿Deseas iniciar el servidor de todas formas?");
        if (!continuar) return;
    }

    setIsLoading(true);
    if (window.pywebview && window.pywebview.api) {
      try {
        const result = await window.pywebview.api.iniciar_servidor(materia, password, saveMode, saveDir);
        if (result.status === "ok") {
          onStartServer?.({ url: result.url, ruta: result.ruta });
        } else {
          alert("Error: " + result.message);
        }
      } catch (error) {
        console.error("Error al iniciar servidor:", error);
        alert("Hubo un error al conectar con el backend.");
      }
    } else {
      setTimeout(() => {
        onStartServer?.({ url: "http://192.168.1.100:5000", ruta: saveDir });
      }, 1000);
    }
    setIsLoading(false);
  };

  return (
    <div className="configuracion-servidor">
      <header className="config-header">
        <button className="btn-back" onClick={onBack}>
          <ArrowLeft size={20} color="#f1f5f9" />
        </button>
        <div className="header-text-container">
          <h2 className="header-title-text">Configuración del Servidor</h2>
          <p className="header-subtitle-text">Cree un servidor al que otros envíen archivos</p>
        </div>
      </header>

      <main className="config-body">
        {!networkStatus.conectado && (
            <div className="network-warning-banner">
                <WifiOff size={18} />
                <p>{networkStatus.mensaje}</p>
            </div>
        )}

        <div className="form-group">
          <label className="form-label">NOMBRE DE LA MATERIA</label>
          <div className="input-container">
            <input 
              type="text" 
              className="input-field" 
              placeholder="Ej: Ingeniería de Software o SIS-213"
              value={materia}
              onChange={(e) => setMateria(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">CONTRASEÑA</label>
          <div className="input-container">
            <input 
              type={showPassword ? "text" : "password"} 
              className="input-field" 
              placeholder="Ej: 12345"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <button className="icon-button" onClick={togglePasswordVisibility} disabled={isLoading}>
              {showPassword ? <Eye size={20} color="#475569" /> : <EyeOff size={20} color="#475569" />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">DIRECCIÓN DE GUARDADO</label>
          <div className="dir-container">
            <div className="input-container save-dir-container" title={saveDir}>
              <div className="icon-folder">
                <Folder size={20} color="#475569" />
              </div>
              <div className="input-wrapper">
                <input 
                  type="text" 
                  className="input-field" 
                  value={saveDir}
                  readOnly
                />
                <span className="ghost-text">{saveDir}</span>
              </div>
            </div>
            <button className="btn-change" onClick={handleBrowseDir} disabled={isLoading}>
              <span className="btn-change-text">Cambiar</span>
            </button>
          </div>
        </div>

        <div className={`info-banner ${isDropdownOpen ? 'dropdown-active' : ''}`}>
          <div className="dot-indicator"></div>
          <div className="info-content" onClick={() => !isLoading && setIsDropdownOpen(!isDropdownOpen)}>
            <p className="info-title">Modo de guardado</p>
            <div className="info-detail">
              <span className="mode-tag">{SAVE_MODES[saveMode].label}</span>
              <span className="mode-desc">{SAVE_MODES[saveMode].description}</span>
            </div>
          </div>
          <div className="icon-code" onClick={() => !isLoading && setIsDropdownOpen(!isDropdownOpen)}>
            <ChevronDown 
                size={20} 
                color="#475569" 
                style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} 
            />
          </div>

          {isDropdownOpen && (
            <div className="dropdown-menu">
              {Object.entries(SAVE_MODES).map(([key, value]) => (
                <div 
                  key={key} 
                  className={`dropdown-item ${saveMode === key ? 'active' : ''}`}
                  onClick={() => handleModeSelect(key as SaveMode)}
                >
                  <span className="mode-tag">{value.label}</span>
                  <span className="mode-desc">{value.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="config-footer">
        <button className="btn-start-server" onClick={handleStartServer} disabled={isLoading}>
          <span className="btn-start-server-text">
            {isLoading ? "Iniciando..." : "Iniciar servidor"}
          </span>
        </button>
      </footer>
    </div>
  );
};
