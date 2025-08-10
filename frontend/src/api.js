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

export const exportarCSV = async () => {
  try {
    const res = await axios.get(`${API_BASE}/descargar-csv`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Inscripciones_Gimnasia1.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};