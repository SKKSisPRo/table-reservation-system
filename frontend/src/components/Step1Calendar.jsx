import { useState } from 'react';

export default function Step1Calendar({ onSelect }) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  // Tomorrow is the minDate
  const minDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  minDate.setHours(0, 0, 0, 0);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  // Adjust for Monday start (0 = Sunday in JS)
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // Ensure we always render 42 cells (6 weeks) to prevent layout jumping
  while (days.length < 42) {
    days.push(null);
  }

  const monthNames = ["Januar", "Februar", "Mars", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Desember"];

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto py-4">
      <h1 className="font-gothic text-4xl md:text-5xl text-dickens-green mb-6 text-center drop-shadow-sm">
        Velg dato for besøket
      </h1>

      <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
            className="text-dickens-green hover:text-dickens-gold text-xl px-3"
          >
            &larr;
          </button>
          <h2 className="text-xl font-semibold text-dickens-green">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
            className="text-dickens-green hover:text-dickens-gold text-xl px-3"
          >
            &rarr;
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2 text-center font-medium text-gray-500 text-sm">
          <div>Ma</div><div>Ti</div><div>On</div><div>To</div><div>Fr</div><div>Lø</div><div>Sø</div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (!day) return <div key={index} className="h-10"></div>;

            const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isDisabled = cellDate < minDate;
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            return (
              <button
                key={index}
                disabled={isDisabled}
                onClick={() => onSelect(dateStr)}
                className={`h-10 flex items-center justify-center rounded-lg text-base font-medium border shadow-sm transition-colors ${isDisabled
                    ? 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-gray-50 text-gray-800 hover:bg-dickens-gold hover:text-white border-gray-100'
                  }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
