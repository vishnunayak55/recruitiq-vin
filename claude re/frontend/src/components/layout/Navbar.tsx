import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  BrainCircuit, Menu, X, LogOut, LayoutDashboard,
  ChevronDown, History, Zap, Crown, User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => { setMobileOpen(false); setDropOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/'); };
  const isActive = (p: string) => location.pathname === p;

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Analyzer', to: '/analyzer' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'About', to: '/about' },
  ];

  const planIcon = user?.plan === 'premium' ? '👑' : user?.plan === 'pro' ? '⚡' : null;
  const planClass = user?.plan === 'premium'
    ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25'
    : user?.plan === 'pro'
    ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25'
    : 'bg-white/8 text-zinc-400 border-white/10';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#080810]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <BrainCircuit size={16} className="text-white" />
          </div>
          <span className="font-black text-white text-lg tracking-tight">RecruitIQ</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(l => (
            <Link key={l.label} to={l.to}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(l.to) ? 'text-white bg-white/8' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="relative" ref={dropRef}>
              <button onClick={() => setDropOpen(v => !v)}
                className="flex items-center gap-2 px-3 py-2 glass rounded-xl hover:bg-white/[0.05] transition-colors">
                {user.avatar
                  ? <img src={user.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                  : <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
                      {user.name[0].toUpperCase()}
                    </div>}
                <span className="text-white text-sm max-w-[90px] truncate">{user.name.split(' ')[0]}</span>
                {planIcon && <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold border ${planClass}`}>{planIcon} {user.plan}</span>}
                <ChevronDown size={13} className={`text-zinc-500 transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-[#13131f] border border-white/10 rounded-xl shadow-2xl shadow-black/60 py-1.5 animate-fade-in">
                  <div className="px-4 py-2.5 border-b border-white/8 mb-1">
                    <p className="text-white text-sm font-semibold truncate">{user.name}</p>
                    <p className="text-zinc-500 text-xs truncate">{user.email}</p>
                  </div>
                  <Link to="/dashboard" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors">
                    <LayoutDashboard size={14} className="text-zinc-500" /> Dashboard
                  </Link>
                  <Link to="/history" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors">
                    <History size={14} className="text-zinc-500" /> Resume History
                  </Link>
                  {user.plan === 'free' && (
                    <Link to="/pricing" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/5 transition-colors">
                      <Zap size={14} /> Upgrade — ₹49
                    </Link>
                  )}
                  <hr className="my-1 border-white/8" />
                  <button onClick={handleLogout}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 w-full transition-colors">
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-zinc-400 hover:text-white px-3 py-2 transition-colors">Login</Link>
              <Link to="/signup" className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setMobileOpen(v => !v)} className="md:hidden p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 px-4 py-3 space-y-1 bg-[#080810] animate-fade-in">
          {navLinks.map(l => (
            <Link key={l.label} to={l.to}
              className={`block px-3 py-2.5 text-sm rounded-xl transition-colors ${isActive(l.to) ? 'text-white bg-white/8' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
              {l.label}
            </Link>
          ))}
          <hr className="border-white/8 my-2" />
          {user ? (
            <>
              <div className="px-3 py-2 flex items-center gap-2.5">
                {user.avatar
                  ? <img src={user.avatar} className="w-8 h-8 rounded-full" alt="" />
                  : <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-sm font-bold text-white">{user.name[0]}</div>}
                <div>
                  <p className="text-white text-sm font-medium">{user.name}</p>
                  <p className="text-zinc-500 text-xs">{user.plan} plan</p>
                </div>
              </div>
              <Link to="/dashboard" className="block px-3 py-2.5 text-sm text-zinc-300 hover:text-white rounded-xl">Dashboard</Link>
              <Link to="/history" className="block px-3 py-2.5 text-sm text-zinc-300 hover:text-white rounded-xl">Resume History</Link>
              {user.plan === 'free' && <Link to="/pricing" className="block px-3 py-2.5 text-sm text-indigo-400 rounded-xl">⚡ Upgrade — ₹49</Link>}
              <button onClick={handleLogout} className="block w-full text-left px-3 py-2.5 text-sm text-red-400 rounded-xl">Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="block px-3 py-2.5 text-sm text-zinc-400 hover:text-white rounded-xl">Login</Link>
              <Link to="/signup" className="block px-3 py-2.5 text-sm text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl text-center transition-colors">Get Started Free</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
