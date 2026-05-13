import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-dickens-green w-full h-16 mt-auto flex items-center justify-end px-8">
      <Link to="/admin" className="text-dickens-cream/50 hover:text-dickens-cream text-sm font-medium transition-colors">
        Admin
      </Link>
    </footer>
  );
}
