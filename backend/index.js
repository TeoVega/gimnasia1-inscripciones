const express = require('express');
const cors = require('cors');
const XLSX = require('xlsx');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

let inscriptionEnabled = true;

const GROUPS = [
  { id: 1, name: 'Masivo 1', horario: 'Lunes 10:15 a 12:00' },
  { id: 2, name: 'Masivo 2', horario: 'Lunes 12:00 a 13:45' },
  { id: 3, name: 'Masivo 3', horario: 'Viernes 16:30 a 18:15' },
  { id: 4, name: 'Masivo 4', horario: 'Miércoles 18:00 a 19:45' },
];
const MAX_CUPO = 120;

let inscritos = { 1: [], 2: [], 3: [], 4: [] };

// Inscripción de estudiante
app.post('/api/inscribir', (req, res) => {
  if (!inscriptionEnabled)
    return res.status(403).json({ error: 'Inscripción deshabilitada' });

  const { nombre, cedula, grupoReducido, masivo } = req.body;

  // Trigger para borrar todos los resultados
  if (
    nombre.trim().toLowerCase() === 'borrar' &&
    cedula === '00000000' &&
    grupoReducido === '0'
  ) {
    inscritos = { 1: [], 2: [], 3: [], 4: [] };
    return res.json({ success: true, deleted: true });
  }

  if (!nombre || !cedula || !grupoReducido || !masivo)
    return res.status(400).json({ error: 'Campos incompletos' });

  if (inscritos[masivo].length >= MAX_CUPO)
    return res.status(400).json({ error: 'Grupo lleno' });

  // Evitar duplicados
  if (
    inscritos[masivo].some((i) => i.cedula === cedula || i.nombre === nombre)
  )
    return res.status(400).json({ error: 'Estudiante ya inscripto en este grupo' });

  inscritos[masivo].push({ nombre, cedula, grupoReducido });
  return res.json({ success: true });
});

// Obtener cupos
app.get('/api/cupos', (req, res) => {
  res.json({
    grupos: GROUPS.map((g) => ({
      ...g,
      cupo: inscritos[g.id].length,
      libre: MAX_CUPO - inscritos[g.id].length,
    })),
    inscriptionEnabled,
  });
});

// Habilitar/deshabilitar inscripción
app.post('/api/habilitar', (req, res) => {
  const { enabled } = req.body;
  inscriptionEnabled = !!enabled;
  res.json({ success: true, inscriptionEnabled });
});

// Descargar Excel
app.get('/api/excel', (req, res) => {
  const sheets = {};
  GROUPS.forEach((g) => {
    sheets[g.name] = [
      ['Nombre Completo', 'Cédula de Identidad', 'Grupo Reducido'],
      ...inscritos[g.id].map((i) => [i.nombre, i.cedula, i.grupoReducido]),
    ];
  });

  const workbook = XLSX.utils.book_new();
  Object.entries(sheets).forEach(([name, data]) => {
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, ws, name);
  });

  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename=\"gimnasia1_2025.xlsx\"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});