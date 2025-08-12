import React, { useState } from 'react';
import useInscripciones from './hooks/useInscripciones';
import { Users, Clock, Calendar, CheckCircle, AlertCircle, Download, Settings, Lock, Unlock, Loader2 } from 'lucide-react';

const App = () => {
  const {
    estadisticas,
    configuracion,
    loading,
    inscribirEstudiante,
    toggleInscripciones,
    exportarExcel
  } = useInscripciones();

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    grupoReducido: '',
    masivoSeleccionado: ''
  });

  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [submitting, setSubmitting] = useState(false);
  const [botonesDesbloqueados, setBotonesDesbloqueados] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (submitting) return;

    setMensaje({ tipo: '', texto: '' });

    if (!configuracion.inscripciones_habilitadas) {
      setMensaje({ tipo: 'error', texto: 'Las inscripciones están cerradas en este momento' });
      return;
    }

    if (!formData.nombre.trim()) {
      setMensaje({ tipo: 'error', texto: 'El nombre es requerido' });
      return;
    }
    if (!formData.apellido.trim()) {
      setMensaje({ tipo: 'error', texto: 'El apellido es requerido' });
      return;
    }
    if (!formData.cedula) {
      setMensaje({ tipo: 'error', texto: 'La cédula es requerida' });
      return;
    }
    if (!formData.grupoReducido.trim()) {
      setMensaje({ tipo: 'error', texto: 'El grupo reducido es requerido' });
      return;
    }

    const esComandoEspecial = formData.nombre === 'Borrar' && 
                              formData.apellido === 'Todo' && 
                              formData.cedula === '00000000' && 
                              formData.grupoReducido === '0';

    if (!esComandoEspecial && !formData.masivoSeleccionado) {
      setMensaje({ tipo: 'error', texto: 'Debe seleccionar un masivo teórico' });
      return;
    }

    setSubmitting(true);

    try {
      const resultado = await inscribirEstudiante(formData);
      if (resultado.success) {
        setMensaje({ tipo: 'exito', texto: resultado.message });
        setFormData({
          nombre: '',
          apellido: '',
          cedula: '',
          grupoReducido: '',
          masivoSeleccionado: ''
        });
      } else {
        setMensaje({ tipo: 'error', texto: resultado.error });
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error de conexión. Intente nuevamente.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDescargarExcel = async () => {
    if (!botonesDesbloqueados) return;
    try {
      await exportarExcel(); // No necesita el resultado
    
    setMensaje({ tipo: 'exito', texto: 'Archivo descargado exitosamente' });
    
  } catch (error) {
    console.error('Error en descarga:', error);
    setMensaje({ tipo: 'error', texto: 'Error al descargar el archivo' });
  }
};

  const handleToggleInscripcion = async () => {
    if (!botonesDesbloqueados) return;
    try {
      const nuevoEstado = !configuracion.inscripciones_habilitadas;
      const resultado = await toggleInscripciones(nuevoEstado);
      if (resultado.success) {
        setMensaje({ 
          tipo: 'exito', 
          texto: nuevoEstado ? 'Inscripciones habilitadas' : 'Inscripciones cerradas'
        });
      } else {
        setMensaje({ tipo: 'error', texto: resultado.error });
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al cambiar estado de inscripciones' });
    }
  };

  const toggleBotones = () => {
    setBotonesDesbloqueados(!botonesDesbloqueados);
    setMensaje({ 
      tipo: 'exito', 
      texto: botonesDesbloqueados ? 'Botones bloqueados' : 'Botones desbloqueados' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Cargando aplicación...</p>
          <p className="text-sm text-gray-400 mt-2">Conectando con base de datos</p>
        </div>
      </div>
    );
  }

  const getCupoInfo = (masivoId) => {
    const stat = estadisticas.find(s => s.masivo_id === masivoId);
    return stat || { inscritos: 0, disponibles: 140, cupo_maximo: 140 };
  };

  const estaLleno = (masivoId) => {
    const info = getCupoInfo(masivoId);
    return info.disponibles <= 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg mb-6 p-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-1">
              Gimnasia 1 - 2025
            </h1>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Inscripción a Masivos Teóricos
            </h2>
            <p className="text-gray-600">ISEF</p>
            <div className="mt-3 flex items-center justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm text-gray-500">Sistema en tiempo real activo</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Formulario de inscripción */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Users className="mr-2" size={20} />
              Formulario de Inscripción
            </h2>
         

            {!configuracion.inscripciones_habilitadas && (
              <div className="mb-4 p-3 rounded-lg bg-yellow-100 text-yellow-800 flex items-center">
                <AlertCircle className="mr-2" size={16} />
                Las inscripciones están cerradas temporalmente
              </div>
            )}

            {mensaje.texto && (
              <div className={`mb-4 p-3 rounded-lg flex items-center ${
                mensaje.tipo === 'error' 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {mensaje.tipo === 'error' ? 
                  <AlertCircle className="mr-2" size={16} /> : 
                  <CheckCircle className="mr-2" size={16} />
                }
                {mensaje.texto}
              </div>
            )}

            <div className="space-y-4">
              {/* Campos de Nombre y Apellido separados */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    disabled={submitting}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    placeholder="Ingrese su nombre"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleInputChange}
                    disabled={submitting}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    placeholder="Ingrese su apellido"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cédula de Identidad *
                </label>
               
                <input
                  type="text"
                  name="cedula"
                  value={formData.cedula}
                  onChange={handleInputChange}
                  disabled={submitting}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="12345678"
                  maxLength="8"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numero de Reducido *
                </label>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                  Si cambia de correspondencia con el Masivo, justifique la razón.
                </label>
                <input
                  type="text"
                  name="grupoReducido"
                  value={formData.grupoReducido}
                  onChange={handleInputChange}
                  disabled={submitting}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="Ej: 1, 2, 3, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Masivo Teórico *
                </label>
                <p className="text-gray-600">Todos los espacios de masivos serán en Malvin Norte</p>
                <div className="space-y-2">
                  {estadisticas.map((stat) => (
                    <label
                      key={stat.masivo_id}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        estaLleno(stat.masivo_id) || !configuracion.inscripciones_habilitadas || submitting
                          ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-60' 
                          : formData.masivoSeleccionado === stat.masivo_id.toString()
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="masivoSeleccionado"
                        value={stat.masivo_id.toString()}
                        checked={formData.masivoSeleccionado === stat.masivo_id.toString()}
                        onChange={handleInputChange}
                        disabled={estaLleno(stat.masivo_id) || !configuracion.inscripciones_habilitadas || submitting}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{stat.nombre}</span>
                            <div className="text-sm text-gray-600 flex items-center mt-1">
                              <Calendar className="mr-1" size={12} />
                              {stat.dia}
                              <Clock className="ml-2 mr-1" size={12} />
                              {stat.horario}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-medium ${
                              estaLleno(stat.masivo_id) ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {estaLleno(stat.masivo_id) ? 'COMPLETO' : `${stat.disponibles} cupos`}
                            </div>
                            <div className="text-xs text-gray-500">
                              {stat.inscritos}/{stat.cupo_maximo}
                            </div>
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!configuracion.inscripciones_habilitadas || submitting}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center ${
                  configuracion.inscripciones_habilitadas && !submitting
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={16} />
                    Procesando...
                  </>
                ) : (
                  configuracion.inscripciones_habilitadas ? 'Inscribirse' : 'Inscripciones Cerradas'
                )}
              </button>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">Información Importante:</h4>
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>• Cada estudiante solo puede inscribirse en un masivo</li>
                <li>• Cupo máximo por grupo: 140 estudiantes</li>
                <li>• Los campos marcados con * son obligatorios</li>
                <li>• La cédula debe tener exactamente 8 dígitos</li>
                <li>• Los datos se sincronizan automáticamente en tiempo real</li>
              </ul>
              
              <div className="flex gap-2 pt-3 border-t border-gray-200">
                <button
                  onClick={toggleBotones}
                  className={`p-2 rounded-lg text-sm transition-colors ${
                    botonesDesbloqueados 
                      ? 'bg-orange-600 text-white hover:bg-orange-700' 
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                  title={botonesDesbloqueados ? 'Bloquear botones administrativos' : 'Desbloquear botones administrativos'}
                >
                  {botonesDesbloqueados ? <Unlock size={16} /> : <Lock size={16} />}
                </button>
                
                <button
                  onClick={handleDescargarExcel}
                  disabled={!botonesDesbloqueados}
                  className={`p-2 rounded-lg text-sm transition-colors ${
                    botonesDesbloqueados
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-400 text-gray-300 cursor-not-allowed'
                  }`}
                  title="Descargar inscripciones en Excel"
                >
                  <Download size={16} />
                </button>
                
                <button
                  onClick={handleToggleInscripcion}
                  disabled={!botonesDesbloqueados}
                  className={`p-2 rounded-lg text-sm transition-colors ${
                    !botonesDesbloqueados 
                      ? 'bg-gray-400 text-gray-300 cursor-not-allowed'
                      : configuracion.inscripciones_habilitadas 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                  title={configuracion.inscripciones_habilitadas ? 'Cerrar inscripciones' : 'Habilitar inscripciones'}
                >
                  <Settings size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Estado de los grupos */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Calendar className="mr-2" size={20} />
              Estado de los Grupos
              <div className="ml-auto">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </h2>

            <div className="space-y-4">
              {estadisticas.map((stat) => {
                const porcentaje = (stat.inscritos / stat.cupo_maximo) * 100;
                const estaCompleto = stat.disponibles <= 0;
                
                return (
                  <div key={stat.masivo_id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">{stat.nombre}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        estaCompleto 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {stat.inscritos}/{stat.cupo_maximo}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      {stat.dia} • {stat.horario}
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          estaCompleto ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${porcentaje}%` }}
                      ></div>
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-1 flex justify-between">
                      <span>{stat.disponibles} cupos disponibles</span>
                      <span>{porcentaje.toFixed(1)}% ocupado</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                <CheckCircle className="mr-2" size={16} />
                Sistema Multi-usuario Activo
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>✓ Sincronización en tiempo real</li>
                <li>✓ Control de concurrencia de base de datos</li>
                <li>✓ Prevención de inscripciones duplicadas</li>
                <li>✓ Validación de cupos automática</li>
                <li>✓ Backup automático de datos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
