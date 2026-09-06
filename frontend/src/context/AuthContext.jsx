import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/endpoints';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('coop_token');
      if (token) {
        try {
          const res = await authAPI.getMe();
          if (res.success && res.data.user) {
            setUser(res.data.user);
          } else {
            logout();
          }
        } catch (err) {
          console.error('Failed to load authenticated user:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    if (res.success && res.data) {
      localStorage.setItem('coop_token', res.data.token);
      localStorage.setItem('coop_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (formData) => {
    const res = await authAPI.register(formData);
    if (res.success && res.data) {
      localStorage.setItem('coop_token', res.data.token);
      localStorage.setItem('coop_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const refreshUser = async () => {
    try {
      const res = await authAPI.getMe();
      if (res.success && res.data.user) {
        setUser(res.data.user);
      }
    } catch (err) {
      console.error('Error refreshing user details:', err);
    }
  };

  const logout = () => {
    localStorage.removeItem('coop_token');
    localStorage.removeItem('coop_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
