import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';

dotenv.config();

const PORT = process.env.PORT || 4000;

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: SUPABASE_URL y SUPABASE_ANON_KEY son requeridas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
app.use(cors({
  origin: [
    'https://gimnasia1-inscripciones-esto.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));
app.options('*', cors());

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: 'API de Inscripciones funcionando correctamente con Supabase',
    endpoints: [
      '/api/inscripciones',
      '/api/masivos',
      '/api/descargar-excel',
      '/api/estadisticas'
    ]
  });
});

// Función para inicializar datos por defecto
async function initializeDefaultData() {
  try {
    // Verificar si ya existe configuración
    const { data: config } = await supabase
      .from('configuracion')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (!config) {
      // Crear configuración por defecto
      await supabase
        .from('configuracion')
        .insert({ id: 1, inscripciones_habilitadas: true });
      console.log('Configuración por defecto creada');
    }
  } catch (error) {
    console.error('Error inicializando datos:', error);
  }
}

// Inicializar datos por defecto
initializeDefaultData();

// Endpoints

// GET /api/configuracion
app.get('/api/configuracion', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('configuracion')
      .select('inscripciones_habilitadas')
      .eq('id', 1)
      .single();
    
    if (error) {
      console.error('Error obteniendo configuración:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    
    res.json({ inscripciones_habilitadas: !!data?.inscripciones_habilitadas });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/configuracion
app.put('/api/configuracion', async (req, res) => {
  try {
    const { error } = await supabase
      .from('configuracion')
      .update({ inscripciones_habilitadas: !!req.body.inscripciones_habilitadas })
      .eq('id', 1);
    
    if (error) {
      console.error('Error actualizando configuración:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/estadisticas
app.get('/api/estadisticas', async (req, res) => {
  try {
    // Obtener masivos activos
    const { data: masivos, error: masivoError } = await supabase
      .from('masivos')
      .select('*')
      .eq('activo', true);
    
    if (masivoError) {
      console.error('Error obteniendo masivos:', masivoError);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    
    const stats = [];
    
    for (const masivo of masivos) {
      // Contar inscripciones para cada masivo
      const { count, error: countError } = await supabase
        .from('inscripciones')
        .select('*', { count: 'exact', head: true })
        .eq('masivo_id', masivo.id);
      
      if (countError) {
        console.error('Error contando inscripciones:', countError);
        continue;
      }
      
      stats.push({
        masivo_id: masivo.id,
        nombre: masivo.nombre,
        dia: masivo.dia,
        horario: masivo.horario,
        cupo_maximo: masivo.cupo_maximo,
        inscritos: count || 0,
        disponibles: masivo.cupo_maximo - (count || 0)
      });
    }
    
    res.json(stats);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/inscribir - VERSIÓN ACTUALIZADA
app.post('/api/inscribir', async (req, res) => {
  try {
    const { nombre, apellido, cedula, grupoReducido, masivoSeleccionado } = req.body;

    // Validaciones
    if (!nombre || !apellido || !cedula || !grupoReducido || !masivoSeleccionado) {
      return res.json({ success: false, error: 'Todos los campos son obligatorios' });
    }
    if (!/^\d{8}$/.test(cedula)) {
      return res.json({ success: false, error: 'Cédula debe tener 8 dígitos' });
    }

    // Verificar configuración
    const { data: config, error: configError } = await supabase
      .from('configuracion')
      .select('inscripciones_habilitadas')
      .eq('id', 1)
      .single();
    
    if (configError || !config?.inscripciones_habilitadas) {
      return res.json({ success: false, error: 'Inscripciones cerradas' });
    }

    // Verificar duplicados
    const { data: existeInscripcion } = await supabase
      .from('inscripciones')
      .select('*')
      .eq('cedula', cedula)
      .single();
    
    if (existeInscripcion) {
      return res.json({ success: false, error: 'Ya está inscripto' });
    }

    // Verificar cupo
    const { count: inscriptosActuales } = await supabase
      .from('inscripciones')
      .select('*', { count: 'exact', head: true })
      .eq('masivo_id', masivoSeleccionado);
    
    const { data: masivo, error: masivoError } = await supabase
      .from('masivos')
      .select('cupo_maximo')
      .eq('id', masivoSeleccionado)
      .single();
    
    if (masivoError || !masivo) {
      return res.json({ success: false, error: 'Masivo no encontrado' });
    }
    
    if ((inscriptosActuales || 0) >= masivo.cupo_maximo) {
      return res.json({ success: false, error: 'Cupo completo' });
    }

    // Insertar inscripción - INCLUIR NOMBRE_COMPLETO PARA COMPATIBILIDAD
    const { error: insertError } = await supabase
      .from('inscripciones')
      .insert({
        nombre: nombre,
        apellido: apellido,
        nombre_completo: `${nombre} ${apellido}`, // ← AGREGAR ESTA LÍNEA
        cedula: cedula,
        grupo_reducido: grupoReducido,
        masivo_id: masivoSeleccionado,
        created_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error('Error insertando inscripción:', insertError);
      return res.json({ success: false, error: 'Error al procesar inscripción' });
    }
    
    res.json({ success: true, message: 'Inscripción exitosa' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/descargar-excel', async (req, res) => {
  try {
    console.log('=== INICIO DESCARGA EXCEL ===');
    
    // Obtener inscripciones con datos del masivo
    const { data: inscripciones, error } = await supabase
      .from('inscripciones')
      .select(`
        *,
        masivos:masivo_id (
          nombre,
          dia,
          horario
        )
      `)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error obteniendo inscripciones:', error);
      return res.status(500).json({ error: 'Error obteniendo datos' });
    }

    console.log(`Inscripciones encontradas: ${inscripciones?.length || 0}`);
    
    if (!inscripciones || inscripciones.length === 0) {
      console.log('No hay inscripciones, devolviendo error 404');
      return res.status(404).json({ error: 'No hay inscripciones para exportar' });
    }

    // Mostrar una inscripción de ejemplo
    console.log('Ejemplo de inscripción:', JSON.stringify(inscripciones[0], null, 2));

    // Agrupar por masivos
    const gruposPorMasivo = inscripciones.reduce((acc, ins) => {
      const masivo = ins.masivos?.nombre || 'Sin masivo';
      if (!acc[masivo]) {
        acc[masivo] = [];
      }
      acc[masivo].push(ins);
      return acc;
    }, {});

    console.log(`Grupos de masivos creados: ${Object.keys(gruposPorMasivo).length}`);
    console.log('Nombres de masivos:', Object.keys(gruposPorMasivo));

    // Crear libro de Excel
    const workbook = XLSX.utils.book_new();
    console.log('Workbook creado');
    
    const sheetData = [];
    
    Object.keys(gruposPorMasivo).forEach((masivo, index) => {
      if (index > 0) {
        sheetData.push([]); // Fila vacía como separador
      }
      
      // Título del grupo
      sheetData.push([`=== ${masivo.toUpperCase()} ===`]);
      const primerInscripcion = gruposPorMasivo[masivo][0];
      sheetData.push([
        `Día: ${primerInscripcion.masivos?.dia || 'No definido'}`, 
        `Horario: ${primerInscripcion.masivos?.horario || 'No definido'}`
      ]);
      sheetData.push([]); // Fila vacía
      
      // Encabezados
      sheetData.push(['Nombre Completo', 'Cédula', 'Grupo Reducido']);
      
      // Datos
      gruposPorMasivo[masivo].forEach(ins => {
        sheetData.push([
          `${ins.nombre} ${ins.apellido}`, // Concatenar nombre y apellido
          ins.cedula, 
          ins.grupo_reducido
        ]);
      });
      
      // Total
      sheetData.push([]);
      sheetData.push([`TOTAL ${masivo}: ${gruposPorMasivo[masivo].length} inscriptos`]);
    });
    
    console.log(`Filas de datos creadas: ${sheetData.length}`);
    
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    console.log('Worksheet creado');
    
    // Configurar anchos de columna
    worksheet['!cols'] = [
      { width: 35 }, 
      { width: 15 }, 
      { width: 15 }
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inscripciones por Masivos');
    console.log('Hoja agregada al workbook');

    // Generar buffer del archivo Excel
    console.log('Generando buffer...');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    console.log(`Buffer generado exitosamente, tamaño: ${buffer.length} bytes`);
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="inscripciones_por_masivos.xlsx"');
    res.setHeader('Content-Length', buffer.length);
    
    console.log('Headers configurados, enviando archivo...');
    res.send(buffer);
    console.log('=== ARCHIVO ENVIADO EXITOSAMENTE ===');
    
  } catch (error) {
    console.error('=== ERROR EN DESCARGA EXCEL ===');
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
    console.error('=====================================');
    
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// ENDPOINT DE PRUEBA SIMPLE
app.get('/api/test-download', (req, res) => {
  try {
    console.log('=== TEST DOWNLOAD SIMPLE ===');
    
    // Crear Excel básico
    const testData = [
      ['Nombre', 'Cedula', 'Grupo'],
      ['Juan Pérez', '12345678', 'Sí'],
      ['María García', '87654321', 'No']
    ];
    
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(testData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Test');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="test.xlsx"');
    
    res.send(buffer);
    console.log('Test download enviado');
    
  } catch (error) {
    console.error('Error en test download:', error);
    res.status(500).json({ error: error.message });
  }
});

// OPCIONAL: Mantener compatibilidad con el endpoint anterior
app.get('/api/descargar-csv', async (req, res) => {
  // Redirigir al nuevo endpoint de Excel
  req.url = '/api/descargar-excel';
  req.app.handle(req, res);
});

// Borrar todas las inscripciones (opcional, admin)
app.delete('/api/inscripciones', async (req, res) => {
  try {
    const { error } = await supabase
      .from('inscripciones')
      .delete()
      .neq('id', 0); // Elimina todos los registros
    
    if (error) {
      console.error('Error eliminando inscripciones:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    
    res.json({ success: true, message: 'Todas las inscripciones eliminadas' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT} con Supabase`);
});
