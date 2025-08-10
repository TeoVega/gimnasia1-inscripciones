import { useState, useEffect } from "react";
import {
  obtenerEstadisticas,
  inscribirEstudiante as apiInscribirEstudiante,
  obtenerConfiguracion,
  actualizarConfiguracion,
  exportarCSV as apiExportarCSV,
} from "../api";

const useInscripciones = () => {
  const [estadisticas, setEstadisticas] = useState([]);
  const [configuracion, setConfiguracion] = useState({ inscripciones_habilitadas: true });
  const [loading, setLoading] = useState(true);

  const cargarEstadisticas = async () => {
    const { data } = await obtenerEstadisticas();
    if (data) setEstadisticas(data);
  };

  const cargarConfiguracion = async () => {
    const { data } = await obtenerConfiguracion();
    if (data) setConfiguracion(data);
    setLoading(false);
  };

  const inscribirEstudiante = async (formData) => {
    const { data } = await apiInscribirEstudiante(formData);
    return data;
  };

  const toggleInscripciones = async (nuevoEstado) => {
    const { data } = await actualizarConfiguracion(nuevoEstado);
    return data;
  };

  const exportarCSV = async () => {
    return await apiExportarCSV();
  };

  useEffect(() => {
    cargarEstadisticas();
    cargarConfiguracion();
    // Opcional: polling para multiusuario cada 10 segundos
    const interval = setInterval(() => {
      cargarEstadisticas();
      cargarConfiguracion();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return {
    estadisticas,
    configuracion,
    loading,
    inscribirEstudiante,
    toggleInscripciones,
    exportarCSV,
    recargarDatos: () => {
      cargarEstadisticas();
      cargarConfiguracion();
    },
  };
};

export default useInscripciones;