import { useState } from "react";
import { Header } from "../components/gestor-examenes/Header";
import { MainContent } from "../components/gestor-examenes/MainContent";
import { ConfiguracionServidor } from "../components/modal/ConfiguracionServidor";
import { MonitoreoVivo } from "../components/modal/MonitoreoVivo";
import { EnviarArchivos } from "../components/modal/EnviarArchivos";
import { MonitoreoEnvio } from "../components/modal/MonitoreoEnvio";
import './gestor-examenes.css';

export const GestorExamenesPage = () => {
    const [view, setView] = useState<'welcome' | 'config' | 'monitoring' | 'envio' | 'monitoring-envio'>('welcome');

    return (
        <div className="frame">
            {view === 'welcome' && (
                <>
                    <Header />
                    <MainContent 
                        onRecibirExamen={() => setView('config')} 
                        onEnviarArchivos={() => setView('envio')}
                    />
                </>
            )}
            {view === 'config' && (
                <ConfiguracionServidor 
                    onBack={() => setView('welcome')} 
                    onStartServer={() => setView('monitoring')}
                />
            )}
            {view === 'monitoring' && (
                <MonitoreoVivo 
                    onBack={() => setView('config')}
                    onCloseServer={() => setView('welcome')}
                />
            )}
            {view === 'envio' && (
                <EnviarArchivos 
                    onBack={() => setView('welcome')}
                    onStartServer={() => setView('monitoring-envio')}
                />
            )}
            {view === 'monitoring-envio' && (
                <MonitoreoEnvio 
                    onBack={() => setView('envio')}
                    onCloseServer={() => setView('welcome')}
                />
            )}
        </div>
    );
}