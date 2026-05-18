require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy';
const supabase = createClient(supabaseUrl, supabaseKey);

const PORT = 5000;

const RESERVATION_DURATION_MIN = 90;

function timeToMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function timesOverlap(t1, t2, duration = RESERVATION_DURATION_MIN) {
  const m1 = timeToMinutes(t1);
  const m2 = timeToMinutes(t2);
  if (m1 === null || m2 === null) return false;
  return Math.abs(m1 - m2) < duration;
}

/* =====================
   Helper validation functions
===================== */

const COUNTRIES = [
  { code: '+47', minLength: 8, maxLength: 8 }, // Norway
  { code: '+46', minLength: 9, maxLength: 9 }, // Sweden
  { code: '+45', minLength: 8, maxLength: 8 }, // Denmark
  { code: '+44', minLength: 10, maxLength: 10 }, // UK
  { code: '+49', minLength: 10, maxLength: 11 }, // Germany
  { code: '+33', minLength: 9, maxLength: 9 }, // France
  { code: '+39', minLength: 9, maxLength: 10 }, // Italy
  { code: '+34', minLength: 9, maxLength: 9 }, // Spain
  { code: '+48', minLength: 9, maxLength: 9 }, // Poland
  { code: '+31', minLength: 9, maxLength: 9 }, // Netherlands
  { code: '+358', minLength: 5, maxLength: 12 }, // Finland
];

function validatePhone(phoneStr) {
  if (!phoneStr) return 'Phone number required';
  const parts = phoneStr.split(' ');
  if (parts.length < 2) return 'Invalid phone format, expected "+CODE NUMBER"';
  
  const code = parts[0];
  const number = parts.slice(1).join('').replace(/\D/g, ''); // Extract only digits
  
  const country = COUNTRIES.find(c => c.code === code);
  if (!country) return `Unsupported country code: ${code}`;
  
  if (number.length < country.minLength || number.length > country.maxLength) {
    if (country.minLength === country.maxLength) {
      return `Phone number for ${code} must be exactly ${country.minLength} digits`;
    }
    return `Phone number for ${code} must be between ${country.minLength} and ${country.maxLength} digits`;
  }
  
  return null;
}

function parseBookingDateTime(dateStr, timeStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  if (!year || !month || !day || isNaN(hours) || isNaN(minutes)) {
    return null;
  }
  return new Date(year, month - 1, day, hours, minutes);
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
   Areas & Tables
===================== */

app.get('/areas', async (req, res) => {
  const { data, error } = await supabase.from('areas').select('*');
  if (error) return res.status(500).json({ error: 'Database error' });
  res.json(data);
});

app.get('/tables', async (req, res) => {
  const areaId = req.query.areaId;
  let query = supabase.from('tables').select('*');
  if (areaId) {
    query = query.eq('area_id', Number(areaId));
  }
  const { data, error } = await query;
  if (error) { console.error('GET /tables error:', error); return res.status(500).json({ error: 'Database error' }); }
  res.json(data);
});

/* =====================
   Availability Check
===================== */
app.get('/tables/availability', async (req, res) => {
  const { date, time, guests, level, outdoor } = req.query;

  if (!date || !time || !guests) {
    return res.status(400).json({ error: 'Missing date, time, or guests' });
  }

  // Find tables matching area criteria
  let areaQuery = supabase.from('areas').select('id');
  if (level !== undefined) areaQuery = areaQuery.eq('level', Number(level));
  if (outdoor !== undefined) areaQuery = areaQuery.eq('outdoor', outdoor === 'true');
  
  const { data: areas, error: areaErr } = await areaQuery;
  if (areaErr) return res.status(500).json({ error: 'Database error' });
  
  const areaIds = areas.map(a => a.id);
  if (areaIds.length === 0) return res.json([]);

  const { data: tables, error: tableErr } = await supabase
    .from('tables')
    .select('*')
    .in('area_id', areaIds)
    .gte('capacity', Number(guests));

  if (tableErr) return res.status(500).json({ error: 'Database error' });

  // Get reservations on this date and exclude tables whose booking window
  // overlaps with the requested time (RESERVATION_DURATION_MIN on each side).
  const { data: reservations, error: resErr } = await supabase
    .from('reservations')
    .select('table_id, time')
    .eq('date', date)
    .in('status', ['pending', 'accepted']);

  if (resErr) return res.status(500).json({ error: 'Database error' });

  const bookedTableIds = new Set(
    reservations.filter(r => timesOverlap(r.time, time)).map(r => r.table_id)
  );
  const availableTables = tables.filter(t => !bookedTableIds.has(t.id));

  res.json(availableTables);
});

app.get('/api/occupied-tables', async (req, res) => {
  const { date, time } = req.query;
  if (!date || !time) {
    return res.status(400).json({ error: 'Missing date or time' });
  }

  const { data, error } = await supabase
    .from('reservations')
    .select('table_id, time')
    .eq('date', date)
    .in('status', ['pending', 'accepted']);

  if (error) {
    console.error('GET /api/occupied-tables error:', error);
    return res.status(500).json({ error: 'Database error' });
  }

  const tableIds = data.filter(r => timesOverlap(r.time, time)).map(r => r.table_id);
  res.json(tableIds);
});

/* =====================
   Reservations (Admin + Requests)
===================== */

app.get('/reservations', async (req, res) => {
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      id, status, date, time, guests, name, phone, created_at, expires_at, table_id, additional_info,
      tables (name, areas(name))
    `)
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  if (error) return res.status(500).json({ error: 'Database error' });

  // Flatten the response to match old format
  const formattedData = data.map(r => ({
    id: r.id,
    status: r.status,
    date: r.date,
    time: r.time,
    guests: r.guests,
    name: r.name,
    phone: r.phone,
    created_at: r.created_at,
    expires_at: r.expires_at,
    table_name: r.tables?.name,
    table_id: r.table_id,
    area_name: r.tables?.areas?.name,
    additionalInfo: r.additional_info || ""
  }));

  res.json(formattedData);
});

app.post('/reservations', async (req, res) => {
  console.log("📥 API RECEIVED:", req.body);
  const { tableId, name, phone, date, time, guests, additionalInfo } = req.body;

  if (!tableId || !name || !date || !time || !guests) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const ruleError = validateBookingRules({ date, time, guests });
  if (ruleError) {
    return res.status(400).json({ error: ruleError });
  }

  const phoneError = validatePhone(phone);
  if (phoneError) {
    return res.status(400).json({ error: phoneError });
  }

  // Table capacity check
  const { data: table, error: tableErr } = await supabase
    .from('tables')
    .select('capacity')
    .eq('id', Number(tableId))
    .single();

  if (tableErr) console.error('Table fetch error:', tableErr);
  if (tableErr || !table) return res.status(404).json({ error: 'Table not found' });

  if (Number(guests) > table.capacity) {
    return res.status(400).json({ error: `This table only has capacity for ${table.capacity} guests` });
  }

  // Prevent double booking — block if any existing reservation's window overlaps
  const { data: existing, error: checkErr } = await supabase
    .from('reservations')
    .select('id, time')
    .eq('table_id', Number(tableId))
    .eq('date', date)
    .in('status', ['pending', 'accepted']);

  if (checkErr) return res.status(500).json({ error: 'Database error' });
  if ((existing || []).some(r => timesOverlap(r.time, time))) {
    return res.status(409).json({ error: 'Table already reserved for this time' });
  }

  // Expires at logic (+30 mins)
  const dt = parseBookingDateTime(date, time);
  dt.setMinutes(dt.getMinutes() + 30);
  const expires_at = dt.toISOString();

  const mappedObject = {
    table_id: Number(tableId),
    name,
    phone: phone || null,
    date,
    time,
    guests: Number(guests),
    status: 'pending',
    expires_at,
    additional_info: additionalInfo || null
  };
  console.log("💾 SUPABASE MAPPING:", mappedObject);

  try {
    const { data: inserted, error: insertErr } = await supabase
      .from('reservations')
      .insert([mappedObject])
      .select('id')
      .single();

    if (insertErr) {
      console.error('SUPABASE_CRASH_REPORT:', insertErr.message);
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(201).json({ id: inserted.id, status: 'pending' });
  } catch (err) {
    console.error('SUPABASE_CRASH_REPORT:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/reservations/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  const { error, count } = await supabase
    .from('reservations')
    .delete({ count: 'exact' })
    .eq('id', id);

  if (error) return res.status(500).json({ error: 'Database error' });
  if (count === 0) return res.status(404).json({ error: 'Reservation not found' });

  res.json({ deleted: true, id });
});

app.put('/reservations/:id', async (req, res) => {
  console.log("PUT /reservations/:id - Received from frontend:", req.body);
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  const { tableId, table_id, name, phone, date, time, guests, status, additionalInfo } = req.body;
  const actualTableId = tableId || table_id;
  if (!actualTableId || !name || !date || !time || !guests || !status) {
    console.log("Validation failed! Missing one of:", { tableId, table_id, name, date, time, guests, status });
    return res.status(400).json({ error: 'Missing fields' });
  }

  // Table capacity check
  const { data: table, error: tableErr } = await supabase
    .from('tables')
    .select('capacity')
    .eq('id', Number(actualTableId))
    .single();

  if (tableErr || !table) return res.status(404).json({ error: 'Table not found' });
  if (Number(guests) > table.capacity) {
    return res.status(400).json({ error: `This table only has capacity for ${table.capacity} guests` });
  }

  // Double booking check for edit — block if any other reservation's window overlaps
  const { data: existing, error: checkErr } = await supabase
    .from('reservations')
    .select('id, time')
    .eq('table_id', Number(actualTableId))
    .eq('date', date)
    .in('status', ['pending', 'accepted'])
    .neq('id', id);

  if (checkErr) return res.status(500).json({ error: 'Database error' });
  if ((existing || []).some(r => timesOverlap(r.time, time))) {
    return res.status(409).json({ error: 'Table already reserved for this time' });
  }

  const mappedObject = {
    table_id: Number(actualTableId),
    name,
    phone: phone || null,
    date,
    time,
    guests: Number(guests),
    status,
    additional_info: additionalInfo || null
  };
  console.log("💾 SUPABASE MAPPING:", mappedObject);

  try {
    const { data: updated, error: updateErr } = await supabase
      .from('reservations')
      .update(mappedObject)
      .eq('id', id)
      .select();

    if (updateErr) {
      console.error('SUPABASE_CRASH_REPORT:', updateErr.message);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!updated || updated.length === 0) return res.status(404).json({ error: 'Reservation not found' });

    res.json({ id, status: 'updated' });
  } catch (err) {
    console.error('SUPABASE_CRASH_REPORT:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.patch('/reservations/:id/accept', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  const { data: updated, error } = await supabase
    .from('reservations')
    .update({ status: 'accepted' })
    .eq('id', id)
    .eq('status', 'pending')
    .select();

  if (error) return res.status(500).json({ error: 'Database error' });
  if (!updated || updated.length === 0) return res.status(404).json({ error: 'Not found or not pending' });

  res.json({ id, status: 'accepted' });
});

app.patch('/reservations/:id/decline', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  const { data: updated, error } = await supabase
    .from('reservations')
    .update({ status: 'declined' })
    .eq('id', id)
    .in('status', ['pending', 'accepted'])
    .select();

  if (error) return res.status(500).json({ error: 'Database error' });
  if (!updated || updated.length === 0) return res.status(404).json({ error: 'Not found or not pending/accepted' });

  res.json({ id, status: 'declined' });
});

/* =====================
   Expiration job (no-show)
===================== */
async function expireOldReservations() {
  const now = new Date().toISOString();
  await supabase
    .from('reservations')
    .update({ status: 'expired' })
    .in('status', ['pending', 'accepted'])
    .lt('expires_at', now);
}

setInterval(expireOldReservations, 60000);
expireOldReservations();

app.listen(PORT, () => {
  console.log(`Supabase Server running on http://localhost:${PORT}`);
});
