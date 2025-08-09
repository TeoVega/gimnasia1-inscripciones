-- Configuración inicial
CREATE TABLE IF NOT EXISTS configuracion (
  id INTEGER PRIMARY KEY,
  inscripciones_habilitadas INTEGER NOT NULL DEFAULT 1
);

INSERT OR IGNORE INTO configuracion (id, inscripciones_habilitadas) VALUES (1, 1);

-- Grupos/masivos
CREATE TABLE IF NOT EXISTS masivos (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL,
  dia TEXT NOT NULL,
  horario TEXT NOT NULL,
  cupo_maximo INTEGER NOT NULL DEFAULT 120,
  activo INTEGER NOT NULL DEFAULT 1
);

INSERT OR IGNORE INTO masivos (id, nombre, dia, horario, cupo_maximo, activo) VALUES
  (1, 'Masivo 1', 'Lunes', '10:15 - 12:00', 120, 1),
  (2, 'Masivo 2', 'Lunes', '12:00 - 13:45', 120, 1),
  (3, 'Masivo 3', 'Viernes', '16:30 - 18:15', 120, 1),
  (4, 'Masivo 4', 'Miércoles', '18:00 - 19:45', 120, 1);

-- Inscripciones
CREATE TABLE IF NOT EXISTS inscripciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre_completo TEXT NOT NULL,
  cedula TEXT NOT NULL,
  grupo_reducido TEXT NOT NULL,
  masivo_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(masivo_id) REFERENCES masivos(id)
);