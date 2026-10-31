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
      {
        label: 'Dashboard',
        to: '/dashboard',
        icon: LayoutDashboard,
        roles: ['admin', 'staff', 'customer'],
        activeBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/25',
        iconColor: 'text-blue-400',
        iconBg: 'bg-blue-500/10'
      },
    ],
  },
  {
    label: 'MANAGEMENT',
    roles: ['admin', 'staff'],
    items: [
      {
        label: 'Products',
        to: '/products',
        icon: Package,
        roles: ['admin', 'staff'],
        activeBg: 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-purple-500/25',
        iconColor: 'text-purple-400',
        iconBg: 'bg-purple-500/10'
      },
      {
        label: 'Subscription Plans',
        to: '/plans',
        icon: BookOpen,
        roles: ['admin', 'staff'],
        activeBg: 'bg-gradient-to-r from-cyan-600 to-blue-600 shadow-cyan-500/25',
        iconColor: 'text-cyan-400',
        iconBg: 'bg-cyan-500/10'
      },
      {
        label: 'Quotations',
        to: '/quotations',
        icon: FileText,
        roles: ['admin', 'staff'],
        activeBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/25',
        iconColor: 'text-emerald-400',
        iconBg: 'bg-emerald-500/10'
      },
      {
        label: 'Subscriptions',
        to: '/subscriptions',
        icon: CreditCard,
        roles: ['admin', 'staff'],
        activeBg: 'bg-gradient-to-r from-violet-600 to-indigo-600 shadow-indigo-500/25',
        iconColor: 'text-violet-400',
        iconBg: 'bg-violet-500/10'
      },
    ],
  },
  {
    label: 'FINANCE & BILLING',
    roles: ['admin', 'staff'],
    items: [
      {
        label: 'Invoices',
        to: '/invoices',
        icon: Receipt,
        roles: ['admin', 'staff'],
        activeBg: 'bg-gradient-to-r from-fuchsia-600 to-pink-600 shadow-fuchsia-500/25',
        iconColor: 'text-fuchsia-400',
        iconBg: 'bg-fuchsia-500/10'
      },
      {
        label: 'Payments',
        to: '/payments',
        icon: DollarSign,
        roles: ['admin', 'staff'],
        activeBg: 'bg-gradient-to-r from-teal-600 to-emerald-600 shadow-teal-500/25',
        iconColor: 'text-teal-400',
        iconBg: 'bg-teal-500/10'
      },
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
        badge: 'openAlerts',
        activeBg: 'bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 shadow-orange-500/30',
        iconColor: 'text-amber-400',
        iconBg: 'bg-amber-500/15'
      },
    ],
  },
  {
    label: 'ACCOUNT',
    items: [
      {
        label: 'My Profile',
        to: '/profile',
        icon: User,
        roles: ['admin', 'staff', 'customer'],
        activeBg: 'bg-gradient-to-r from-slate-700 to-slate-800 shadow-slate-700/25',
        iconColor: 'text-slate-300',
        iconBg: 'bg-slate-700/30'
      },
      {
        label: 'Customer Portal',
        to: '/customer-portal',
        icon: Users,
        roles: ['customer'],
        activeBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/25',
        iconColor: 'text-emerald-400',
        iconBg: 'bg-emerald-500/10'
      },
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
        'relative flex flex-col bg-[#111827] text-slate-300 border-r border-slate-800 transition-all duration-300 ease-in-out shrink-0 select-none z-40',
        collapsed ? 'w-18' : 'w-64'
      )}
      style={{ minHeight: '100vh' }}
    >
      {/* Brand Header */}
      <div className={clsx('flex items-center gap-3 px-5 py-5 border-b border-slate-800/80', collapsed && 'justify-center px-3')}>
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white font-black text-lg shadow-lg shadow-indigo-500/30">
          R
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 ring-2 ring-[#111827]" />
          </span>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-white text-base">REVORA</span>
              <span className="text-[10px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400 bg-indigo-500/20 px-1.5 py-0.5 rounded border border-indigo-400/30">
                PRO
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium truncate">Subscription Intelligence</div>
          </div>
        )}
      </div>

      {/* Workspace Indicator */}
      {!collapsed && (
        <div className="mx-3 mt-3.5 mb-1.5">
          <div className="flex items-center gap-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 px-3 py-2 text-xs text-slate-300">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-xs">
              <Building2 className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-slate-200 leading-tight">TechWave Production</span>
              <span className="block text-[10px] text-indigo-400 font-medium truncate">Active • Multi-Tier Billing</span>
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
                <div className="px-3 mb-1.5 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
                  {group.label}
                </div>
              )}
              <div className="space-y-1">
                {visibleItems.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      clsx(
                        'group flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200',
                        isActive
                          ? `${item.activeBg} text-white shadow-md font-bold`
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={clsx(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors',
                            isActive ? 'bg-white/20 text-white' : `${item.iconBg} ${item.iconColor} group-hover:scale-105`
                          )}>
                            <item.icon className="h-4 w-4" />
                          </div>
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </div>

                        {!collapsed && item.badge === 'openAlerts' && openAlertsCount > 0 && (
                          <span
                            className={clsx(
                              'px-2 py-0.5 text-[10px] font-black rounded-full shadow-xs',
                              isActive
                                ? 'bg-white text-rose-700'
                                : 'bg-gradient-to-r from-rose-500 to-amber-500 text-white animate-pulse'
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
          <div className="rounded-xl bg-slate-800/50 border border-slate-700/60 p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs ring-2 ring-indigo-400/40">
                {user?.avatar || 'HR'}
              </div>
              <div className="min-w-0">
                <span className="block truncate text-xs font-bold text-white leading-tight">
                  {user?.name || 'Harshitha'}
                </span>
                <span className="inline-flex items-center rounded-full bg-indigo-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-indigo-300 capitalize">
                  {user?.role || 'admin'}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out of REVORA"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs ring-2 ring-indigo-400/40">
              {user?.avatar || 'HR'}
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Sidebar Collapse Toggle */}
        <button
          onClick={onCollapse}
          className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg py-1 text-[11px] font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-3.5 w-3.5" /> Collapse</>}
        </button>
      </div>
    </aside>
  );
}
