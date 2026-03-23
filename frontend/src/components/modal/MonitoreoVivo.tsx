import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings, FolderOpen } from 'lucide-react';
import './MonitoreoVivo.css';

interface MonitoreoVivoProps {
    onBack: () => void;
    onCloseServer: () => void;
    serverData: { url: string; ruta: string } | null;
}

export const MonitoreoVivo: React.FC<MonitoreoVivoProps> = ({ onBack, onCloseServer, serverData }) => {
    const [deliveries, setDeliveries] = useState<string[]>([]);

    // Función para obtener alumnos desde el backend
    const actualizarAlumnos = async () => {
        if (window.pywebview && window.pywebview.api) {
            try {
                const alumnos = await window.pywebview.api.obtener_alumnos_directo();
                // Asumiendo que alumnos es una lista de nombres o objetos
                if (alumnos) setDeliveries(alumnos);
            } catch (error) {
                console.error("Error al obtener alumnos:", error);
            }
        }
    };

    // Polling para actualizar la lista cada 3 segundos
    useEffect(() => {
        actualizarAlumnos();
        const interval = setInterval(actualizarAlumnos, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleOpenFolder = () => {
        if (window.pywebview && window.pywebview.api) {
            window.pywebview.api.abrir_carpeta();
        }
    };

    const handleCloseServer = async () => {
        const confirmar = window.confirm("¿Estás seguro de cerrar el servidor? Ya no recibirás más exámenes.");
        
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
        <div className="monitoreo-vivo">
            <header className="monitoreo-header">
                <button className="btn-back-light" onClick={handleCloseServer}>
                    <ArrowLeft size={20} color="#475569" />
                </button>
                <div className="header-main-info">
                    <h2 className="monitoreo-title">Monitoreo en vivo</h2>
                    <p className="monitoreo-subtitle">Pide a los alumnos que ingresen a esta dirección:</p>
                    <div className="address-box">
                        <p className="address-text">{serverData?.url || "http://buscando-ip..."}</p>
                    </div>
                </div>
            </header>

            <main className="monitoreo-body">
                <p className="label-deliveries">ENTREGAS RECIBIDAS: {deliveries.length}</p>
                <div className="deliveries-container">
                    {deliveries.length === 0 ? (
                        <div className="empty-state">Esperando entregas...</div>
                    ) : (
                        <ul className="deliveries-list">
                            {deliveries.map((name, index) => (
                                <li key={index} className="delivery-item">
                                    {name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </main>

            <footer className="monitoreo-footer">
                {/* <button className="btn-settings">
                    <Settings size={24} color="#f1f5f9" />
                </button> */}
                <div></div>
                <div className="footer-actions">
                    <button className="btn-open-folder" onClick={handleOpenFolder}>
                        <FolderOpen size={20} color="#f1f5f9" />
                        <span className="btn-open-folder-text">Abrir Carpeta</span>
                    </button>
                    <button className="btn-close-server" onClick={handleCloseServer}>
                        <span className="btn-close-server-text">Cerrar servidor</span>
                    </button>
                </div>
            </footer>
        </div>
    );
};
