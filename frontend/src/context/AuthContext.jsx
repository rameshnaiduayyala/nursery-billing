import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import authService from '../services/authService';
import { setApiToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('nursery_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('nursery_token');
    if (token) {
      authService.getMe()
        .then((res) => {
          if (res.success && res.data.user) {
            const u = res.data.user;
            setUser(u);
            localStorage.setItem('nursery_user', JSON.stringify(u));
          }
        })
        .catch(() => {
          // Token invalid — clear stale data
          localStorage.removeItem('nursery_token');
          localStorage.removeItem('nursery_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authService.login({ email, password });
    if (res.success) {
      const { token, user: userData } = res.data;
      localStorage.setItem('nursery_token', token);
      localStorage.setItem('nursery_user', JSON.stringify(userData));
      setApiToken(token); // sync in-memory cache
      setUser(userData);
      return res;
    }
    throw new Error(res.message || 'Login failed');
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('nursery_token');
      localStorage.removeItem('nursery_user');
      setApiToken(null); // clear in-memory cache
      setUser(null);
    }
  }, []);

  // ── Derived role values — memoized so they don't recreate on every render ──
  const authValue = useMemo(() => {
    const role     = (user?.role || 'VIEWER').toUpperCase();
    const isAdmin  = role === 'ADMIN';
    const isManager = role === 'MANAGER' || role === 'ADMIN';
    const isViewer  = role === 'VIEWER';
    return {
      user,
      login,
      logout,
      loading,
      role,
      isAdmin,
      isManager,
      isViewer,
      canCreate: isAdmin || isManager,
      canEdit:   isAdmin || isManager,
      canDelete: isAdmin,
    };
  }, [user, loading, login, logout]);

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
