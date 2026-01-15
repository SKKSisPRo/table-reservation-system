const express = require('express');
const db = require('./database');

const app = express();
app.use(express.json());

/* =====================
   Helpers
===================== */

function parseBookingDateTime(dateStr, timeStr) {
  const iso = `${dateStr}T${timeStr}:00`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function validateBookingRules({ date, time, guests }) {
  const guestsNum = Number(guests);
  if (!Number.isInteger(guestsNum) || guestsNum <= 0) return 'Invalid guests';
  if (guestsNum > 20) return 'Max 20 guests per booking';

  const bookingDT = parseBookingDateTime(date, time);
  if (!bookingDT) return 'Invalid date/time';

  // No bookings at or after 21:00
  const hour = bookingDT.getHours();
  if (hour >= 21) return 'No bookings allowed at or after 21:00';

  // Must be at least 24 hours in advance
  const now = new Date();
  const diffMs = bookingDT.getTime() - now.getTime();
  if (diffMs < 24 * 60 * 60 * 1000) {
    return 'Online booking must be at least 24 hours in advance';
  }

  return null;
}

/* =====================
   Basic
===================== */

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

/* =====================
   Areas
===================== */

app.get('/areas', (req, res) => {
  db.all('SELECT * FROM areas ORDER BY id', [], (err, rows) => {
    if (err) {
      console.error('DB areas error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

/* =====================
   Tables
===================== */

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
    if (err) {
      console.error('DB tables error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Availability (filters by level + outdoor, blocks pending/accepted only)
app.get('/tables/availability', (req, res) => {
  const { date, time, guests, level, outdoor } = req.query;

  if (!date || !time || !guests || !level || outdoor === undefined) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const guestsNum = Number(guests);
  const levelNum = Number(level);
  const outdoorNum = Number(outdoor);

  if (!Number.isInteger(guestsNum) || guestsNum <= 0) {
    return res.status(400).json({ error: 'Invalid guests' });
  }
  if (![1, 2].includes(levelNum)) {
    return res.status(400).json({ error: 'Invalid level' });
  }
  if (![0, 1].includes(outdoorNum)) {
    return res.status(400).json({ error: 'Invalid outdoor (use 0 or 1)' });
  }

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
          AND status IN ('pending', 'accepted')
      )
    ORDER BY t.capacity ASC, t.name ASC
  `;

  db.all(sql, [guestsNum, levelNum, outdoorNum, date, time], (err, rows) => {
    if (err) {
      console.error('DB availability error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

/* =====================
   Reservations (Admin + Requests)
===================== */

// Admin: list reservations
app.get('/reservations', (req, res) => {
  const sql = `
    SELECT r.id, r.status, r.date, r.time, r.guests, r.name, r.phone, r.created_at, r.expires_at,
           t.name AS table_name,
           a.name AS area_name
    FROM reservations r
    LEFT JOIN tables t ON r.table_id = t.id
    LEFT JOIN areas a ON t.area_id = a.id
    ORDER BY r.date ASC, r.time ASC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('DB reservations list error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Create reservation request (pending). Phone is optional.
// ✅ Includes double-booking prevention for same table+slot
app.post('/reservations', (req, res) => {
  const { tableId, name, phone, date, time, guests } = req.body;

  if (!tableId || !name || !date || !time || !guests) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const ruleError = validateBookingRules({ date, time, guests });
  if (ruleError) {
    return res.status(400).json({ error: ruleError });
  }

  // Prevent double booking for same table+slot (pending/accepted)
  db.get(
    `
      SELECT id
      FROM reservations
      WHERE table_id = ?
        AND date = ?
        AND time = ?
        AND status IN ('pending', 'accepted')
      LIMIT 1
    `,
    [Number(tableId), date, time],
    (checkErr, existing) => {
      if (checkErr) {
        console.error('DB check error:', checkErr);
        return res.status(500).json({ error: 'Database error' });
      }

      if (existing) {
        return res.status(409).json({ error: 'Table already reserved for this time' });
      }

      const sql = `
        INSERT INTO reservations (table_id, name, phone, date, time, guests, status, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', datetime(? || ' ' || ?, '+30 minutes'))
      `;

      db.run(
        sql,
        [Number(tableId), name, phone || null, date, time, Number(guests), date, time],
        function (err) {
          if (err) {
            console.error('DB insert error:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          return res.status(201).json({ id: this.lastID, status: 'pending' });
        }
      );
    }
  );
});

// Admin: cancel (delete) reservation
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

// Admin: accept request (only pending -> accepted)
app.patch('/reservations/:id/accept', (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  db.run(
    `UPDATE reservations SET status='accepted' WHERE id=? AND status='pending'`,
    [id],
    function (err) {
      if (err) {
        console.error('DB accept error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Not found or not pending' });
      }
      res.json({ id, status: 'accepted' });
    }
  );
});

// Admin: decline request (pending OR accepted -> declined)
app.patch('/reservations/:id/decline', (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  db.run(
    `UPDATE reservations SET status='declined' WHERE id=? AND status IN ('pending','accepted')`,
    [id],
    function (err) {
      if (err) {
        console.error('DB decline error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Not found or not pending/accepted' });
      }
      res.json({ id, status: 'declined' });
    }
  );
});

/* =====================
   Expiration job (no-show)
===================== */

function expireOldReservations() {
  const sql = `
    UPDATE reservations
    SET status='expired'
    WHERE status IN ('pending','accepted')
      AND expires_at IS NOT NULL
      AND datetime('now') > datetime(expires_at)
  `;

  db.run(sql, [], function (err) {
    if (err) console.error('Expire job error:', err);
  });
}

// run every minute
setInterval(expireOldReservations, 60 * 1000);

/* =====================
   Debug (optional - remove later)
===================== */

app.get('/debug/reservations-raw', (req, res) => {
  db.all('SELECT * FROM reservations ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      console.error('DB debug error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

/* =====================
   Start server
===================== */

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
