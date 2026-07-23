import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Package, Settings, LogOut, Compass, Menu, X } from 'lucide-react';

const NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/leads',     label: 'Leads',     icon: Users },
  { path: '/packages',  label: 'Packages',  icon: Package },
  { path: '/settings',  label: 'Settings',  icon: Settings },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem('tripmate_admin_token');
    navigate('/');
  };

  const NavItems = () => (
    <>
      {NAV.map(n => {
        const active = location.pathname === n.path;
        return (
          <Link key={n.path} to={n.path} onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}>
            <n.icon size={18}/>
            {n.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900/50 border-r border-white/10 p-4 fixed h-full">
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-9 h-9 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center justify-center">
            <Compass size={18} className="text-emerald-400"/>
          </div>
          <div>
            <p className="text-white font-bold text-sm">TripMate</p>
            <p className="text-slate-500 text-xs">Admin Panel</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1"><NavItems/></nav>
        <button onClick={logout} className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl text-sm transition-all">
          <LogOut size={18}/> Logout
        </button>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 inset-x-0 z-50 bg-slate-900/90 backdrop-blur border-b border-white/10 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Compass size={20} className="text-emerald-400"/>
          <span className="text-white font-bold text-sm">TripMate Admin</span>
        </div>
        <button onClick={() => setOpen(!open)} className="text-slate-400 hover:text-white">
          {open ? <X size={22}/> : <Menu size={22}/>}
        </button>
      </header>
      {open && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-40 pt-14" onClick={() => setOpen(false)}>
          <div className="bg-slate-900 border-r border-white/10 h-full w-64 p-4 space-y-1" onClick={e => e.stopPropagation()}>
            <NavItems/>
            <button onClick={logout} className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-400 rounded-xl text-sm w-full">
              <LogOut size={18}/> Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="md:ml-64 flex-1 p-4 md:p-8 pt-20 md:pt-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
