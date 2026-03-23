import React, { useState, useEffect } from 'react';
import { ArrowLeft, UploadCloud, Square, CheckSquare, Trash2, FileText, FileImage, File, WifiOff } from 'lucide-react';
import './EnviarArchivos.css';

interface EnviarArchivosProps {
  onBack: () => void;
  onStartServer: (data: { url: string; ruta: string }) => void;
}

interface FileData {
  id: string;
  name: string;
  path: string;
  selected: boolean;
  extension: string;
}

const getFileIcon = (ext: string) => {
  if (['.pdf'].includes(ext)) return <FileText className="file-icon-svg pdf" size={18} />;
  if (['.jpg', '.jpeg', '.png', '.gif', '.svg'].includes(ext)) return <FileImage className="file-icon-svg image" size={18} />;
  return <File className="file-icon-svg" size={18} />;
};

export const EnviarArchivos: React.FC<EnviarArchivosProps> = ({ onBack, onStartServer }) => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [networkStatus, setNetworkStatus] = useState({ conectado: true, mensaje: '' });

  // Verificar red al cargar
  useEffect(() => {
    const checkNetwork = async () => {
      if (window.pywebview && window.pywebview.api) {
        try {
          const status = await window.pywebview.api.obtener_estado_red();
          setNetworkStatus({ conectado: status.conectado, mensaje: status.mensaje });
        } catch (error) {
          console.error("Error al verificar red:", error);
        }
      }
    };
    checkNetwork();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processFiles = async (fileList: FileList | File[]) => {
    setIsLoading(true);
    const newFiles: FileData[] = [];

    for (const file of Array.from(fileList)) {
      const name = file.name;
      const dotIndex = name.lastIndexOf('.');
      const extension = dotIndex !== -1 ? name.substring(dotIndex).toLowerCase() : '';
      
      // Intentar obtener ruta directa (algunos sistemas lo permiten)
      let path = (file as any).path || '';

      if (!path && window.pywebview && window.pywebview.api) {
        // Si no hay ruta (Drag and Drop normal), enviamos el contenido al backend para que lo guarde en temp
        try {
          const content = await readFileAsBase64(file);
          const result = await (window.pywebview.api as any).guardar_archivo_temporal(name, content);
          if (result.status === "ok") {
            path = result.path;
          }
        } catch (error) {
          console.error("Error al transferir archivo arrastrado:", error);
        }
      }

      if (path) {
        newFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          name: name,
          path: path, 
          selected: true,
          extension: extension
        });
      }
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
    }
    setIsLoading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleBrowseFiles = async () => {
    if (window.pywebview && window.pywebview.api) {
      setIsLoading(true);
      try {
        const selected = await window.pywebview.api.abrir_archivos();
        if (selected && selected.length > 0) {
          const newFiles: FileData[] = selected.map(f => ({
            id: Math.random().toString(36).substr(2, 9),
            name: f.nombre,
            path: f.path,
            selected: true,
            extension: f.extension
          }));
          setFiles(prev => [...prev, ...newFiles]);
        }
      } catch (error) {
        console.error("Error al abrir archivos:", error);
      }
      setIsLoading(false);
    } else {
      // Mock para dev
      alert("Abriendo diálogo de archivos (Simulado)");
    }
  };

  const handleStartServer = async () => {
    const selectedFiles = files.filter(f => f.selected);
    if (selectedFiles.length === 0) return;

    if (!networkStatus.conectado) {
        const continuar = window.confirm("Aviso: No se detecta una red local. Los alumnos no podrán descargar los archivos a menos que actives un Hotspot. ¿Deseas iniciar el servidor de todas formas?");
        if (!continuar) return;
    }

    setIsLoading(true);
    if (window.pywebview && window.pywebview.api) {
      try {
        const dataForBackend = selectedFiles.map(f => ({
          path: f.path,
          nombre: f.name,
          extension: f.extension
        }));

        const result = await window.pywebview.api.iniciar_servidor_envio(dataForBackend);
        if (result.status === "ok") {
          onStartServer({ url: result.url, ruta: "" }); 
        } else {
          alert("Error: " + result.message);
        }
      } catch (error) {
        console.error("Error al iniciar servidor de envío:", error);
      }
    } else {
      // Mock
      onStartServer({ url: "http://192.168.1.100:5000", ruta: "" });
    }
    setIsLoading(false);
  };

  const toggleFileSelection = (id: string) => {
    setFiles(files.map(f => f.id === id ? { ...f, selected: !f.selected } : f));
  };

  const toggleSelectAll = () => {
    const allAreSelected = files.length > 0 && files.every(f => f.selected);
    setFiles(files.map(f => ({ ...f, selected: !allAreSelected })));
  };

  const deleteFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const selectedCount = files.filter(f => f.selected).length;
  const allSelected = files.length > 0 && files.every(f => f.selected);

  return (
    <div className="enviar-archivos">
      <header className="envio-header">
        <button className="btn-back-dark" onClick={onBack}>
          <ArrowLeft size={20} color="#f1f5f9" />
        </button>
        <div className="envio-header-text">
          <h2 className="envio-title">Panel de envío de archivos</h2>
          <p className="envio-subtitle">Seleccione archivos e inicie el servidor de transferencia</p>
        </div>
      </header>

      <main className="envio-body">
        {!networkStatus.conectado && (
            <div className="network-warning-banner">
                <WifiOff size={18} />
                <p>{networkStatus.mensaje}</p>
            </div>
        )}

        <div 
          className={`dropzone ${isDragging ? 'dragging' : ''} ${isLoading ? 'loading' : ''}`} 
          onClick={isLoading ? undefined : handleBrowseFiles}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <UploadCloud size={36} color={isLoading ? "#94a3b8" : "#3c5bb1"} className={isLoading ? "animate-pulse" : ""} />
          <p className="dropzone-text-primary">
            {isLoading ? "Procesando archivos... por favor espera" : isDragging ? "Suelta los archivos aquí" : "Pulse aquí para buscar y añadir archivos"}
          </p>
          <p className="dropzone-text-secondary">
            {isLoading ? "Estamos preparando tus archivos para el envío" : "PDF, DOCX, PNG, JPG y más"}
          </p>
        </div>

        <div className="selection-info">
          <div className="select-all-container" onClick={toggleSelectAll} style={{ cursor: 'pointer' }}>
            {allSelected ? (
              <CheckSquare size={24} color="#15803d" />
            ) : (
              <Square size={24} color="#475569" />
            )}
            <p className="selection-text">Seleccionar todos</p>
          </div>
          <p className="selection-count">{selectedCount}/{files.length} seleccionados</p>
        </div>

        <div className="file-list">
          {files.map((file) => (
            <div key={file.id} className="file-item">
              <div className="file-info">
                <div 
                  className="checkbox-wrapper" 
                  onClick={() => toggleFileSelection(file.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {file.selected ? (
                    <CheckSquare size={20} color="#15803d" />
                  ) : (
                    <Square size={20} color="#475569" />
                  )}
                </div>
                <div className="file-name-container">
                  {getFileIcon(file.extension)}
                  <p className="file-name">{file.name}</p>
                </div>
              </div>
              <button className="btn-delete" onClick={() => deleteFile(file.id)}>
                <Trash2 size={16} color="#ef4444" />
              </button>
            </div>
          ))}
          {files.length === 0 && (
            <div className="empty-files">
                No hay archivos seleccionados
            </div>
          )}
        </div>
      </main>

      <footer className="envio-footer">
        <button 
          className="btn-start-send" 
          onClick={handleStartServer}
          disabled={selectedCount === 0 || isLoading}
          style={{ opacity: (selectedCount === 0 || isLoading) ? 0.6 : 1, cursor: (selectedCount === 0 || isLoading) ? 'not-allowed' : 'pointer' }}
        >
          <span className="btn-start-send-text">INICIAR SERVIDOR</span>
        </button>
        <p className="footer-disclaimer">
          {selectedCount === 0 
            ? "Seleccione al menos un archivo para continuar" 
            : `Se compartirán ${selectedCount} archivo${selectedCount !== 1 ? 's' : ''} de manera segura`
          }
        </p>
      </footer>
    </div>
  );
};
