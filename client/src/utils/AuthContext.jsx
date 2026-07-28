import React, { createContext, useContext, useState, useCallback } from 'react';
import { API_BASE } from './api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const USER_KEY = 'matchalize_user';

function loadInitialState() {
  try {
    const userRaw = localStorage.getItem(USER_KEY);
    if (userRaw) {
      return { user: JSON.parse(userRaw) };
    }
  } catch {}
  return { user: null };
}

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState(loadInitialState());

  const isAuthenticated = !!state.user;

  const login = useCallback((user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setState({ user });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(USER_KEY);
    setState({ user: null });
    // Clear httpOnly cookie server-side
    fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{ user: state.user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
