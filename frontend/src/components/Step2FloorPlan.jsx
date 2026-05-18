import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import TimeDropdown from './TimeDropdown';
import GuestDropdown from './GuestDropdown';

const COUNTRIES = [
  { code: '+47', name: 'Norge', flag: '🇳🇴', minLength: 8, maxLength: 8 },
  { code: '+46', name: 'Sverige', flag: '🇸🇪', minLength: 9, maxLength: 9 },
  { code: '+45', name: 'Danmark', flag: '🇩🇰', minLength: 8, maxLength: 8 },
  { code: '+44', name: 'UK', flag: '🇬🇧', minLength: 10, maxLength: 10 },
  { code: '+49', name: 'Tyskland', flag: '🇩🇪', minLength: 10, maxLength: 11 },
  { code: '+33', name: 'Frankrike', flag: '🇫🇷', minLength: 9, maxLength: 9 },
  { code: '+39', name: 'Italia', flag: '🇮🇹', minLength: 9, maxLength: 10 },
  { code: '+34', name: 'Spania', flag: '🇪🇸', minLength: 9, maxLength: 9 },
  { code: '+48', name: 'Polen', flag: '🇵🇱', minLength: 9, maxLength: 9 },
  { code: '+31', name: 'Nederland', flag: '🇳🇱', minLength: 9, maxLength: 9 },
  { code: '+358', name: 'Finland', flag: '🇫🇮', minLength: 5, maxLength: 12 },
];

const MONTH_NAMES = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];

const RESERVATION_DURATION_MIN = 120;

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

export default function Step2FloorPlan({ bookingDetails, onBack, onSuccess }) {
  const [tables, setTables] = useState([]);
  const [availableIds, setAvailableIds] = useState(new Set());
  const [selectedTable, setSelectedTable] = useState(null);
  const [reservations, setReservations] = useState([]);

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
  }, [bookingDetails.date, bookingDetails.time]);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    time: '19:00',
    guests: 2,
    additionalInfo: ''
  });

  const [debouncedTime, setDebouncedTime] = useState(form.time);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTime(form.time);
    }, 500);
    return () => clearTimeout(handler);
  }, [form.time]);

  const reservationsForDate = reservations.filter(r =>
    r.date === bookingDetails.date &&
    ['pending', 'accepted'].includes(r.status) &&
    timesOverlap(r.time, form.time)
  );

  useEffect(() => {
    if (selectedTable) {
      const isOccupied = reservationsForDate.some(r => r.table_name === selectedTable.name || `Table ${r.table_id}` === selectedTable.name);
      if (isOccupied) {
        setSelectedTable(null);
      }
    }
  }, [reservationsForDate, selectedTable]);

  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [countryCode, setCountryCode] = useState('+47');

  // Re-fetch availability when time changes
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Fetch all tables
        const resAll = await fetch('http://localhost:3000/tables?areaId=1');
        const allTables = await resAll.json();
        setTables(allTables);

        // Fetch available tables
        const query = new URLSearchParams({
          date: bookingDetails.date,
          time: debouncedTime, // Use debounced time
          guests: 1,     // Show all available regardless of size
          level: 1,
          outdoor: 0
        });
        const resAvail = await fetch(`http://localhost:3000/tables/availability?${query}`);
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingDetails.date, debouncedTime]); // Add debouncedTime dependency

  // Auto-deselect table if guests count exceeds table capacity
  useEffect(() => {
    if (selectedTable && form.guests > selectedTable.capacity) {
      setSelectedTable(null);
    }
  }, [form.guests, selectedTable]);

  // Dynamic phone validation
  useEffect(() => {
    if (!form.phone) {
      setPhoneError('');
      return;
    }
    const country = COUNTRIES.find(c => c.code === countryCode);
    const numOnly = form.phone.replace(/\D/g, '');

    // Only show error if they've typed more than 0 digits
    if (numOnly.length > 0) {
      if (numOnly.length < country.minLength || numOnly.length > country.maxLength) {
        if (country.minLength === country.maxLength) {
          setPhoneError(`${country.name} krever nøyaktig ${country.minLength} siffer.`);
        } else {
          setPhoneError(`${country.name} krever mellom ${country.minLength} og ${country.maxLength} siffer.`);
        }
      } else {
        setPhoneError('');
      }
    } else {
      setPhoneError('');
    }
  }, [form.phone, countryCode]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedTable) return;
    setPhoneError('');
    setError('');

    if (phoneError) return;

    const country = COUNTRIES.find(c => c.code === countryCode);
    const numOnly = form.phone.replace(/\D/g, '');
    const internationalPhone = `${countryCode} ${numOnly}`;

    const payload = {
      tableId: selectedTable.id,
      name: `${form.firstName} ${form.lastName}`,
      phone: internationalPhone,
      date: bookingDetails.date,
      time: form.time,
      guests: Number(form.guests),
      additionalInfo: form.additionalInfo
    };
    console.log("🚀 SENDING PAYLOAD:", payload);

    try {
      const res = await fetch('http://localhost:5000/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSubmitted(true);
        if (onSuccess) onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || 'Kunne ikke reservere');
      }
    } catch (err) {
      setError('Nettverksfeil. Kunne ikke koble til server.');
    }
  };

  if (submitted) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center w-full h-full">
        <h2 className="text-4xl font-gothic text-dickens-green mb-4">Takk for din reservasjon!</h2>
        <p className="text-lg text-gray-700 mb-2">Vi har mottatt din booking for {bookingDetails.date} kl {form.time}.</p>
        <p className="text-base text-gray-600 mb-8 text-center">For spørsmål ring oss på 32 83 80 15</p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-dickens-green text-white rounded-lg hover:bg-dickens-gold transition-colors font-semibold shadow-md">Ny reservasjon</button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col md:flex-row gap-8 items-start py-8">

      {/* Floor Plan Area */}
      <div className="flex-grow w-full md:w-3/4">
        <div className="flex justify-between items-center mb-4">
          <button onClick={onBack} className="text-dickens-green hover:underline">&larr; Tilbake</button>
          <h1 className="font-gothic text-4xl text-dickens-green drop-shadow-sm">Bordvalg</h1>
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
            {MAP_TABLES.filter(pos => pos.name.startsWith('T')).map((pos) => {
              const tableData = tables.find(t => t.name === pos.name) || { id: pos.name, name: pos.name, capacity: 4 };
              const isAvailable = availableIds.has(tableData.id);
              const isSelected = selectedTable?.id === tableData.id;
              const isTooSmall = Number(form.guests) > tableData.capacity;
              const tableRes = reservationsForDate.filter(r => r.table_name === pos.name || `Table ${r.table_id}` === pos.name);
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
                    if (isOccupied) return;
                    setSelectedTable(tableData);
                    if (form.guests < 1) setForm({ ...form, guests: tableData.capacity });
                  }}
                  className={`w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 flex flex-col items-center justify-center rounded text-white shadow-md transition-all duration-200 border border-black/20 ${bgClass}`}
                >
                  <span className="font-bold text-sm md:text-base">{pos.name}</span>
                  <span className="text-xs flex items-center gap-1 opacity-90">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                    {tableData.capacity}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Other Tables */}
          {MAP_TABLES.filter(pos => !pos.name.startsWith('T')).map((pos) => {
            const tableData = tables.find(t => t.name === pos.name) || { id: pos.name, name: pos.name, capacity: 4 };
            const isAvailable = availableIds.has(tableData.id);
            const isSelected = selectedTable?.id === tableData.id;
            const isTooSmall = Number(form.guests) > tableData.capacity;
            const tableRes = reservationsForDate.filter(r => r.table_name === pos.name || `Table ${r.table_id}` === pos.name);
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
                  if (isOccupied) return;
                  setSelectedTable(tableData);
                  if (form.guests < 1) setForm({ ...form, guests: tableData.capacity });
                }}
                className={`absolute w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 flex flex-col items-center justify-center rounded text-white shadow-md transition-all duration-200 border border-black/20 ${bgClass}`}
                style={{ top: pos.top, left: pos.left }}
              >
                <span className="font-bold text-sm md:text-base">{pos.name}</span>
                <span className="text-xs flex items-center gap-1 opacity-90">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                  {tableData.capacity}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sidebar Form */}
      <div className="w-full md:w-1/4 flex flex-col items-center">
        <h2 className="font-gothic text-3xl text-dickens-green drop-shadow-sm mb-4 mt-8 md:mt-0">Fyll ut informasjon</h2>

        <div className="bg-white p-5 rounded-2xl shadow-xl border border-gray-200 w-full">
          <div className="bg-dickens-green text-white p-3 rounded-t-xl -mt-5 -mx-5 mb-5 font-semibold text-base border-b-4 border-dickens-gold text-center">
            {selectedTable ? `Valgt bord: ${selectedTable.name} (${selectedTable.capacity} pers)` : "Velg et bord..."}
          </div>

          {error && <div className="bg-red-50 text-red-600 p-2 mb-3 rounded border border-red-200 text-xs font-medium text-center">{error}</div>}

          <form onSubmit={handleBook} className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Fornavn</label>
              <input
                type="text" required
                value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })}
                className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-dickens-gold focus:ring-1 focus:ring-dickens-gold h-9"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Etternavn</label>
              <input
                type="text" required
                value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })}
                className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-dickens-gold focus:ring-1 focus:ring-dickens-gold h-9"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Telefon</label>
              <div className="flex flex-row w-full gap-4 items-center">
                <select
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  className="border border-gray-300 rounded px-1 py-1.5 text-xs focus:outline-none focus:border-dickens-gold focus:ring-1 focus:ring-dickens-gold bg-white w-[70px] shrink-0 h-9"
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                  ))}
                </select>
                <input
                  type="tel" required
                  value={form.phone} onChange={e => {
                    setForm({ ...form, phone: e.target.value });
                    setPhoneError(''); // clear error on type
                  }}
                  className={`flex-1 min-w-0 border ${phoneError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-dickens-gold focus:ring-dickens-gold'} rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 h-9`}
                />
              </div>
              {phoneError && <span className="text-xs font-medium text-red-500 mt-1">{phoneError}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tilleggsinformasjon (Valgfritt)</label>
              <input
                type="text"
                value={form.additionalInfo} onChange={e => setForm({ ...form, additionalInfo: e.target.value })}
                className="border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-dickens-gold focus:ring-1 focus:ring-dickens-gold h-10"
                placeholder="Evt. allergier, spesielle behov..."
              />
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_85px_45px] gap-2 items-center w-full">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Dato</label>
                <input
                  type="text" readOnly
                  value={(() => {
                    const parts = bookingDetails.date.split('-');
                    if (parts.length === 3) {
                      return `${parts[2]}.${parts[1]}.${parts[0]}`;
                    }
                    return bookingDetails.date;
                  })()}
                  className="border border-gray-300 rounded px-1 py-1.5 text-xs cursor-not-allowed text-center h-10 bg-white text-gray-800"
                />
              </div>
              
              <TimeDropdown value={form.time} onChange={t => setForm({ ...form, time: t })} date={bookingDetails.date} />

              <GuestDropdown value={form.guests} onChange={val => setForm({ ...form, guests: val })} />
            </div>

            <button
              type="submit"
              disabled={!selectedTable || !!phoneError || !form.phone}
              className={`w-full py-3 mt-2 rounded-lg font-bold text-lg transition-colors shadow-md ${selectedTable && !phoneError && form.phone
                ? 'bg-dickens-green text-white hover:bg-[#122a24]'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              Reserver
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
