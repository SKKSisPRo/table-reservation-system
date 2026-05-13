import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import TimeDropdown from '../TimeDropdown';

export default function ReservationsView() {
  const [reservations, setReservations] = useState([]);
  const [tablesData, setTablesData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState(''); // Default Show All

  // Modals
  const [editModal, setEditModal] = useState({ open: false, data: null });

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/reservations');
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
    fetch('http://localhost:5000/tables')
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

  const handleDelete = async (id) => {
    if (window.confirm("Er du sikker på at du vil slette denne reservasjonen?")) {
      try {
        await fetch(`http://localhost:5000/reservations/${id}`, { method: 'DELETE' });
        fetchReservations();
      } catch (err) {
        console.error('Delete error', err);
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const payload = editModal.data;
    console.log("🚀 SENDING PAYLOAD:", payload);
    try {
      await fetch(`http://localhost:5000/reservations/${editModal.data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      fetchReservations();
    } catch (err) {
      console.error('Edit error', err);
    } finally {
      setEditModal({ open: false, data: null });
    }
  };

  let filtered = reservations;

  if (dateFilter) {
    filtered = filtered.filter(r => r.date === dateFilter);
  }

  if (search) {
    filtered = filtered.filter(r => 
      r.name.toLowerCase().includes(search.toLowerCase()) || 
      (r.phone && r.phone.includes(search))
    );
  }

  filtered.sort((a, b) => {
    if (a.date !== b.date) {
      return new Date(b.date) - new Date(a.date);
    }
    return b.time.localeCompare(a.time);
  });

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
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-full overflow-hidden">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-gothic text-dickens-green mb-1 drop-shadow-sm">Reservations</h1>
          <p className="text-gray-500 font-medium">Manage all incoming bookings</p>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <input 
            type="date" 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-dickens-gold shadow-sm"
          />
          <button 
            onClick={() => setDateFilter('')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Vis alle
          </button>
          <input 
            type="text" 
            placeholder="Søk på navn eller telefon..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 min-w-[250px] focus:outline-none focus:ring-2 focus:ring-dickens-gold shadow-sm"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center h-full text-dickens-green font-medium text-xl">Laster data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 font-semibold text-gray-700">Dato & Tid</th>
                  <th className="p-4 font-semibold text-gray-700">Navn</th>
                  <th className="p-4 font-semibold text-gray-700">Telefon</th>
                  <th className="p-4 font-semibold text-gray-700">Gjester</th>
                  <th className="p-4 font-semibold text-gray-700">Bord</th>
                  <th className="p-4 font-semibold text-gray-700">Info</th>
                  <th className="p-4 font-semibold text-gray-700 text-right">Handlinger</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{r.date}</div>
                      <div className="text-sm text-gray-500">{r.time}</div>
                    </td>
                    <td className="p-4 font-medium text-dickens-green">{r.name}</td>
                    <td className="p-4 text-gray-600">{r.phone}</td>
                    <td className="p-4 text-gray-600">{r.guests} pers</td>
                    <td className="p-4 text-gray-600 font-semibold">{r.table_name || `Bord ${r.table_id}`}</td>
                    <td className="p-4 text-gray-600 max-w-[150px] truncate" title={r.additionalInfo}>{r.additionalInfo ? r.additionalInfo : "—"}</td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => setEditModal({ open: true, data: { ...r, tableId: r.table_id } })}
                        className="px-3 py-1 bg-gray-100 hover:bg-dickens-gold hover:text-white text-gray-700 font-medium text-sm rounded mr-2 transition-colors"
                      >
                        Rediger
                      </button>
                      <button 
                        onClick={() => handleDelete(r.id)}
                        className="px-3 py-1 border border-red-200 hover:bg-red-50 text-red-600 font-medium text-sm rounded transition-colors"
                      >
                        Slett
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">Ingen reservasjoner funnet.</td>
                  </tr>
                )}
              </tbody>
            </table>
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
                <div className="w-48 flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">Telefon</label>
                  <input type="text" value={editModal.data.phone || ''} onChange={e => setEditModal({...editModal, data: {...editModal.data, phone: e.target.value}})} className="border border-gray-300 rounded px-3 py-2" />
                </div>
              </div>
              
              <div className="flex items-end gap-4">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">Dato</label>
                  <input type="date" value={editModal.data.date} onChange={e => setEditModal({...editModal, data: {...editModal.data, date: e.target.value}})} className="border border-gray-300 rounded px-3 py-2 h-10" required />
                </div>
                <div className="flex-1">
                  <TimeDropdown value={editModal.data.time} onChange={t => setEditModal({...editModal, data: {...editModal.data, time: t}})} date={editModal.data.date} />
                </div>
              </div>

              <div className="flex gap-4 mb-4">
                <div className="w-20 flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600">Gjester</label>
                  <input type="number" min="1" max="20" value={editModal.data.guests} onChange={e => setEditModal({...editModal, data: {...editModal.data, guests: e.target.value}})} className="border border-gray-300 rounded px-3 py-2" required />
                </div>
                <div className="w-20 flex flex-col gap-1">
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

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-600">Tilleggsinformasjon</label>
                <input type="text" value={editModal.data.additionalInfo || ''} onChange={e => setEditModal({...editModal, data: {...editModal.data, additionalInfo: e.target.value}})} className="border border-gray-300 rounded px-3 py-2" />
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
