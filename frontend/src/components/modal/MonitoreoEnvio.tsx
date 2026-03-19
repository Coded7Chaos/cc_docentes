import React from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import './MonitoreoEnvio.css';
import './MonitoreoVivo.css'; // Reuse some common monitoring styles

interface MonitoreoEnvioProps {
  onBack: () => void;
  onCloseServer: () => void;
  serverData: { url: string; ruta: string } | null;
}

export const MonitoreoEnvio: React.FC<MonitoreoEnvioProps> = ({ onBack, onCloseServer, serverData }) => {
  const handleCloseServer = async () => {
    const confirmar = window.confirm("¿Estás seguro de cerrar el servidor de envío? Los alumnos ya no podrán descargar los archivos.");
    
    if (confirmar) {
      if (window.pywebview && window.pywebview.api) {
        try {
          const result = await (window.pywebview.api as any).detener_servidor();
          if (result.status === "ok") {
            onCloseServer();
          } else {
            alert("Error: " + result.message);
          }
        } catch (error) {
          console.error("Error al detener servidor:", error);
          onCloseServer();
        }
      } else {
        onCloseServer();
      }
    }
  };

  return (
    <div className="monitoreo-envio">
      <header className="envio-ready-header">
        <button className="btn-back-light" onClick={handleCloseServer}>
          <ArrowLeft size={20} color="#475569" />
        </button>
        
        <div className="checkmark-container">
          <CheckCircle size={80} color="#15803d" strokeWidth={1.5} />
        </div>

        <h2 className="envio-ready-title">Archivos listos!</h2>
        <p className="envio-ready-subtitle">Pide a los alumnos que ingresen a esta dirección:</p>
        
        <div className="address-box">
          <p className="address-text">{serverData?.url || "http://buscando-ip..."}</p>
        </div>
      </header>

      <footer className="envio-ready-footer">
        <div className="footer-actions" style={{ width: '100%', justifyContent: 'center' }}>
          <button className="btn-close-server" onClick={handleCloseServer}>
            <span className="btn-close-server-text">Cerrar servidor</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
