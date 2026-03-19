import React, { useState } from 'react';
import './ConfiguracionServidor.css';

const imgIcon = "https://www.figma.com/api/mcp/asset/304935bc-ca51-4653-b4fa-e854ae742503";
const imgBoxiconsEyeClosed = "https://www.figma.com/api/mcp/asset/ff93608d-1116-4088-85fa-8b05a531b8f7";
const imgBoxiconsEyeOpen = "https://www.figma.com/api/mcp/asset/138d7836-8e62-4be3-8f56-c01dcb6072cd"; // I'll assume this is eye open or similar
const imgGroup = "https://www.figma.com/api/mcp/asset/138d7836-8e62-4be3-8f56-c01dcb6072cd";
const imgGroup1 = "https://www.figma.com/api/mcp/asset/86a0ec54-d9a7-4b8a-8024-e08fe45188de";
const imgIcBaselineCode = "https://www.figma.com/api/mcp/asset/4b3e1fc3-3dcc-47d6-989e-ade6ae561920";

interface ConfiguracionServidorProps {
  onBack: () => void;
  onStartServer?: () => void;
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
  const [saveDir, setSaveDir] = useState('C:/Desktop');
  const [saveMode, setSaveMode] = useState<SaveMode>('ESTRICTO');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  
  const handleModeSelect = (mode: SaveMode) => {
    setSaveMode(mode);
    setIsDropdownOpen(false);
  };

  const handleBrowseDir = () => {
    // In a real web app, we might use a file picker or just prompt
    const newDir = prompt("Ingrese la ruta de guardado:", saveDir);
    if (newDir) setSaveDir(newDir);
  };

  return (
    <div className="configuracion-servidor">
      <header className="config-header">
        <button className="btn-back" onClick={onBack}>
          <img src={imgIcon} alt="Back" />
        </button>
        <div className="header-text-container">
          <h2 className="header-title-text">Configuración del Servidor</h2>
          <p className="header-subtitle-text">Cree un servidor al que otros envíen archivos</p>
        </div>
      </header>

      <main className="config-body">
        <div className="form-group">
          <label className="form-label">NOMBRE DE LA MATERIA</label>
          <div className="input-container">
            <input 
              type="text" 
              className="input-field" 
              placeholder="Ej: Ingeniería de Software o SIS-213"
              value={materia}
              onChange={(e) => setMateria(e.target.value)}
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
            />
            <button className="icon-button" onClick={togglePasswordVisibility}>
              <img src={showPassword ? imgBoxiconsEyeOpen : imgBoxiconsEyeClosed} alt="Toggle Password" />
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">DIRECCIÓN DE GUARDADO</label>
          <div className="dir-container">
            <div className="input-container">
              <div className="icon-folder">
                <img src={imgGroup1} alt="Folder" />
              </div>
              <input 
                type="text" 
                className="input-field" 
                value={saveDir}
                readOnly
              />
            </div>
            <button className="btn-change" onClick={handleBrowseDir}>
              <span className="btn-change-text">Cambiar</span>
            </button>
          </div>
        </div>

        <div className={`info-banner ${isDropdownOpen ? 'dropdown-active' : ''}`}>
          <div className="dot-indicator"></div>
          <div className="info-content" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            <p className="info-title">Modo de guardado</p>
            <div className="info-detail">
              <span className="mode-tag">{SAVE_MODES[saveMode].label}</span>
              <span className="mode-desc">{SAVE_MODES[saveMode].description}</span>
            </div>
          </div>
          <button className="icon-code" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            <img src={imgIcBaselineCode} alt="Code" style={{ transform: isDropdownOpen ? 'rotate(90deg)' : 'rotate(-90deg)' }} />
          </button>

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
        <button className="btn-start-server" onClick={onStartServer}>
          <span className="btn-start-server-text">Iniciar servidor</span>
        </button>
      </footer>
    </div>
  );
};
