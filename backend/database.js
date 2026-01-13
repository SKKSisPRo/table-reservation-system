const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to SQLite database at', dbPath);
  }
});

/* =====================
   TABLES
===================== */

// Areas
db.run(`
  CREATE TABLE IF NOT EXISTS areas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    level INTEGER NOT NULL,
    is_outdoor INTEGER NOT NULL
  )
`);

// Tables
db.run(`
  CREATE TABLE IF NOT EXISTS tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    area_id INTEGER NOT NULL,
    FOREIGN KEY (area_id) REFERENCES areas(id)
  )
`);

// Reservations
db.run(`
  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    guests INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (table_id) REFERENCES tables(id)
  )
`);

/* =====================
   SEED DATA (MVP)
===================== */

// Seed areas
db.get('SELECT COUNT(*) AS count FROM areas', (err, row) => {
  if (err) return;
  if (row.count === 0) {
    const stmt = db.prepare(
      'INSERT INTO areas (name, level, is_outdoor) VALUES (?, ?, ?)'
    );

    stmt.run('Downstairs', 1, 0);
    stmt.run('Garden', 1, 1);
    stmt.run('Upstairs', 2, 0);
    stmt.run('Terrace', 2, 1);

    stmt.finalize();
  }
});

// Seed tables
db.get('SELECT COUNT(*) AS count FROM tables', (err, row) => {
  if (err) return;
  if (row.count === 0) {
    const stmt = db.prepare(
      'INSERT INTO tables (name, capacity, area_id) VALUES (?, ?, ?)'
    );

    // Downstairs
    stmt.run('D1', 4, 1);
    stmt.run('D2', 2, 1);

    // Garden
    stmt.run('G1', 4, 2);

    // Upstairs
    stmt.run('U1', 6, 3);

    // Terrace
    stmt.run('T1', 4, 4);

    stmt.finalize();
  }
});

module.exports = db;
