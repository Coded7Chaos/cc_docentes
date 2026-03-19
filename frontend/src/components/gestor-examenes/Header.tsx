import './Header.css';

export const Header = () => {
    return (
        <div className="header">
            <div className="header-title">Gestor de Exámenes y Archivos</div>
            <div className="header-info">
                <span className="creator-label">Creado por:</span>
                <span className="creator-name">Camila Nicole Rodas Miranda</span>
                <nav className="header-nav">
                    <a href="#" className="nav-link">LinkedIn</a>
                    <span className="separator">•</span>
                    <a href="#" className="nav-link">Correo</a>
                    <span className="separator">•</span>
                    <a href="#" className="nav-link">Teléfono</a>
                </nav>
            </div>
        </div>
    );
}