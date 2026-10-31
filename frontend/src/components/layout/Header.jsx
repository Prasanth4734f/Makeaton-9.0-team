import { Bell, Search, ChevronDown, User, LogOut, Shield } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MOCK_REVENUE_ACTIONS } from '../../data/mockData';
import { clsx } from 'clsx';

export function Header({ title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const openAlerts = MOCK_REVENUE_ACTIONS.filter(a => a.status === 'open');

  useEffect(() => {
    const handler = e => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/90 bg-white/95 px-6 backdrop-blur-md gap-4 relative">
      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-blue-500 via-indigo-500 via-purple-500 via-pink-500 to-amber-500" />
      {/* Title & Live Status */}
      <div className="flex items-center gap-3 min-w-0">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight truncate leading-tight">
            {title}
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-slate-500">
              Recurring Billing Engine Active
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Global Search Bar */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search subscriptions, invoices, customers..."
            className="w-72 rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-9 pr-12 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15 transition-all shadow-2xs"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 shadow-2xs">
            <span>Ctrl</span>
            <span>K</span>
          </div>
        </div>

        {/* Action Center Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen(v => !v)}
            title="Revenue Intelligence Alerts"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            {openAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs">
                {openAlerts.length}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-84 rounded-2xl border border-slate-200 bg-white shadow-xl py-2 z-50">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">Intelligence Alerts</span>
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                    {openAlerts.length} Require Triage
                  </span>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {openAlerts.map(alert => (
                  <button
                    key={alert.id}
                    onClick={() => {
                      setNotifOpen(false);
                      navigate('/action-center');
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 line-clamp-1">
                        {alert.title}
                      </span>
                      <span
                        className={clsx(
                          'shrink-0 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase',
                          alert.priority === 'critical'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        )}
                      >
                        {alert.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 leading-normal">
                      {alert.recommendedAction}
                    </p>
                  </button>
                ))}
              </div>

              {user?.role !== 'customer' && (
                <div className="px-3 pt-2 pb-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setNotifOpen(false);
                      navigate('/action-center');
                    }}
                    className="w-full py-1.5 text-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                  >
                    Launch Revenue Action Center →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(v => !v)}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 text-white text-xs font-bold shadow-xs">
              {user?.avatar || 'HR'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-none">
                {user?.name?.split(' ')[0]}
              </div>
              <div className="text-[10px] text-slate-400 capitalize mt-0.5 font-medium">
                {user?.role}
              </div>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white shadow-xl py-1.5 z-50">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900">{user?.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                <div className="mt-1 inline-flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 capitalize">
                  <Shield className="h-2.5 w-2.5" />
                  {user?.role} Privileges
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <User className="h-3.5 w-3.5 text-slate-400" /> My Profile & Security
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign out of REVORA
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
