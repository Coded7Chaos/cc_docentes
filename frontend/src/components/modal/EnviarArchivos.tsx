import React, { useState, useRef } from 'react';
import './EnviarArchivos.css';

const imgIcon = "https://www.figma.com/api/mcp/asset/62bed080-b241-4cd9-80d0-8ecba5a7fb8d";
const imgIcon1 = "https://www.figma.com/api/mcp/asset/8a683b6d-0d58-44fb-89cf-cd9dae125ed2";
const imgBoxiconsCheckbox = "https://www.figma.com/api/mcp/asset/27eeaa8f-bf4e-47fe-92e6-d739a739e0da";
const imgGroup = "https://www.figma.com/api/mcp/asset/51d7e923-f4c1-462c-ba01-240470c33748";
const imgGroup1 = "https://www.figma.com/api/mcp/asset/22f6808c-00cc-4568-b35a-8b002c5da4db";
const imgIonTrashOutline = "https://www.figma.com/api/mcp/asset/b66bc9c1-7d25-4700-8e17-4b7f226d89ef";
const imgMynauiFile = "https://www.figma.com/api/mcp/asset/e93fca19-fb45-4790-aea8-9e21e5524625";
const imgMdiFileImage = "https://www.figma.com/api/mcp/asset/90154880-e2cc-4dc3-8e5d-b0edae0d710a";

interface EnviarArchivosProps {
  onBack: () => void;
  onStartServer: () => void;
}

interface FileData {
  id: string;
  name: string;
  selected: boolean;
  icon: string;
}

export const EnviarArchivos: React.FC<EnviarArchivosProps> = ({ onBack, onStartServer }) => {
  const [files, setFiles] = useState<FileData[]>([
    { id: '1', name: "Examen_historia_2026.pdf", selected: true, icon: imgGroup1 },
    { id: '2', name: "Instrucciones_generales.docx", selected: true, icon: imgMynauiFile },
    { id: '3', name: "Hoja_de_respuestas.png", selected: false, icon: imgMdiFileImage },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDropzoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      const newFiles: FileData[] = Array.from(selectedFiles).map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        selected: true,
        icon: file.type.includes('image') ? imgMdiFileImage : imgMynauiFile,
      }));
      setFiles([...files, ...newFiles]);
    }
    // Clear input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleFileSelection = (id: string) => {
    setFiles(files.map(f => f.id === id ? { ...f, selected: !f.selected } : f));
  };

  const toggleSelectAll = () => {
    const allSelected = files.every(f => f.selected);
    setFiles(files.map(f => ({ ...f, selected: !allSelected })));
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
          <img src={imgIcon} alt="Back" width="20" height="20" />
        </button>
        <div className="envio-header-text">
          <h2 className="envio-title">Panel de envío de archivos</h2>
          <p className="envio-subtitle">Seleccione archivos e inicie el servidor de transferencia</p>
        </div>
      </header>

      <main className="envio-body">
        <input 
          type="file" 
          multiple 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileChange}
        />
        <div className="dropzone" onClick={handleDropzoneClick}>
          <img src={imgIcon1} alt="Upload" width="36" height="36" />
          <p className="dropzone-text-primary">Arrastre archivos aquí o pulse para buscar</p>
          <p className="dropzone-text-secondary">PDF, DOCX, PNG, JPG y más</p>
        </div>

        <div className="selection-info">
          <div className="select-all-container" onClick={toggleSelectAll} style={{ cursor: 'pointer' }}>
            {allSelected ? (
              <div className="checkbox-checked">
                <img src={imgGroup} alt="Checked" width="14" height="14" />
              </div>
            ) : (
              <img src={imgBoxiconsCheckbox} alt="Unchecked" width="24" height="24" />
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
                    <div className="checkbox-checked">
                      <img src={imgGroup} alt="Checked" width="14" height="14" />
                    </div>
                  ) : (
                    <img src={imgBoxiconsCheckbox} alt="Unchecked" width="24" height="24" />
                  )}
                </div>
                <div className="file-name-container">
                  <img src={file.icon} alt="File" width={18} height={18} />
                  <p className="file-name">{file.name}</p>
                </div>
              </div>
              <button className="btn-delete" onClick={() => deleteFile(file.id)}>
                <img src={imgIonTrashOutline} alt="Delete" width="14" height="14" />
              </button>
            </div>
          ))}
        </div>
      </main>

      <footer className="envio-footer">
        <button 
          className="btn-start-send" 
          onClick={onStartServer}
          disabled={selectedCount === 0}
          style={{ opacity: selectedCount === 0 ? 0.6 : 1, cursor: selectedCount === 0 ? 'not-allowed' : 'pointer' }}
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
