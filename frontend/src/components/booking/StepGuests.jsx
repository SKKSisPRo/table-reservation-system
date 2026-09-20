const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function StepGuests({ guests, onNext }) {
  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto py-4">
      <h1 className="font-gothic text-4xl md:text-5xl text-dickens-green mb-6 text-center drop-shadow-sm">
        Hvor mange personer?
      </h1>

      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 w-full max-w-md">
        <div className="grid grid-cols-4 gap-3">
          {GUEST_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => onNext(opt)}
              className={`h-16 flex items-center justify-center rounded-lg text-lg font-semibold border shadow-sm transition-colors ${
                guests === opt
                  ? 'bg-dickens-gold text-white border-dickens-gold'
                  : 'bg-gray-50 text-gray-800 hover:bg-dickens-gold hover:text-white border-gray-100'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-gray-500 mt-4">
          Flere enn 8 personer? Ring oss på 32 83 80 15.
        </p>
      </div>
    </div>
  );
}
