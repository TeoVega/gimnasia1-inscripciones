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
  try {
    console.log('=== INICIO DESCARGA FRONTEND ===');
    
    // Cambiar por tu URL real de Render
    const backendUrl = 'https://gimnasia1-inscripciones.onrender.com';
    const url = `${backendUrl}/api/descargar-excel`;
    
    console.log('Haciendo request a:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      console.log('Content type de error:', contentType);
      
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        console.error('Error JSON:', errorData);
        throw new Error(`Error del servidor: ${errorData.error || errorData.details || response.statusText}`);
      } else {
        const errorText = await response.text();
        console.error('Error texto:', errorText);
        throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
      }
    }
    
    const blob = await response.blob();
    console.log('Blob creado - Tamaño:', blob.size, 'Tipo:', blob.type);
    
    if (blob.size === 0) {
      throw new Error('El archivo descargado está vacío');
    }
    
    // Crear URL y descargar
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `inscripciones_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Asegurar que el enlace esté en el DOM
    document.body.appendChild(a);
    a.click();
    
    // Limpiar
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
    
    console.log('=== DESCARGA COMPLETADA ===');
    return response;
    
  } catch (error) {
    console.error('=== ERROR EN DESCARGA FRONTEND ===');
    console.error('Error completo:', error);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    // Mostrar error más específico al usuario
    alert(`Error al descargar: ${error.message}`);
    throw error;
  }
};

// FUNCIÓN DE PRUEBA
export const testDownload = async () => {
  try {
    const backendUrl = 'https://gimnasia1-inscripciones.onrender.com';
    const response = await fetch(`${backendUrl}/api/test-download`);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error en test:', error);
    alert('Error en test: ' + error.message);
  }
};
