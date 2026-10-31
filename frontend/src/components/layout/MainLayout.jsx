import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const PAGE_TITLES = {
  '/dashboard':       'Dashboard',
  '/products':        'Products',
  '/plans':           'Subscription Plans',
  '/quotations':      'Quotations',
  '/subscriptions':   'Subscriptions',
  '/invoices':        'Invoices',
  '/payments':        'Payments',
  '/action-center':   'Revenue Action Center',
  '/customer-portal': 'Customer Portal',
  '/profile':         'My Profile',
};

export function MainLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'REVORA';

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar collapsed={collapsed} onCollapse={() => setCollapsed(v => !v)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} />
        <main className="flex-1 p-6 page-enter">
          {children}
        </main>
      </div>
    </div>
  );
}
