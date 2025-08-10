import React, { useState, useEffect } from 'react';
import useInscripciones from './hooks/useInscripciones';
import { Users, Clock, Calendar, CheckCircle, AlertCircle, Download, Settings, Lock, Unlock, Loader2 } from 'lucide-react';
import axios from 'axios';
import LockIcon from '@mui/icons-material/Lock';
import DownloadIcon from '@mui/icons-material/Download';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';


const API = "https://gimnasia1-inscripciones.onrender.com/api";

function App() {
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState({
    nombre: '',
    cedula: '',
    grupoReducido: '',
    masivo: '',
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [inscriptionEnabled, setInscriptionEnabled] = useState(true);
  const [controlsUnlocked, setControlsUnlocked] = useState(false);

  useEffect(() => {
    fetchCupos();
  }, []);

  const fetchCupos = async () => {
    const { data } = await axios.get(`${API}/cupos`);
    setGroups(data.grupos);
    setInscriptionEnabled(data.inscriptionEnabled);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');
    try {
      const { data } = await axios.post(`${API}/inscribir`, form);
      if (data.deleted) setStatus('Todos los resultados borrados.');
      else setStatus('Inscripción exitosa.');
      setForm({ nombre: '', cedula: '', grupoReducido: '', masivo: '' });
      fetchCupos();
    } catch (err) {
      setStatus(err.response?.data?.error || 'Error al inscribir');
    }
    setLoading(false);
  };

  const toggleInscription = async () => {
    await axios.post(`${API}/habilitar`, { enabled: !inscriptionEnabled });
    fetchCupos();
  };

  const downloadExcel = () => {
    window.open(`${API}/excel`, '_blank');
  };

  return (
    <div style={{ maxWidth: 520, margin: '30px auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>Gimnasia 1 - 2025</h1>
      <div style={{ background: '#f3f3f3', padding: 16, borderRadius: 8, marginBottom: 18 }}>
        <h3>Información Importante</h3>
        <ul>
          <li>Solo puedes inscribirte en un grupo masivo.</li>
          <li>El cupo máximo por grupo es de 120 estudiantes.</li>
          <li>Si el grupo está lleno, el sistema bloqueará la inscripción.</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
        <label>
          Nombre Completo
          <input
            type="text"
            required
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            style={{ width: '100%', margin: '8px 0' }}
          />
        </label>
        <label>
          Cédula de Identidad
          <input
            type="text"
            required
            value={form.cedula}
            onChange={(e) => setForm({ ...form, cedula: e.target.value })}
            style={{ width: '100%', margin: '8px 0' }}
          />
        </label>
        <label>
          Grupo Reducido
          <input
            type="text"
            required
            value={form.grupoReducido}
            onChange={(e) => setForm({ ...form, grupoReducido: e.target.value })}
            style={{ width: '100%', margin: '8px 0' }}
          />
        </label>
        <label>
          Masivo Teórico
          <select
            required
            value={form.masivo}
            onChange={(e) => setForm({ ...form, masivo: e.target.value })}
            style={{ width: '100%', margin: '8px 0' }}
          >
            <option value="">Elija un grupo</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id} disabled={g.cupo >= 120}>
                {g.name} - {g.horario} ({g.cupo}/{120} ocupados)
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={loading || !inscriptionEnabled} style={{
          width: '100%',
          background: inscriptionEnabled ? '#1976d2' : '#d32f2f',
          color: 'white',
          border: 'none',
          padding: '12px',
          borderRadius: '4px',
          cursor: inscriptionEnabled ? 'pointer' : 'not-allowed'
        }}>
          Inscribirse
        </button>
        <div style={{ marginTop: 10, color: status.includes('Error') ? 'red' : 'green' }}>
          {status}
        </div>
      </form>

      {/* Controles administrativos, ocultos y bloqueados por defecto */}
      <div style={{ position: 'relative', minHeight: 50 }}>
        <div style={{ position: 'absolute', right: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Candado para desbloquear */}
          <button
            style={{
              background: controlsUnlocked ? '#1976d2' : '#aaa',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: 36,
              height: 36,
              cursor: 'pointer'
            }}
            onClick={() => setControlsUnlocked((prev) => !prev)}
            title={controlsUnlocked ? 'Bloquear controles' : 'Desbloquear controles'}
          >
            <LockIcon />
          </button>

          {/* Descargar Excel */}
          <button
            style={{
              background: controlsUnlocked ? '#1976d2' : '#ddd',
              color: controlsUnlocked ? 'white' : '#999',
              border: 'none',
              borderRadius: '50%',
              width: 36,
              height: 36,
              cursor: controlsUnlocked ? 'pointer' : 'not-allowed'
            }}
            disabled={!controlsUnlocked}
            onClick={downloadExcel}
            title="Descargar Excel"
          >
            <DownloadIcon />
          </button>

          {/* Habilitar/deshabilitar inscripción */}
          <button
            style={{
              background: !controlsUnlocked
                ? '#ddd'
                : inscriptionEnabled
                ? '#388e3c'
                : '#d32f2f',
              color: controlsUnlocked ? 'white' : '#999',
              border: 'none',
              borderRadius: '50%',
              width: 36,
              height: 36,
              cursor: controlsUnlocked ? 'pointer' : 'not-allowed'
            }}
            disabled={!controlsUnlocked}
            onClick={toggleInscription}
            title={inscriptionEnabled ? 'Deshabilitar inscripción' : 'Habilitar inscripción'}
          >
            <PowerSettingsNewIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
