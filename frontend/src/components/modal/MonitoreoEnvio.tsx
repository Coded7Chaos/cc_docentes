import React from 'react';
import './MonitoreoEnvio.css';
import './MonitoreoVivo.css'; // Reuse some common monitoring styles

const imgMaterialSymbolsCheckRounded = "https://www.figma.com/api/mcp/asset/242d8ac1-b3c5-4854-933d-de5d80ab477e";
const imgIcon = "https://www.figma.com/api/mcp/asset/87f7616f-ab32-4c2c-8c0c-b76493ebbe57";
const imgSolarSettingsBoldDuotone = "https://www.figma.com/api/mcp/asset/68cf79e8-9e85-446a-8b3e-e501f35544e5";
const imgMaterialSymbolsFolderSharp = "https://www.figma.com/api/mcp/asset/3d04273d-5177-4463-b09f-2827ba7cc562";

interface MonitoreoEnvioProps {
  onBack: () => void;
  onCloseServer: () => void;
}

export const MonitoreoEnvio: React.FC<MonitoreoEnvioProps> = ({ onBack, onCloseServer }) => {
  return (
    <div className="monitoreo-envio">
      <header className="envio-ready-header">
        <button className="btn-back-light" onClick={onBack}>
          <img src={imgIcon} alt="Back" />
        </button>
        
        <div className="checkmark-container">
          <img src={imgMaterialSymbolsCheckRounded} alt="Ready" className="size-full" />
        </div>

        <h2 className="envio-ready-title">Archivos listos!</h2>
        <p className="envio-ready-subtitle">Pide a los alumnos que ingresen a esta dirección:</p>
        
        <div className="address-box">
          <p className="address-text">http:192.168.1.11:5001</p>
        </div>
      </header>

      <footer className="envio-ready-footer">
        <button className="btn-settings">
          <img src={imgSolarSettingsBoldDuotone} alt="Settings" width="24" height="24" />
        </button>
        <div className="footer-actions">
          <button className="btn-open-folder">
            <img src={imgMaterialSymbolsFolderSharp} alt="Folder" width="24" height="24" />
            <span className="btn-open-folder-text">Abrir Carpeta</span>
          </button>
          <button className="btn-close-server" onClick={onCloseServer}>
            <span className="btn-close-server-text">Cerrar servidor</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
