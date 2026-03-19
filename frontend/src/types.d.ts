export {};

declare global {
  interface Window {
    pywebview: {
      api: {
        obtener_ruta_escritorio: () => Promise<string>;
        obtener_estado_red: () => Promise<{conectado: boolean, ip: string, mensaje: string}>;
        seleccionar_carpeta: () => Promise<string | null>;
        abrir_archivos: () => Promise<Array<{path: string, nombre: string, extension: string}>>;
        iniciar_servidor: (materia: string, password: string, modo: string, ruta_base: string) => Promise<any>;
        iniciar_servidor_envio: (archivos: Array<{path: string, nombre: string, extension: string}>) => Promise<any>;
        detener_servidor: () => Promise<any>;
        abrir_carpeta: () => void;
        obtener_alumnos_directo: () => Promise<any[]>;
      }
    }
  }
}
