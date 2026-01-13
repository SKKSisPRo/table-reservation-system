const express = require('express');
const db = require('./database');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
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

// ✅ Create reservation
app.post('/reservations', (req, res) => {
  const { name, phone, date, time, guests } = req.body;

  if (!name || !phone || !date || !time || !guests) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const sql = `
    INSERT INTO reservations (name, phone, date, time, guests)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(sql, [name, phone, date, time, guests], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(201).json({
      id: this.lastID,
      name,
      phone,
      date,
      time,
      guests
    });
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
