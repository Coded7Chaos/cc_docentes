import React from 'react';
import './MonitoreoVivo.css';

const imgIcon = "https://www.figma.com/api/mcp/asset/8ab6b05e-ba95-4510-95b9-59c0384468dc";
const imgSolarSettingsBoldDuotone = "https://www.figma.com/api/mcp/asset/32146a6d-1225-4998-b2c3-627cefc7a668";
const imgMaterialSymbolsFolderSharp = "https://www.figma.com/api/mcp/asset/af10fcde-2c5e-40ba-8c3c-67063cbf503e";

interface MonitoreoVivoProps {
    onBack: () => void;
    onCloseServer: () => void;
}

export const MonitoreoVivo: React.FC<MonitoreoVivoProps> = ({ onBack, onCloseServer }) => {
    const deliveries = [
        "PEREZ, Juan Luis",
        "RODAS MIRANDA, Camila Nicole",
        "MEDINA, Esmeralda",
        "GONZALES, Joaquin"
    ];

    return (
        <div className="monitoreo-vivo">
            <header className="monitoreo-header">
                <button className="btn-back-light" onClick={onBack}>
                    <img src={imgIcon} alt="Back" />
                </button>
                <div className="header-main-info">
                    <h2 className="monitoreo-title">Monitoreo en vivo</h2>
                    <p className="monitoreo-subtitle">Pide a los alumnos que ingresen a esta dirección:</p>
                    <div className="address-box">
                        <p className="address-text">http:192.168.1.11:5001</p>
                    </div>
                </div>
            </header>

            <main className="monitoreo-body">
                <p className="label-deliveries">ENTREGAS RECIBIDAS: {deliveries.length}</p>
                <div className="deliveries-container">
                    <ul className="deliveries-list">
                        {deliveries.map((name, index) => (
                            <li key={index} className="delivery-item">
                                {name}
                            </li>
                        ))}
                    </ul>
                </div>
            </main>

            <footer className="monitoreo-footer">
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
