import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, CreditCard, FileText, Receipt,
  DollarSign, Zap, User, LogOut, ChevronLeft, ChevronRight,
  BookOpen, Users, Shield, Building2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MOCK_REVENUE_ACTIONS } from '../../data/mockData';
import { clsx } from 'clsx';

const NAV_GROUPS = [
  {
    label: 'OVERVIEW',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'staff', 'customer'] },
    ],
  },
  {
    label: 'MANAGEMENT',
    roles: ['admin', 'staff'],
    items: [
      { label: 'Products',           to: '/products',      icon: Package,        roles: ['admin', 'staff'] },
      { label: 'Subscription Plans', to: '/plans',         icon: BookOpen,       roles: ['admin', 'staff'] },
      { label: 'Quotations',         to: '/quotations',    icon: FileText,       roles: ['admin', 'staff'] },
      { label: 'Subscriptions',      to: '/subscriptions', icon: CreditCard,     roles: ['admin', 'staff'] },
    ],
  },
  {
    label: 'FINANCE & BILLING',
    roles: ['admin', 'staff'],
    items: [
      { label: 'Invoices',  to: '/invoices',  icon: Receipt,    roles: ['admin', 'staff'] },
      { label: 'Payments',  to: '/payments',  icon: DollarSign, roles: ['admin', 'staff'] },
    ],
  },
  {
    label: 'INTELLIGENCE',
    roles: ['admin', 'staff'],
    items: [
      {
        label: 'Action Center',
        to: '/action-center',
        icon: Zap,
        roles: ['admin', 'staff'],
        badge: 'openAlerts'
      },
    ],
  },
  {
    label: 'ACCOUNT',
    items: [
      { label: 'My Profile',      to: '/profile',         icon: User,  roles: ['admin', 'staff', 'customer'] },
      { label: 'Customer Portal', to: '/customer-portal', icon: Users, roles: ['customer'] },
    ],
  },
];

export function Sidebar({ collapsed, onCollapse }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const openAlertsCount = MOCK_REVENUE_ACTIONS.filter(a => a.status === 'open').length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={clsx(
        'relative flex flex-col bg-[#0F172A] text-slate-300 border-r border-slate-800 transition-all duration-300 ease-in-out shrink-0 select-none z-40',
        collapsed ? 'w-18' : 'w-64'
      )}
      style={{ minHeight: '100vh' }}
    >
      {/* Brand Header */}
      <div className={clsx('flex items-center gap-3 px-5 py-5 border-b border-slate-800/80', collapsed && 'justify-center px-3')}>
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white font-extrabold text-base shadow-md shadow-indigo-500/20">
          R
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white text-base">REVORA</span>
              <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-1.5 py-0.2 rounded border border-indigo-400/30">
                SaaS
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium truncate">Revenue Intelligence</div>
          </div>
        )}
      </div>

      {/* Workspace Indicator */}
      {!collapsed && (
        <div className="mx-3 mt-3.5 mb-1.5">
          <div className="flex items-center gap-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 px-3 py-2 text-xs text-slate-300">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-indigo-500/20 text-indigo-400">
              <Building2 className="h-3 w-3" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-slate-200 leading-tight">TechWave Production</span>
              <span className="block text-[10px] text-slate-400 truncate">HQ • INR Ledger</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 sidebar-scroll space-y-4">
        {NAV_GROUPS.map(group => {
          const visibleItems = group.items.filter(item => item.roles.includes(user?.role));
          if (visibleItems.length === 0) return null;
          const groupVisible = !group.roles || group.roles.includes(user?.role);
          if (!groupVisible) return null;

          return (
            <div key={group.label}>
              {!collapsed && (
                <div className="px-3 mb-1.5 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  {group.label}
                </div>
              )}
              <div className="space-y-0.5">
                {visibleItems.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      clsx(
                        'group flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-150',
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <item.icon
                            className={clsx(
                              'h-4 w-4 shrink-0 transition-colors',
                              isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                            )}
                          />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </div>

                        {!collapsed && item.badge === 'openAlerts' && openAlertsCount > 0 && (
                          <span
                            className={clsx(
                              'px-1.5 py-0.5 text-[10px] font-bold rounded-full',
                              isActive
                                ? 'bg-white text-indigo-700'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            )}
                          >
                            {openAlertsCount}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Card & Logout */}
      <div className="border-t border-slate-800 p-3">
        {!collapsed ? (
          <div className="rounded-xl bg-slate-800/40 border border-slate-800 p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-white text-xs font-bold shadow-xs">
                {user?.avatar || 'HR'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-100 truncate leading-tight">
                  {user?.name}
                </div>
                <div className="text-[10px] text-slate-400 capitalize font-medium flex items-center gap-1">
                  <Shield className="h-2.5 w-2.5 text-indigo-400" />
                  {user?.role} Role
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="rounded-lg p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            title="Sign out"
            className="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onCollapse}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute -right-3 top-7 flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-300 hover:text-white shadow-md transition-colors cursor-pointer z-50 hover:bg-slate-700"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>
    </aside>
  );
}
