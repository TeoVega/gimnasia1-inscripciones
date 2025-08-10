import axios from "axios";

const API_BASE = "https://gimnasia1-inscripciones.onrender.com/api";

export const obtenerEstadisticas = async () => {
  try {
    const res = await axios.get(`${API_BASE}/estadisticas`);
    return { data: res.data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const inscribirEstudiante = async (formData) => {
  try {
    const res = await axios.post(`${API_BASE}/inscribir`, {
      nombreCompleto: formData.nombreCompleto,
      cedula: formData.cedula,
      grupoReducido: formData.grupoReducido,
      masivoSeleccionado: parseInt(formData.masivoSeleccionado)
    });
    return { data: res.data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const obtenerConfiguracion = async () => {
  try {
    const res = await axios.get(`${API_BASE}/configuracion`);
    return { data: res.data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const actualizarConfiguracion = async (nuevoEstado) => {
  try {
    const res = await axios.put(`${API_BASE}/configuracion`, { inscripciones_habilitadas: nuevoEstado });
    return { data: res.data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const exportarExcel = async () => {
  const response = await fetch('/api/descargar-excel');
  
  if (!response.ok) {
    throw new Error('Error al descargar Excel');
  }
  
  // Crear blob y descargar automáticamente
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'inscripciones_por_masivos.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  
  return response;
};
