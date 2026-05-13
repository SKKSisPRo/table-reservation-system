-- Areas Table
CREATE TABLE IF NOT EXISTS areas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    outdoor BOOLEAN DEFAULT FALSE,
    level INTEGER DEFAULT 1
);

-- Tables Table
CREATE TABLE IF NOT EXISTS tables (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    area_id INTEGER REFERENCES areas(id),
    capacity INTEGER NOT NULL DEFAULT 4,
    x_coord INTEGER,
    y_coord INTEGER,
    UNIQUE(name, area_id)
);

-- Reservations Table
CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    table_id INTEGER REFERENCES tables(id),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    date DATE NOT NULL,
    time TIME NOT NULL,
    guests INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Seed Areas
INSERT INTO areas (id, name, description, outdoor, level) VALUES
(1, 'Downstairs', 'Main bar and tables', false, 1),
(2, 'Upstairs', 'Lounge and tables', false, 2),
(3, 'Patio', 'Outdoor seating area', true, 1),
(4, 'VIP', 'Private room', false, 2)
ON CONFLICT DO NOTHING;

-- Seed Tables (20 Specific Tables: T1-T9, V1-V8, H1-H3)
INSERT INTO tables (id, area_id, name, capacity) VALUES
-- T row
(1, 1, 'T1', 2),
(2, 1, 'T2', 2),
(3, 1, 'T3', 4),
(4, 1, 'T4', 4),
(5, 1, 'T5', 4),
(6, 1, 'T6', 4),
(7, 1, 'T7', 4),
(8, 1, 'T8', 2),
(9, 1, 'T9', 2),
-- V row
(10, 1, 'V1', 2),
(11, 1, 'V2', 2),
(12, 1, 'V3', 4),
(13, 1, 'V4', 4),
(14, 1, 'V5', 6),
(15, 1, 'V6', 6),
(16, 1, 'V7', 8),
(17, 1, 'V8', 8),
-- H row
(18, 1, 'H1', 4),
(19, 1, 'H2', 4),
(20, 1, 'H3', 8)
ON CONFLICT DO NOTHING;

-- Reset sequence to avoid ID conflicts
SELECT setval('tables_id_seq', (SELECT MAX(id) FROM tables));

-- Enable Supabase Realtime for reservations
ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
