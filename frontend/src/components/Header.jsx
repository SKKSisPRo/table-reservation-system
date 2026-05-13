export default function Header() {
  return (
    <header className="bg-dickens-green w-full px-6 py-4 flex items-center justify-start shadow-md text-dickens-cream border-b-4 border-dickens-gold">
      <div className="flex items-center gap-4">
        <img src="/Dickens_logo (1).png" alt="Dickens Pub" className="h-12 w-auto object-contain" />
        <div className="flex flex-col ml-2 border-l-2 border-dickens-cream pl-4">
          <span className="text-xs uppercase tracking-[0.2em] font-medium opacity-80">Drammens Eldste Pub</span>
        </div>
      </div>
    </header>
  );
}
