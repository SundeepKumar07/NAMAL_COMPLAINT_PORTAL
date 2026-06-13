import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

function LogoImg() {
  const [err, setErr] = useState(false);
  if (err) return <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-xs font-bold text-white">N</div>;
  return <img src="/namal_logo.png" alt="Namal" className="h-8 w-8 object-contain" onError={() => setErr(true)} />;
}

const ROLE_COLORS = {
  admin:              { bg: 'bg-purple-100',  text: 'text-purple-800',  dot: 'bg-purple-500',  nav: 'border-purple-600 text-purple-700' },
  maintenance_staff:  { bg: 'bg-orange-100',  text: 'text-orange-800',  dot: 'bg-orange-500',  nav: 'border-orange-500 text-orange-700' },
  end_user:           { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500', nav: 'border-emerald-600 text-emerald-700' },
};

export default function DashboardLayout({ title, navItems, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const rc = ROLE_COLORS[user?.role_type] || ROLE_COLORS.end_user;
  const initials = user?.full_name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || 'U';

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* ── Top header ── */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 lg:px-6">

          {/* Left: logo + title */}
          <div className="flex min-w-0 items-center gap-3">
            <LogoImg />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">NCMMS</p>
              <p className="truncate text-sm font-semibold text-slate-800 leading-tight">{title}</p>
            </div>
          </div>

          {/* Right: notifications + user + logout */}
          <div className="flex flex-shrink-0 items-center gap-2">
            <NotificationBell />

            {/* User chip */}
            <div className={`hidden sm:flex items-center gap-2 rounded-full border px-3 py-1.5 ${rc.bg} border-transparent`}>
              <div className={`flex h-6 w-6 items-center justify-center rounded-full ${rc.dot} text-[10px] font-bold text-white`}>
                {initials}
              </div>
              <div className="text-right">
                <p className={`text-xs font-semibold ${rc.text} leading-tight`}>{user?.full_name}</p>
                <p className={`text-[10px] capitalize ${rc.text} opacity-70`}>{user?.role_type?.replace(/_/g,' ')}</p>
              </div>
            </div>

            <button onClick={handleLogout}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all">
              Logout
            </button>
          </div>
        </div>

        {/* ── Navigation tabs ── */}
        <div className="border-t border-slate-100 bg-white">
          <div className="mx-auto flex max-w-7xl overflow-x-auto px-4 lg:px-6 scrollbar-none">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                    isActive
                      ? `${rc.nav} bg-slate-50`
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`
                }>
                {item.icon && <span className="text-sm">{item.icon}</span>}
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">{children}</main>
    </div>
  );
}
