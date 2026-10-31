import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// App Pages
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Plans from './pages/Plans';
import Quotations from './pages/Quotations';
import Subscriptions from './pages/Subscriptions';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import ActionCenter from './pages/ActionCenter';
import CustomerPortal from './pages/CustomerPortal';
import Profile from './pages/Profile';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protected routes — Admin & Staff */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout><Dashboard /></MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <MainLayout><Products /></MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/plans"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <MainLayout><Plans /></MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotations"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <MainLayout><Quotations /></MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscriptions"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <MainLayout><Subscriptions /></MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <MainLayout><Invoices /></MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <MainLayout><Payments /></MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/action-center"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <MainLayout><ActionCenter /></MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer-portal"
            element={
              <ProtectedRoute>
                <MainLayout><CustomerPortal /></MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <MainLayout><Profile /></MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
