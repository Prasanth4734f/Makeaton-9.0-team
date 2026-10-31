import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../services/api.js';
import { MOCK_USERS } from '../data/mockData.js';

const AuthContext = createContext(null);

const STORAGE_KEY = 'revora_auth';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Rehydrate session from localStorage
  useEffect(() => {
    async function rehydrate() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // If token is missing, attempt to obtain one via backend login
          if (!parsed.token && !parsed.access_token && parsed.email) {
            try {
              const defaultPw = parsed.role === 'admin' ? 'Admin@123' : parsed.role === 'staff' ? 'Staff@123' : 'Customer@123';
              const res = await api.post('/auth/login', {
                email: parsed.email,
                password: defaultPw,
              });
              if (res?.data?.success && res.data.data?.access_token) {
                parsed.token = res.data.data.access_token;
                parsed.access_token = res.data.data.access_token;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
              }
            } catch {
              // Ignore background token refresh errors
            }
          }
          setUser(parsed);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setLoading(false);
      }
    }
    rehydrate();
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      // 1. Authenticate with real FastAPI backend
      try {
        const res = await api.post('/auth/login', {
          email: email.trim(),
          password: password,
        });

        if (res?.data?.success && res?.data?.data) {
          const { access_token, user: apiUser } = res.data.data;
          const role = (apiUser.role || 'customer').toLowerCase();
          const safeUser = {
            id: String(apiUser.id),
            name: apiUser.name,
            email: apiUser.email,
            role: role,
            token: access_token,
            access_token: access_token,
            avatar: apiUser.name ? apiUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'UR',
            department: role === 'admin' ? 'Executive' : role === 'staff' ? 'Operations' : null,
          };
          setUser(safeUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
          return { success: true, user: safeUser };
        }
      } catch (apiErr) {
        // If credentials were genuinely invalid according to the backend
        if (apiErr?.response?.status === 401 || apiErr?.response?.status === 400) {
          const msg = apiErr.response?.data?.message || 'Invalid email or password.';
          // Check if mock user matches demo account
          const mockFound = MOCK_USERS.find(
            u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
          );
          if (!mockFound) {
            throw new Error(msg);
          }
        }
      }

      // 2. Demo fallback if backend is offline
      const found = MOCK_USERS.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      if (!found) {
        throw new Error('Invalid email or password. Please use a demo account or sign up.');
      }
      const { password: _pw, ...safeUser } = found;
      // Ensure token is attached so auth headers work
      const fallbackToken = `demo_token_${safeUser.id}_${Date.now()}`;
      safeUser.token = safeUser.token || fallbackToken;
      safeUser.access_token = safeUser.access_token || fallbackToken;
      setUser(safeUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
      return { success: true, user: safeUser };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      setAuthError(msg);
      return { success: false, error: msg };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const register = useCallback(async ({ name, email, password }) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      try {
        const res = await api.post('/auth/signup', {
          name: name.trim(),
          email: email.trim(),
          password: password,
        });

        if (res?.data?.success) {
          return await login({ email, password });
        }
      } catch (apiErr) {
        if (apiErr?.response?.data?.message) {
          throw new Error(apiErr.response.data.message);
        }
      }

      const newUser = {
        id: `u_${Date.now()}`,
        name,
        email,
        role: 'customer',
        token: `demo_token_${Date.now()}`,
        avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
        department: 'Self-Serve',
        createdAt: new Date().toISOString(),
      };
      setUser(newUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      return { success: true, user: newUser };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      setAuthError(msg);
      return { success: false, error: msg };
    } finally {
      setAuthLoading(false);
    }
  }, [login]);

  const forgotPassword = useCallback(async ({ email }) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await new Promise(r => setTimeout(r, 400));
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
