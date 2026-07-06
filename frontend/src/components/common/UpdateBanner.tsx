import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import './UpdateBanner.css';

type EstadoActualizacion =
    | { fase: 'oculto' }
    | { fase: 'disponible'; versionRemota: string; notas: string; urlDescarga: string }
    | { fase: 'descargando' }
    | { fase: 'error'; mensaje: string };

export const UpdateBanner = () => {
    const [estado, setEstado] = useState<EstadoActualizacion>({ fase: 'oculto' });

    useEffect(() => {
        const verificar = async () => {
            if (!window.pywebview || !window.pywebview.api) return;
            try {
                const resultado = await window.pywebview.api.verificar_actualizacion();
                if (resultado.disponible && resultado.url_descarga && resultado.version_remota) {
                    setEstado({
                        fase: 'disponible',
                        versionRemota: resultado.version_remota,
                        notas: resultado.notas ?? '',
                        urlDescarga: resultado.url_descarga,
                    });
                }
            } catch (error) {
                console.error('Error al verificar actualizaciones:', error);
            }
        };
        verificar();
    }, []);

    if (estado.fase === 'oculto') return null;

    const handleActualizar = async () => {
        if (estado.fase !== 'disponible') return;
        const confirmar = window.confirm(
            `Se descargará e instalará la versión ${estado.versionRemota}. La aplicación se cerrará durante el proceso. ¿Deseas continuar?`
        );
        if (!confirmar) return;

        setEstado({ fase: 'descargando' });
        try {
            const resultado = await window.pywebview.api.descargar_instalar_actualizacion(estado.urlDescarga);
            if (resultado.status !== 'ok') {
                setEstado({ fase: 'error', mensaje: resultado.message ?? 'No se pudo instalar la actualización.' });
            }
            // Si fue "ok", la aplicación se cerrará sola desde el backend en breve.
        } catch (error) {
            console.error('Error al descargar/instalar actualización:', error);
            setEstado({ fase: 'error', mensaje: 'No se pudo conectar con el backend para actualizar.' });
        }
    };

    return (
        <div className="update-banner">
            {estado.fase === 'disponible' && (
                <>
                    <Download size={18} className="update-banner-icon" />
                    <div className="update-banner-text">
                        <p className="update-banner-title">Nueva versión disponible: {estado.versionRemota}</p>
                        {estado.notas && <p className="update-banner-notes">{estado.notas}</p>}
                    </div>
                    <button className="update-banner-btn" onClick={handleActualizar}>
                        Actualizar ahora
                    </button>
                    <button
                        className="update-banner-dismiss"
                        onClick={() => setEstado({ fase: 'oculto' })}
                        title="Más tarde"
                    >
                        <X size={16} />
                    </button>
                </>
            )}
            {estado.fase === 'descargando' && (
                <div className="update-banner-text">
                    <p className="update-banner-title">Descargando actualización...</p>
                    <p className="update-banner-notes">La aplicación se cerrará automáticamente para completar la instalación.</p>
                </div>
            )}
            {estado.fase === 'error' && (
                <>
                    <div className="update-banner-text">
                        <p className="update-banner-title">Error al actualizar</p>
                        <p className="update-banner-notes">{estado.mensaje}</p>
                    </div>
                    <button className="update-banner-dismiss" onClick={() => setEstado({ fase: 'oculto' })} title="Cerrar">
                        <X size={16} />
                    </button>
                </>
            )}
        </div>
    );
};
