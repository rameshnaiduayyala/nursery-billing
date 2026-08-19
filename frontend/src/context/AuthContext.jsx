import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('nursery_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('nursery_token');
    if (token) {
      authService.getMe()
        .then((res) => {
          if (res.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('nursery_user', JSON.stringify(res.data.user));
          }
        })
        .catch(() => {
          // Keep existing local user state or clean up if token invalid
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    if (res.success) {
      const { token, user: userData } = res.data;
      localStorage.setItem('nursery_token', token);
      localStorage.setItem('nursery_user', JSON.stringify(userData));
      setUser(userData);
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      // Ignore network logout errors
    } finally {
      localStorage.removeItem('nursery_token');
      localStorage.removeItem('nursery_user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
