import { useState, useEffect, useRef } from 'react';

export default function GuestDropdown({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const options = [1, 2, 3, 4, 5, 6, 7, 8];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-1 relative w-[45px]" ref={dropdownRef}>
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 border border-dickens-gold rounded px-1 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-dickens-gold text-center bg-dickens-green text-white font-semibold flex items-center justify-between hover:bg-dickens-green/90 transition-colors"
      >
        <span className="flex-grow text-center pl-1">{value}</span>
        <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-full max-h-40 overflow-y-auto bg-dickens-green border border-dickens-gold rounded-md shadow-lg z-50">
          {options.map((opt) => (
            <div
              key={opt}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              className={`px-2 py-1.5 text-xs text-white cursor-pointer hover:bg-dickens-gold hover:text-dickens-green transition-colors font-medium text-center ${value === opt ? 'bg-dickens-gold text-dickens-green' : ''}`}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
