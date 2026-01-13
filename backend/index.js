const express = require('express');
const db = require('./database');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
// List of areas
app.get('/areas', (req, res) => {
    db.all('SELECT * FROM areas ORDER BY id', [], (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(rows);
    });
  });
  // List of tables
  app.get('/tables', (req, res) => {
    const { areaId } = req.query;
  
    let sql = `
      SELECT t.*, a.name AS area_name, a.level, a.is_outdoor
      FROM tables t
      JOIN areas a ON t.area_id = a.id
    `;
    const params = [];
  
    if (areaId) {
      sql += ' WHERE t.area_id = ?';
      params.push(Number(areaId));
    }
  
    sql += ' ORDER BY t.id';
  
    db.all(sql, params, (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(rows);
    });
  });

// List over tables availabilty  
  app.get('/tables/availability', (req, res) => {
    const { date, time, guests, level, outdoor } = req.query;
  
    if (!date || !time || !guests || !level || outdoor === undefined) {
      return res.status(400).json({ error: 'Missing parameters' });
    }
  
    const guestsNum = Number(guests);
    const levelNum = Number(level);
    const outdoorNum = Number(outdoor);
  
    const sql = `
      SELECT t.id, t.name, t.capacity, a.name AS area
      FROM tables t
      JOIN areas a ON t.area_id = a.id
      WHERE t.capacity >= ?
        AND a.level = ?
        AND a.is_outdoor = ?
        AND t.id NOT IN (
          SELECT table_id
          FROM reservations
          WHERE date = ? AND time = ?
        )
      ORDER BY t.capacity ASC, t.name ASC
    `;
  
    db.all(sql, [guestsNum, levelNum, outdoorNum, date, time], (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(rows);
    });
  });
  

// ✅ Admin: list reservations
app.get('/reservations', (req, res) => {
  const sql = `
    SELECT id, name, phone, date, time, guests, created_at
    FROM reservations
    ORDER BY date ASC, time ASC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Canceling reservations
app.delete('/reservations/:id', (req, res) => {
    const id = Number(req.params.id);
  
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
  
    db.run('DELETE FROM reservations WHERE id = ?', [id], function (err) {
      if (err) {
        console.error('DB delete error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
  
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Reservation not found' });
      }
  
      return res.json({ deleted: true, id });
    });
  });
  

// ✅ Create reservation
app.post('/reservations', (req, res) => {
    const { tableId, name, phone, date, time, guests } = req.body;
  
    if (!tableId || !name || !phone || !date || !time || !guests) {
      return res.status(400).json({ error: 'Missing fields' });
    }
  
    const sql = `
      INSERT INTO reservations (table_id, name, phone, date, time, guests)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
  
    db.run(sql, [tableId, name, phone, date, time, guests], function (err) {
      if (err) {
        console.error('DB insert error:', err); // 👈 to jest klucz
        return res.status(500).json({ error: 'Database error' });
      }
  
      res.status(201).json({ id: this.lastID });
    });
  });
 
// Canceling reservations  
  app.delete('/reservations/:id', (req, res) => {
    const id = Number(req.params.id);
  
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
  
    db.run('DELETE FROM reservations WHERE id = ?', [id], function (err) {
      if (err) {
        console.error('DB delete error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
  
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Reservation not found' });
      }
  
      return res.json({ deleted: true, id });
    });
  });
  
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
