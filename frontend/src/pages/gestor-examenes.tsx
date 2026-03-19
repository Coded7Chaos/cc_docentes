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
    const [serverData, setServerData] = useState<{ url: string; ruta: string } | null>(null);

    const handleRecibirServerStarted = (data: { url: string; ruta: string }) => {
        setServerData(data);
        setView('monitoring');
    };

    const handleEnviarServerStarted = (data: { url: string; ruta: string }) => {
        setServerData(data);
        setView('monitoring-envio');
    };

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
                    onStartServer={handleRecibirServerStarted}
                />
            )}
            {view === 'monitoring' && (
                <MonitoreoVivo 
                    onBack={() => setView('config')}
                    onCloseServer={() => {
                        setServerData(null);
                        setView('welcome');
                    }}
                    serverData={serverData}
                />
            )}
            {view === 'envio' && (
                <EnviarArchivos 
                    onBack={() => setView('welcome')}
                    onStartServer={handleEnviarServerStarted}
                />
            )}
            {view === 'monitoring-envio' && (
                <MonitoreoEnvio 
                    onBack={() => setView('envio')}
                    onCloseServer={() => {
                        setServerData(null);
                        setView('welcome');
                    }}
                    serverData={serverData}
                />
            )}
        </div>
    );
}