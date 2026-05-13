import { Outlet, NavLink, Link } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-[#F9FAFB] font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-dickens-green text-white flex flex-col flex-shrink-0">
        <div className="h-20 flex items-center justify-center border-b border-white/20">
          <Link to="/" className="flex items-center justify-center">
            <img src="/Dickens_logo (1).png" alt="Dickens Pub" className="h-12 w-auto object-contain drop-shadow-md" />
          </Link>
        </div>
        
        <nav className="flex-grow py-6 flex flex-col gap-2 px-4">
          <NavLink 
            to="/admin" 
            end
            className={({ isActive }) => 
              `px-4 py-3 rounded-lg text-lg font-medium transition-colors ${
                isActive ? 'bg-white/20 text-dickens-cream' : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            Reservations
          </NavLink>
          
          <NavLink 
            to="/admin/map" 
            className={({ isActive }) => 
              `px-4 py-3 rounded-lg text-lg font-medium transition-colors ${
                isActive ? 'bg-white/20 text-dickens-cream' : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            Table Map
          </NavLink>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col overflow-hidden">
        <div className="flex-grow overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
