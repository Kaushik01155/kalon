import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setOpen(false);
  };

  const links = user
    ? user.role === 'admin'
      ? [{ to: '/admin', label: 'Admin' }]
      : user.role === 'volunteer'
        ? [{ to: '/volunteer', label: 'Dashboard' }]
        : [
            { to: '/dashboard', label: 'Home' },
            { to: '/vehicles', label: 'Vehicles' },
            { to: '/requests', label: 'My Requests' },
          ]
    : [];

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-kalon-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to={user ? (user.role === 'admin' ? '/admin' : user.role === 'volunteer' ? '/volunteer' : '/dashboard') : '/'} className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-kalon-900 tracking-tight">Kalon</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm font-medium text-slate-600 hover:text-kalon-600 transition">
              {l.label}
            </Link>
          ))}
          {user ? (
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 transition">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          ) : (
            <Link to="/login" className="btn-primary text-sm py-2 px-4">Login</Link>
          )}
        </nav>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-kalon-100 px-4 py-4 space-y-3 bg-white">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block py-2 font-medium text-slate-700">
              {l.label}
            </Link>
          ))}
          {user ? (
            <button onClick={handleLogout} className="text-red-600 font-medium">Logout</button>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)} className="btn-primary inline-block">Login</Link>
          )}
        </div>
      )}
    </header>
  );
}
