import { useState, useEffect } from 'react'

function App() {
  const [isStarted, setIsStarted] = useState(false);
  const [form, setForm] = useState({ materia: '', password: '', modo: 'sobreescribir' });
  const [alumnos, setAlumnos] = useState([]);
  const [url, setUrl] = useState('');
  const [rutaGuardado, setRutaGuardado] = useState('Cargando...');

useEffect( () => {
  const cargarRutaPorDefecto = async () => {
    if (window.pywebview) {
      const rutaDefault = await window.pywebview.api.obtener_ruta_escritorio();
      setRutaGuardado(rutaDefault);
    } else{
      window.addEventListener('pywebviewready', async () => {
        const rutaDefault = await window.pywebview.api.obtener_ruta_escritorio();
        setRutaGuardado(rutaDefault);
      });
    }
  };

  cargarRutaPorDefecto();
}, []);

useEffect(() => {
    let intervalo;
    if (isStarted) {
      intervalo = setInterval(async () => {
        try {
          const data = await window.pywebview.api.obtener_alumnos_directo();
          setAlumnos(data);
        } catch (error) {
          console.log("Leyendo memoria...");
        }
      }, 2000);
    }

    return () => clearInterval(intervalo);
  }, [isStarted]);


  const handleCambiarRuta = async () => {
    const nuevaRuta = await window.pywebview.api.seleccionar_carpeta();
    if (nuevaRuta){
      setRutaGuardado(nuevaRuta);
    }
  };

  const handleStart = async () => {
    if (!form.materia || !form.password) return alert("Llena todos los campos");
    const res = await window.pywebview.api.iniciar_servidor(form.materia, form.password, form.modo, rutaGuardado);
    if(res.status === 'ok'){
      setUrl(res.url);
      setIsStarted(true);
      }else{
        alert(res.message);
      }
  }

  const handleAbrirCarpeta = () => {
    window.pywebview.api.abrir_carpeta();
  }

return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      {!isStarted ? (
        <div>
          <h1>Configuración del Examen</h1>
          <input 
            style={{ display: 'block', margin: '10px 0', padding: '8px' }}
            onChange={(e) => setForm({...form, materia: e.target.value})} 
            placeholder="Nombre de la Materia" 
          />
          <input 
            style={{ display: 'block', margin: '10px 0', padding: '8px' }}
            onChange={(e) => setForm({...form, password: e.target.value})} 
            type="password" 
            placeholder="Contraseña" 
          />
          <select 
            style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
            onChange={(e) => setForm({...form, modo: e.target.value})}
            value={form.modo}
          >
            <option value="sobreescribir">Modo Estricto: solo se acepta un envío de varios, el último en enviarse si hay más de un envío </option>
            <option value="historial">Modo Historial: acepta múltiples envíos especificando la hora del envío  </option>
          </select>


        <div style={{ background: '#f0f0f0', padding: '10px', borderRadius: '5px', margin: '15px 0' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#555' }}>Lugar de guardado de los exámenes:</p>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="text" 
                value={rutaGuardado} 
                readOnly 
                style={{ flex: 1, padding: '8px', background: '#e9ecef', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <button 
                onClick={handleCambiarRuta} 
                style={{ padding: '8px 15px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cambiar...
              </button>
            </div>
          </div>


          <button style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none' }} onClick={handleStart}>
            INICIAR SERVIDOR
          </button>
        </div>
      ) : (
        <div>
          <h2>Monitoreo en vivo: {form.materia}</h2>
          <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', border: '2px dashed #007bff', textAlign: 'center', margin: '20px 0' }}>
            <p style={{ margin: 0, color: '#555' }}>Pide a los alumnos que ingresen a esta dirección:</p>
            <h1 style={{ margin: '10px 0', color: '#0056b3', letterSpacing: '1px' }}>{url}</h1>
          </div>
          <h3 style={{ color: '#007bff' }}>Entregas recibidas: {alumnos.length}</h3>
          
          <ul style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
            {alumnos.length === 0 ? <p>Esperando entregas...</p> : null}
            {alumnos.map((alumno, index) => (
              <li key={index} style={{ margin: '5px 0', fontWeight: 'bold' }}>
                ✅ {alumno}
              </li>
            ))}
          </ul>

          <button style={{ padding: '10px 20px', background: '#ffc107', border: 'none', marginTop: '20px' }} onClick={handleAbrirCarpeta}>
            📁 Abrir Carpeta de Entregas
          </button>
        </div>
      )}
    </div>
  )
}

export default App