import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('labx_token'));
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      setUser(res.data);
    } catch (err) {
      console.error('Auth verification failed:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    const { user: userData, access_token } = res.data;
    localStorage.setItem('labx_token', access_token);
    setToken(access_token);
    setUser(userData);
    return res.data;
  };

  const register = async (email, password, fullName) => {
    const res = await api.register({ email, password, full_name: fullName });
    const { user: userData, access_token } = res.data;
    if (access_token) {
      localStorage.setItem('labx_token', access_token);
      setToken(access_token);
    }
    setUser(userData);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('labx_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!user,
        isFounder: user?.role === 'founder',
        isAdmin: user?.role === 'admin',
        assessmentCompleted: user?.assessment_completed || user?.profile?.assessment_completed,
      }}
    >
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
