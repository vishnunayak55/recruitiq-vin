import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';

export interface User {
  id: string; email: string; name: string;
  plan: 'free' | 'pro' | 'premium';
  analyses_count: number; avatar?: string | null;
}

interface AuthContextType {
  user: User | null; loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    refreshUser().finally(() => setLoading(false));
  }, []);

  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      if (data.token) localStorage.setItem('token', data.token);
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch { logout(); }
  };

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const signup = async (email: string, name: string, password: string) => {
    const { data } = await api.post('/auth/signup', { email, name, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
