import { Logo } from "../common/Logo";
import './MainContent.css';
import CCLogo from '../../assets/CCLogo.svg';

interface MainContentProps {
    onRecibirExamen?: () => void;
    onEnviarArchivos?: () => void;
}

export const MainContent = ({ onRecibirExamen, onEnviarArchivos }: MainContentProps) => {
    return (
        <div className="main">
            <div className="center-content">
                <Logo image={CCLogo}/>
                <h1 className="title">SECURE FILE TRANSFER</h1>
                <div className="actions-container">
                    <div className="action-card">
                        <button className="btn-primary" onClick={onRecibirExamen}>Recibir examen</button>
                        <p className="description">
                            Utilice esta función para recibir los archivos de exámenes de forma segura desde los dispositivos conectados a la misma red.
                        </p>
                    </div>
                    <div className="divider"></div>
                    <div className="action-card">
                        <button className="btn-primary" onClick={onEnviarArchivos}>Enviar archivos</button>
                        <p className="description">
                            Seleccione y cargue archivos para que otros usuarios en su red local puedan descargarlos sin conexión a internet.
                        </p>
                    </div>
                </div>
            </div>
            <div className="footer-note">
                En caso de tener dudas o problemas, por favor comuníquese con el centro de cómputo
            </div>
        </div>
    );
}