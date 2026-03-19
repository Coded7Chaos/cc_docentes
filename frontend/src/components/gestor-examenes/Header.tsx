import { Linkedin, Github, Mail, Phone } from 'lucide-react';
import './Header.css';

export const Header = () => {
    return (
        <div className="header">
            <div className="header-title">Gestor de Exámenes y Archivos</div>
            <div className="header-info">
                <span className="creator-label">Creado por:</span>
                <span className="creator-name">Camila Nicole Rodas Miranda</span>
                <nav className="header-nav">
                    <a href="https://www.linkedin.com/in/camila-nicole-rodas-miranda-7696a1298" target="_blank" rel="noopener noreferrer" className="nav-link">
                        <Linkedin size={14} />
                        <span>LinkedIn - Camila Nicole Rodas Miranda</span>
                    </a>
                    <span className="separator">•</span>
                    <a href="https://github.com/Coded7Chaos" target="_blank" rel="noopener noreferrer" className="nav-link">
                        <Github size={14} />
                        <span>Coded7Chaos</span>
                    </a>
                    <span className="separator">•</span>
                    <a href="mailto:mila.eloc@gmail.com" className="nav-link">
                        <Mail size={14} />
                        <span>mila.eloc@gmail.com</span>
                    </a>
                    <span className="separator">•</span>
                    <a href="https://wa.me/73059904" target="_blank" rel="noopener noreferrer" className="nav-link">
                        <Phone size={14} />
                        <span>+591 73059904</span>
                    </a>
                </nav>
            </div>
        </div>
    );
}