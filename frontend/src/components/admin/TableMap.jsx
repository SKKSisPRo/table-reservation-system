import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

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

export default function TableMap() {
  const [reservations, setReservations] = useState([]);
  const [tablesData, setTablesData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  // Active State & Modals
  const [activeTableId, setActiveTableId] = useState(null);
  const [editModal, setEditModal] = useState({ open: false, data: null });

  const handleDelete = async (id) => {
    if (window.confirm("Er du sikker på at du vil slette denne reservasjonen?")) {
      try {
        await fetch(`http://localhost:3000/reservations/${id}`, { method: 'DELETE' });
        fetchReservations(); // Real-time should also pick this up
      } catch (err) {
        console.error('Delete error', err);
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    console.log("TableMap - Sending to backend:", editModal.data);
    try {
      await fetch(`http://localhost:3000/reservations/${editModal.data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editModal.data)
      });
      fetchReservations();
    } catch (err) {
      console.error('Edit error', err);
    } finally {
      setEditModal({ open: false, data: null });
    }
  };

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/reservations');
      const data = await res.json();
      setReservations(data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
    fetch('http://localhost:3000/tables')
      .then(res => res.json())
      .then(setTablesData)
      .catch(console.error);

    const channel = supabase
      .channel('public:reservations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
        fetchReservations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const reservationsForDate = reservations.filter(r => r.date === dateFilter);

  let activeTableCapacity = null;
  let isOverCapacity = false;
  if (editModal.open && editModal.data) {
    const table = tablesData.find(t => t.id === editModal.data.tableId);
    if (table) {
      activeTableCapacity = table.capacity;
      isOverCapacity = Number(editModal.data.guests) > table.capacity;
    }
  }

  return (
    <div className="flex flex-col h-full font-sans">
      
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-5xl font-gothic text-dickens-green mb-2 drop-shadow-sm">Reservations Overview</h1>
          <p className="text-gray-600 text-lg font-medium">Dato: {dateFilter}</p>
        </div>
        <button className="bg-dickens-green hover:bg-[#122a24] text-white px-6 py-3 rounded-lg shadow-md font-semibold transition-colors">
          + New Reservation
        </button>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mb-6">
        <input 
          type="text" 
          placeholder="Søk etter navn eller telefon..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg w-80 shadow-sm focus:outline-none focus:border-dickens-gold focus:ring-1 focus:ring-dickens-gold"
        />
        <input 
          type="date" 
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-dickens-gold focus:ring-1 focus:ring-dickens-gold"
        />
      </div>

      {/* Map Dashboard */}
      <div className="relative w-full aspect-[4/3] bg-gray-300 rounded-xl border-4 border-gray-400 shadow-inner p-4 max-h-[70vh]">
        
        {loading && <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center">Laster kart...</div>}

        {/* Click-away overlay */}
        {activeTableId && (
          <div 
            className="fixed inset-0 z-40 bg-transparent" 
            onClick={() => setActiveTableId(null)}
          ></div>
        )}

        {/* Legend */}
        <div className="absolute bottom-2 left-2 flex flex-wrap gap-3 text-xs font-semibold z-20 bg-white/90 px-3 py-2 rounded shadow-sm border border-gray-200">
           <div className="flex items-center gap-1"><div className="w-3 h-3 bg-dickens-green rounded-sm"></div> Ledig</div>
           <div className="flex items-center gap-1"><div className="w-3 h-3 bg-dickens-red rounded-sm"></div> Opptatt</div>
           <div className="flex items-center gap-1"><div className="w-3 h-3 border border-dickens-gold shadow-[0_0_5px_rgba(139,134,78,0.8)] rounded-sm"></div> Søk Treff</div>
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

        {/* Tables */}
        {MAP_TABLES.map((pos) => {
          const tableRes = reservationsForDate.filter(r => r.table_name === pos.name || `Table ${r.table_id}` === pos.name);
          const isOccupied = tableRes.length > 0;
          
          let isSearchMatch = false;
          if (search && isOccupied) {
            isSearchMatch = tableRes.some(r => 
              r.name.toLowerCase().includes(search.toLowerCase()) || 
              (r.phone && r.phone.includes(search))
            );
          }

          let bgClass = "bg-dickens-green"; // Available
          if (isOccupied) bgClass = "bg-dickens-red shadow-md cursor-pointer"; // Occupied

          const highlightClass = isSearchMatch ? "border-4 border-dickens-gold shadow-[0_0_15px_rgba(139,134,78,1)] scale-110 z-10" : "border border-black/20";

          let tooltipClasses = "absolute z-[9999] w-60 bg-white border border-gray-200 shadow-2xl rounded-lg p-3 pointer-events-auto ";
          let arrowClasses = "absolute border-4 border-transparent ";
          
          if (pos.name.startsWith('V')) {
            tooltipClasses += "left-full top-1/2 -translate-y-1/2 ml-4";
            arrowClasses += "right-full top-1/2 -translate-y-1/2 border-r-white";
          } else if (pos.name.startsWith('H')) {
            tooltipClasses += "right-full top-1/2 -translate-y-1/2 mr-4";
            arrowClasses += "left-full top-1/2 -translate-y-1/2 border-l-white";
          } else {
            tooltipClasses += "top-full left-1/2 -translate-x-1/2 mt-4";
            arrowClasses += "bottom-full left-1/2 -translate-x-1/2 border-b-white";
          }

          return (
            <div 
              key={pos.name} 
              className={`absolute ${activeTableId === pos.name ? 'z-[999]' : 'z-10'}`} 
              style={{ top: pos.top, left: pos.left }}
            >
              <div
                onClick={() => isOccupied && setActiveTableId(activeTableId === pos.name ? null : pos.name)}
                className={`w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 flex flex-col items-center justify-center rounded text-white transition-all duration-300 ${bgClass} ${highlightClass}`}
              >
                <span className="font-bold text-sm md:text-base">{pos.name}</span>
              </div>
              
              {/* Tooltip */}
              {activeTableId === pos.name && (
                <div className={tooltipClasses}>
                  <div className="font-bold text-gray-800 border-b border-gray-100 pb-1 mb-2">Bord {pos.name}</div>
                  {tableRes.map(r => (
                    <div key={r.id} className="mb-3 last:mb-0">
                      <div className="text-xs text-gray-600 mb-1">
                        <div className="font-semibold text-dickens-green text-sm">{r.name}</div>
                        <div>{r.time} ({r.guests} pers)</div>
                        <div className="text-gray-400">{r.phone}</div>
                      </div>
                      <div className="flex gap-2 mt-2 pt-2 border-t border-gray-50 pointer-events-auto">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTableId(null);
                            setEditModal({ open: true, data: { ...r, tableId: r.table_id } });
                          }}
                          className="flex-1 bg-gray-100 hover:bg-dickens-gold hover:text-white text-gray-700 font-gothic text-xs py-1 px-2 rounded transition-colors"
                        >
                          Rediger
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(r.id);
                          }}
                          className="flex-1 border border-red-200 hover:bg-red-50 text-red-600 font-gothic text-xs py-1 px-2 rounded transition-colors"
                        >
                          Slett
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className={arrowClasses}></div>
                </div>
              )}
            </div>
          )
        })}

        {/* No Match Notification */}
        {search && reservationsForDate.length > 0 && !reservationsForDate.some(r => r.name.toLowerCase().includes(search.toLowerCase()) || (r.phone && r.phone.includes(search))) && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-100 text-red-800 px-4 py-2 rounded-full shadow-md font-semibold text-sm animate-pulse z-30">
            No match found on the map
          </div>
        )}

      </div>

      {/* Edit Modal */}
      {editModal.open && editModal.data && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-xl shadow-xl p-8 w-[500px]">
            <h3 className="text-2xl font-bold mb-6 text-gray-900 font-gothic tracking-wide">Rediger Reservasjon #{editModal.data.id}</h3>
            
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">Navn</label>
                  <input type="text" value={editModal.data.name} onChange={e => setEditModal({...editModal, data: {...editModal.data, name: e.target.value}})} className="border border-gray-300 rounded px-3 py-2" required />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">Telefon</label>
                  <input type="text" value={editModal.data.phone || ''} onChange={e => setEditModal({...editModal, data: {...editModal.data, phone: e.target.value}})} className="border border-gray-300 rounded px-3 py-2" />
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">Dato</label>
                  <input type="date" value={editModal.data.date} onChange={e => setEditModal({...editModal, data: {...editModal.data, date: e.target.value}})} className="border border-gray-300 rounded px-3 py-2" required />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">Tid</label>
                  <input type="time" value={editModal.data.time} onChange={e => setEditModal({...editModal, data: {...editModal.data, time: e.target.value}})} className="border border-gray-300 rounded px-3 py-2" required />
                </div>
              </div>

              <div className="flex gap-4 mb-4">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">Gjester</label>
                  <input type="number" min="1" max="20" value={editModal.data.guests} onChange={e => setEditModal({...editModal, data: {...editModal.data, guests: e.target.value}})} className="border border-gray-300 rounded px-3 py-2" required />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">Bord</label>
                  <input type="text" disabled value={editModal.data.table_name || `Bord ${editModal.data.tableId}`} className="border border-gray-200 bg-gray-50 text-gray-500 rounded px-3 py-2 cursor-not-allowed" />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">Status</label>
                  <select value={editModal.data.status} onChange={e => setEditModal({...editModal, data: {...editModal.data, status: e.target.value}})} className="border border-gray-300 rounded px-3 py-2">
                    <option value="pending">Pending</option>
                    <option value="accepted">Confirmed</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>
              </div>

              {isOverCapacity && (
                <div className="text-red-600 font-semibold text-sm -mt-2 mb-2 bg-red-50 p-2 rounded border border-red-100">
                  ⚠️ Dette bordet har kun plass til {activeTableCapacity} personer.
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setEditModal({ open: false, data: null })} className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Avbryt</button>
                <button type="submit" disabled={isOverCapacity} className={`px-5 py-2 rounded-lg font-medium transition-colors ${isOverCapacity ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-dickens-green hover:bg-[#122a24] text-white'}`}>Lagre endringer</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
