import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

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

const MAP_TABLES = [
  // T-row (Top)
  { name: 'T1', top: '4%', left: '4%' },
  { name: 'T2', top: '4%', left: '12%' },
  { name: 'T3', top: '4%', left: '20%' },
  { name: 'T4', top: '4%', left: '28%' },
  { name: 'T5', top: '4%', left: '36%' },
  { name: 'T6', top: '4%', left: '44%' },
  { name: 'T7', top: '4%', left: '52%' },
  { name: 'T8', top: '4%', left: '60%' },
  { name: 'T9', top: '4%', left: '68%' },
  // V-rows (Left)
  { name: 'V1', top: '80%', left: '4%' },
  { name: 'V2', top: '80%', left: '16%' },
  { name: 'V3', top: '65%', left: '4%' },
  { name: 'V4', top: '65%', left: '16%' },
  { name: 'V5', top: '50%', left: '4%' },
  { name: 'V6', top: '50%', left: '16%' },
  { name: 'V7', top: '35%', left: '4%' },
  { name: 'V8', top: '20%', left: '4%' },
  // H-row (Right of Bar)
  { name: 'H1', top: '35%', left: '72%' },
  { name: 'H2', top: '50%', left: '72%' },
  { name: 'H3', top: '65%', left: '84%' },
];

export default function StepTable({ date, time, guests, selectedTable, onClearSelectedTable, onNext, onBack }) {
  const [tables, setTables] = useState([]);
  const [availableIds, setAvailableIds] = useState(new Set());
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const res = await fetch('http://localhost:5000/reservations');
        const data = await res.json();
        setReservations(data);
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };
    fetchReservations();
  }, [date, time]);

  const reservationsForDate = reservations.filter(r =>
    r.date === date &&
    ['pending', 'accepted'].includes(r.status) &&
    timesOverlap(r.time, time)
  );

  // Clear the selected table if it becomes occupied (e.g. via realtime update)
  useEffect(() => {
    if (selectedTable) {
      const isOccupied = reservationsForDate.some(r => r.table_id === selectedTable.id || r.table_name === selectedTable.name);
      if (isOccupied) onClearSelectedTable();
    }
  }, [reservationsForDate, selectedTable]);

  // Clear the selected table if the guest count (set in an earlier step) no longer fits it
  useEffect(() => {
    if (selectedTable && Number(guests) > selectedTable.capacity) {
      onClearSelectedTable();
    }
  }, [guests, selectedTable]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Fetch all tables
        const resAll = await fetch('http://localhost:5000/tables?areaId=1');
        const allTables = await resAll.json();
        setTables(allTables);

        // Fetch available tables
        const query = new URLSearchParams({
          date,
          time,
          guests: 1,     // Show all available regardless of size
          level: 1,
          outdoor: 0
        });
        const resAvail = await fetch(`http://localhost:5000/tables/availability?${query}`);
        if (resAvail.ok) {
          const availTables = await resAvail.json();
          setAvailableIds(new Set(availTables.map(t => t.id)));
        } else {
          setAvailableIds(new Set(allTables.map(t => t.id)));
        }
      } catch (err) {
        console.error('Fetch error:', err);
        const dummyTables = MAP_TABLES.map((t, i) => ({ id: i + 1, name: t.name, capacity: 4 }));
        setTables(dummyTables);
        setAvailableIds(new Set(dummyTables.map(t => t.id)));
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    // Supabase Realtime Subscription
    const channel = supabase
      .channel('public:reservations_floorplan')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, async () => {
        fetchData();
        try {
          const res = await fetch('http://localhost:5000/reservations');
          const data = await res.json();
          setReservations(data);
        } catch (err) {
          console.error('Fetch error (realtime):', err);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [date, time]);

  const renderTable = (pos, absolute) => {
    const tableData = tables.find(t => t.name === pos.name) || { id: pos.name, name: pos.name, capacity: 4 };
    const isAvailable = availableIds.has(tableData.id);
    const isSelected = selectedTable?.id === tableData.id;
    const isTooSmall = Number(guests) > tableData.capacity;
    const tableRes = reservationsForDate.filter(r => r.table_id === tableData.id || r.table_name === pos.name);
    const isOccupied = tableRes.length > 0;

    let bgClass = "bg-dickens-green"; // Available
    if (isOccupied) bgClass = "!bg-dickens-red shadow-md text-white cursor-not-allowed"; // Occupied from Admin
    else if (isTooSmall) bgClass = "bg-gray-400 opacity-60 cursor-not-allowed"; // Too small
    else if (isSelected) bgClass = "bg-dickens-gold shadow-[0_0_10px_rgba(139,134,78,0.8)] scale-110 z-10"; // Selected
    else if (isAvailable) bgClass = "bg-dickens-green hover:bg-dickens-lightgreen cursor-pointer"; // Available

    return (
      <button
        key={pos.name}
        disabled={isOccupied || !isAvailable || isTooSmall}
        title={isTooSmall ? "Too small for your group" : ""}
        onClick={() => {
          if (isOccupied || !isAvailable || isTooSmall) return;
          onNext(tableData);
        }}
        className={`${absolute ? 'absolute ' : ''}w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 flex flex-col items-center justify-center rounded text-white shadow-md transition-all duration-200 border border-black/20 ${bgClass}`}
        style={absolute ? { top: pos.top, left: pos.left } : undefined}
      >
        <span className="font-bold text-sm md:text-base">{pos.name}</span>
        <span className="text-xs flex items-center gap-1 opacity-90">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
          {tableData.capacity}
        </span>
      </button>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-4">
      <div className="flex justify-between items-center mb-4">
        <button onClick={onBack} className="text-dickens-green hover:underline">&larr; Tilbake</button>
        <h1 className="font-gothic text-4xl text-dickens-green drop-shadow-sm">Velg bord</h1>
        <div className="w-20"></div> {/* Spacer for centering */}
      </div>

      {/* The Map */}
      <div className="relative w-full aspect-[4/3] bg-gray-300 rounded-xl border-4 border-gray-400 shadow-inner overflow-hidden p-4">
        {loading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-30">
            <div className="text-dickens-green text-xl font-semibold bg-white px-4 py-2 rounded-lg shadow-md border border-dickens-gold">Laster inn bordkart...</div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-2 left-2 flex flex-wrap gap-3 text-xs font-semibold z-20 bg-white/90 px-3 py-2 rounded shadow-sm border border-gray-200">
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-dickens-green rounded-sm"></div> Ledig</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-dickens-red rounded-sm"></div> Opptatt</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-400 rounded-sm"></div> For lite</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-dickens-gold rounded-sm"></div> Valgt</div>
        </div>

        {/* Bar */}
        <div className="absolute top-[25%] left-[25%] w-[45%] h-[50%] bg-dickens-brown border-b-[30px] border-l-[30px] border-r-[30px] border-dickens-brown bg-opacity-20 flex justify-center shadow-lg rounded-t-sm rounded-b-xl overflow-hidden">
          <div className="bg-dickens-brown w-full h-[60px] flex items-center justify-center text-dickens-cream font-gothic text-3xl shadow-sm">
            Bar
          </div>
        </div>

        {/* Scene */}
        <div className="absolute top-4 right-4 w-[15%] h-[20%] bg-[#4a4a4a] text-dickens-cream flex items-center justify-center font-gothic text-2xl rounded shadow-md border-b-4 border-r-4 border-gray-600">
          Scene
        </div>

        {/* T-Series Tables */}
        <div className="absolute top-[4%] left-[4%] w-[75%] flex flex-row justify-between">
          {MAP_TABLES.filter(pos => pos.name.startsWith('T')).map((pos) => renderTable(pos, false))}
        </div>

        {/* Other Tables */}
        {MAP_TABLES.filter(pos => !pos.name.startsWith('T')).map((pos) => renderTable(pos, true))}
      </div>
    </div>
  );
}
