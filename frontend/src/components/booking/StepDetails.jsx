import { useState, useEffect } from 'react';

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

function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return dateStr;
}

export default function StepDetails({
  date, time, guests, selectedTable,
  firstName, setFirstName,
  lastName, setLastName,
  phone, setPhone,
  countryCode, setCountryCode,
  additionalInfo, setAdditionalInfo,
  onBack, onSuccess
}) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Dynamic phone validation
  useEffect(() => {
    if (!phone) {
      setPhoneError('');
      return;
    }
    const country = COUNTRIES.find(c => c.code === countryCode);
    const numOnly = phone.replace(/\D/g, '');

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
  }, [phone, countryCode]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedTable) return;
    setPhoneError('');
    setError('');

    if (phoneError) return;

    const numOnly = phone.replace(/\D/g, '');
    const internationalPhone = `${countryCode} ${numOnly}`;

    const payload = {
      tableId: selectedTable.id,
      name: `${firstName} ${lastName}`,
      phone: internationalPhone,
      date,
      time,
      guests: Number(guests),
      additionalInfo
    };

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
      <div className="flex-grow flex flex-col items-center justify-center w-full min-h-[60vh]">
        <h2 className="text-4xl font-gothic text-dickens-green mb-4">Takk for din reservasjon!</h2>
        <p className="text-lg text-gray-700 mb-2">Vi har mottatt din booking for {date} kl {time}.</p>
        <p className="text-base text-gray-600 mb-8 text-center">For spørsmål ring oss på 32 83 80 15</p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-dickens-green text-white rounded-lg hover:bg-dickens-gold transition-colors font-semibold shadow-md">Ny reservasjon</button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-4">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="text-dickens-green hover:underline">&larr; Tilbake</button>
        <h1 className="font-gothic text-4xl text-dickens-green drop-shadow-sm text-center">Fyll ut informasjon</h1>
        <div className="w-20"></div> {/* Spacer for centering */}
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">

        {/* Summary */}
        <div className="bg-white p-5 rounded-2xl shadow-xl border border-gray-200 w-full">
          <div className="bg-dickens-green text-white p-3 rounded-t-xl -mt-5 -mx-5 mb-5 font-semibold text-base border-b-4 border-dickens-gold text-center">
            Oppsummering
          </div>
          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <dt className="text-gray-500 uppercase text-xs tracking-wide font-semibold self-center">Dato</dt>
            <dd className="text-gray-800 font-medium text-right">{formatDate(date)}</dd>

            <dt className="text-gray-500 uppercase text-xs tracking-wide font-semibold self-center">Tid</dt>
            <dd className="text-gray-800 font-medium text-right">{time}</dd>

            <dt className="text-gray-500 uppercase text-xs tracking-wide font-semibold self-center">Antall</dt>
            <dd className="text-gray-800 font-medium text-right">{guests} {Number(guests) === 1 ? 'person' : 'personer'}</dd>

            <dt className="text-gray-500 uppercase text-xs tracking-wide font-semibold self-center">Bord</dt>
            <dd className="text-gray-800 font-medium text-right">{selectedTable ? `${selectedTable.name} (${selectedTable.capacity} pers)` : '—'}</dd>
          </dl>
        </div>

        {/* Form */}
        <div className="bg-white p-5 rounded-2xl shadow-xl border border-gray-200 w-full">
          {error && <div className="bg-red-50 text-red-600 p-2 mb-3 rounded border border-red-200 text-xs font-medium text-center">{error}</div>}

          <form onSubmit={handleBook} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Fornavn</label>
              <input
                type="text" required
                value={firstName} onChange={e => setFirstName(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-dickens-gold focus:ring-1 focus:ring-dickens-gold h-9"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Etternavn</label>
              <input
                type="text" required
                value={lastName} onChange={e => setLastName(e.target.value)}
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
                  value={phone} onChange={e => {
                    setPhone(e.target.value);
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
                value={additionalInfo} onChange={e => setAdditionalInfo(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-dickens-gold focus:ring-1 focus:ring-dickens-gold h-10"
                placeholder="Evt. allergier, spesielle behov..."
              />
            </div>

            <button
              type="submit"
              disabled={!selectedTable || !!phoneError || !phone}
              className={`w-full py-3 mt-2 rounded-lg font-bold text-lg transition-colors shadow-md ${selectedTable && !phoneError && phone
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
