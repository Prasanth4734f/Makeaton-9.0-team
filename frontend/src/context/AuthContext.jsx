import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { MOCK_USERS } from '../data/mockData';

const AuthContext = createContext(null);

const STORAGE_KEY = 'revora_auth';

// ── Auth Utilities ─────────────────────────────────────────────────────────────
function simulateDelay(ms = 600) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── AuthProvider ───────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Rehydrate session from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await simulateDelay(800);
      const found = MOCK_USERS.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      if (!found) {
        throw new Error('Invalid email or password. Try a demo account below.');
      }
      const { password: _pw, ...safeUser } = found;
      setUser(safeUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
      return { success: true, user: safeUser };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const register = useCallback(async ({ name, email, password }) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await simulateDelay(1000);
      const exists = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) throw new Error('An account with this email already exists.');
      // In mock mode, create a staff session
      const newUser = {
        id: `u_${Date.now()}`,
        name,
        email,
        role: 'staff',
        avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
        department: 'New',
        phone: '',
        createdAt: new Date().toISOString(),
      };
      setUser(newUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      return { success: true, user: newUser };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async ({ email }) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await simulateDelay(700);
      const exists = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!exists) throw new Error('No account found with that email address.');
      return { success: true };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setAuthError(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const clearError = useCallback(() => setAuthError(null), []);

  return (
    <AuthContext.Provider
      value={{ user, loading, authLoading, authError, login, register, forgotPassword, logout, clearError }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
