import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchMe, login as loginApi } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('ncmms_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(!!localStorage.getItem('ncmms_token'));

  useEffect(() => {
    const token = localStorage.getItem('ncmms_token');
    if (!token) {
      setLoading(false);
      return;
    }
    fetchMe()
      .then((u) => {
        setUser(u);
        localStorage.setItem('ncmms_user', JSON.stringify(u));
      })
      .catch(() => {
        localStorage.removeItem('ncmms_token');
        localStorage.removeItem('ncmms_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    const data = await loginApi(credentials);
    localStorage.setItem('ncmms_token', data.token);
    localStorage.setItem('ncmms_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('ncmms_token');
    localStorage.removeItem('ncmms_user');
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, login, logout, isAuthenticated: !!user }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
