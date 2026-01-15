const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Error opening database', err);
  else console.log('Connected to SQLite database at', dbPath);
});

// IMPORTANT: enforce order
db.serialize(() => {
  // Enable FK (with logging)
  db.run('PRAGMA foreign_keys = ON', (err) => {
    if (err) console.error('PRAGMA foreign_keys error:', err);
  });

  // Areas
  db.run(
    `
    CREATE TABLE IF NOT EXISTS areas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      level INTEGER NOT NULL,
      is_outdoor INTEGER NOT NULL
    )
    `,
    (err) => {
      if (err) console.error('Create areas error:', err);
    }
  );

  // Tables
  db.run(
    `
    CREATE TABLE IF NOT EXISTS tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      area_id INTEGER NOT NULL,
      FOREIGN KEY (area_id) REFERENCES areas(id)
    )
    `,
    (err) => {
      if (err) console.error('Create tables error:', err);
    }
  );

  // Reservations
  db.run(
    `
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      guests INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT,
      FOREIGN KEY (table_id) REFERENCES tables(id)
    )
    `,
    (err) => {
      if (err) console.error('Create reservations error:', err);
    }
  );

  // Seed areas (first)
  db.get('SELECT COUNT(*) AS count FROM areas', (err, row) => {
    if (err) {
      console.error('Seed areas count error:', err);
      return;
    }

    if (row.count === 0) {
      const stmt = db.prepare('INSERT INTO areas (name, level, is_outdoor) VALUES (?, ?, ?)');
      stmt.run('Downstairs', 1, 0);
      stmt.run('Garden', 1, 1);
      stmt.run('Upstairs', 2, 0);
      stmt.run('Terrace', 2, 1);
      stmt.finalize((e) => {
        if (e) console.error('Seed areas finalize error:', e);
      });
    }

    // Seed tables (after areas)
    db.get('SELECT COUNT(*) AS count FROM tables', (err2, row2) => {
      if (err2) {
        console.error('Seed tables count error:', err2);
        return;
      }

      if (row2.count === 0) {
        const stmt2 = db.prepare('INSERT INTO tables (name, capacity, area_id) VALUES (?, ?, ?)');

        // area_id: 1=Downstairs, 2=Garden, 3=Upstairs, 4=Terrace
        stmt2.run('D1', 4, 1);
        stmt2.run('D2', 2, 1);
        stmt2.run('G1', 4, 2);
        stmt2.run('U1', 6, 3);
        stmt2.run('T1', 4, 4);

        stmt2.finalize((e2) => {
          if (e2) console.error('Seed tables finalize error:', e2);
        });
      }
    });
  });
});

module.exports = db;
