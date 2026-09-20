const getTimes = (dateStr) => {
  const date = new Date(dateStr);
  const day = date.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const isWeekend = day === 0 || day === 5 || day === 6; // Fri, Sat, Sun
  const startHour = isWeekend ? 11 : 12;
  const endHour = 21;

  const times = [];
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === endHour && m > 0) break;
      const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      times.push(timeStr);
    }
  }
  return times;
};

export default function StepTime({ date, time, onNext, onBack }) {
  const times = getTimes(date);

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto py-4">
      <div className="w-full max-w-md flex justify-start mb-2">
        <button onClick={onBack} className="text-dickens-green hover:underline text-sm">&larr; Tilbake</button>
      </div>

      <h1 className="font-gothic text-4xl md:text-5xl text-dickens-green mb-6 text-center drop-shadow-sm">
        Velg ønsket tidspunkt
      </h1>

      <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200 w-full max-w-md">
        <div className="grid grid-cols-4 gap-2 max-h-96 overflow-y-auto">
          {times.map((t) => (
            <button
              key={t}
              onClick={() => onNext(t)}
              className={`h-11 flex items-center justify-center rounded-lg text-sm font-medium border shadow-sm transition-colors ${
                time === t
                  ? 'bg-dickens-gold text-white border-dickens-gold'
                  : 'bg-gray-50 text-gray-800 hover:bg-dickens-gold hover:text-white border-gray-100'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
