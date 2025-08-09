import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs/promises';

dotenv.config();

const PORT = process.env.PORT || 4000;
const DB_PATH = process.env.DB_PATH || './db.sqlite';

const app = express();
app.use(cors());
app.use(express.json());

// Inicializa la base de datos
let db;
async function initDb() {
  db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });

  // Ejecuta el schema
  const schema = await fs.readFile('./schema.sql', 'utf-8');
  await db.exec(schema);
}
initDb();

// Endpoints

// GET /api/configuracion
app.get('/api/configuracion', async (req, res) => {
  const row = await db.get('SELECT inscripciones_habilitadas FROM configuracion WHERE id = 1');
  res.json({ inscripciones_habilitadas: !!row.inscripciones_habilitadas });
});

// PUT /api/configuracion
app.put('/api/configuracion', async (req, res) => {
  const estado = req.body.inscripciones_habilitadas ? 1 : 0;
  await db.run('UPDATE configuracion SET inscripciones_habilitadas = ? WHERE id = 1', estado);
  res.json({ success: true });
});

// GET /api/estadisticas
app.get('/api/estadisticas', async (req, res) => {
  const masivos = await db.all('SELECT * FROM masivos WHERE activo = 1');
  const stats = [];

  for (const masivo of masivos) {
    const inscritos = await db.get('SELECT COUNT(*) as count FROM inscripciones WHERE masivo_id = ?', masivo.id);
    stats.push({
      masivo_id: masivo.id,
      nombre: masivo.nombre,
      dia: masivo.dia,
      horario: masivo.horario,
      cupo_maximo: masivo.cupo_maximo,
      inscritos: inscritos.count,
      disponibles: masivo.cupo_maximo - inscritos.count
    });
  }

  res.json(stats);
});

// POST /api/inscribir
app.post('/api/inscribir', async (req, res) => {
  const { nombreCompleto, cedula, grupoReducido, masivoSeleccionado } = req.body;

  // Validaciones
  if (!nombreCompleto || !cedula || !grupoReducido || !masivoSeleccionado) {
    return res.json({ success: false, error: 'Todos los campos son obligatorios' });
  }
  if (!/^\d{8}$/.test(cedula)) {
    return res.json({ success: false, error: 'Cédula debe tener 8 dígitos' });
  }

  // Verifica configuracion
  const config = await db.get('SELECT inscripciones_habilitadas FROM configuracion WHERE id = 1');
  if (!config.inscripciones_habilitadas) {
    return res.json({ success: false, error: 'Inscripciones cerradas' });
  }

  // Verifica duplicados
  const existe = await db.get('SELECT * FROM inscripciones WHERE cedula = ?', cedula);
  if (existe) {
    return res.json({ success: false, error: 'Ya está inscripto' });
  }

  // Verifica cupo
  const cupo = await db.get('SELECT COUNT(*) as count FROM inscripciones WHERE masivo_id = ?', masivoSeleccionado);
  const masivo = await db.get('SELECT * FROM masivos WHERE id = ?', masivoSeleccionado);
  if (cupo.count >= masivo.cupo_maximo) {
    return res.json({ success: false, error: 'Cupo completo' });
  }

  // Inserta inscripción
  await db.run(
    'INSERT INTO inscripciones (nombre_completo, cedula, grupo_reducido, masivo_id, created_at) VALUES (?, ?, ?, ?, ?)',
    nombreCompleto, cedula, grupoReducido, masivoSeleccionado, new Date().toISOString()
  );
  res.json({ success: true, message: 'Inscripción exitosa' });
});

// GET /api/descargar-csv
app.get('/api/descargar-csv', async (req, res) => {
  const inscripciones = await db.all(`
    SELECT i.*, m.nombre as masivo_nombre, m.dia, m.horario
    FROM inscripciones i
    JOIN masivos m ON i.masivo_id = m.id
    ORDER BY i.created_at ASC
  `);

  let csv = 'Nombre Completo,Cédula,Grupo Reducido,Masivo,Dia,Horario,Fecha Inscripción\n';
  for (const ins of inscripciones) {
    csv += `"${ins.nombre_completo}","${ins.cedula}","${ins.grupo_reducido}","${ins.masivo_nombre}","${ins.dia}","${ins.horario}","${ins.created_at}"\n`;
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="inscripciones.csv"');
  res.send(csv);
});

// Borrar todas las inscripciones (opcional, admin)
app.delete('/api/inscripciones', async (req, res) => {
  await db.run('DELETE FROM inscripciones');
  res.json({ success: true, message: 'Todas las inscripciones eliminadas' });
});

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});