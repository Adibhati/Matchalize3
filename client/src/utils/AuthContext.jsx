import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { api, API_BASE } from './api';
import socket from './socket';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const USER_KEY = 'matchalize_user';

function loadInitialState() {
  try {
    const userRaw = localStorage.getItem(USER_KEY);
    if (userRaw) {
      // Same normalisation as `login` — see the comment there. A cached user
      // written before annual re-verification existed has no reverifyRequired
      // key, and "undefined" must not be read as "needs re-verifying".
      return { user: { reverifyRequired: false, ...JSON.parse(userRaw) } };
    }
  } catch {}
  return { user: null };
}

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState(loadInitialState());

  // Populated at app boot (main.jsx / App.jsx) so logout() can tear down
  // everything this user left behind without AuthProvider importing React Query
  // and creating a circular dependency.
  const queryClientRef = useRef(null);
  const registerQueryClient = useCallback((client) => {
    queryClientRef.current = client;
  }, []);

  const isAuthenticated = !!state.user;

  const login = useCallback((user) => {
    /* Default the annual re-check flag rather than leaving it undefined.
       A user persisted in localStorage before this field existed has no such
       property, so anything reading `user.reverifyRequired` would see
       undefined. Defaulting to false here means "not due" rather than "unknown",
       which is the safe direction: it can never misroute a legitimate returning
       user into a re-verify loop they can't pass. */
    const normalised = { reverifyRequired: false, ...user };
    localStorage.setItem(USER_KEY, JSON.stringify(normalised));
    setState({ user: normalised });
    if (socket?.disconnected) socket.connect();
  }, []);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== USER_KEY) return;

      let nextUser = null;
      if (event.newValue) {
        try {
          nextUser = { reverifyRequired: false, ...JSON.parse(event.newValue) };
        } catch {
          nextUser = null;
        }
      }

      if (String(state.user?._id || '') === String(nextUser?._id || '')) {
        if (nextUser) setState({ user: nextUser });
        if (nextUser && socket?.disconnected) socket.connect();
        return;
      }

      queryClientRef.current?.clear();
      socket?.disconnect();
      localStorage.removeItem('matchalize_suspended');
      setState({ user: nextUser });
      if (nextUser && socket?.disconnected) socket.connect();
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [state.user]);

  /**
   * 🔒 LOGOUT MUST ERASE EVERYTHING, NOT JUST THE ID CARD.
   *
   * This used to only clear localStorage and the auth cookie. The React Query
   * cache survived, and its keys carry no user scope — `['matches']` in
   * AppShell.jsx and Matches.jsx, `['unread-notifications-count']` in Header.jsx.
   * With a 30s–2min `staleTime`, whoever signed in next on a shared device was
   * served the PREVIOUS user's matches, messages and unread badge straight from
   * cache, with no network request and no server check. The socket also stayed
   * connected, so inbound chat and notification frames for the old account kept
   * arriving.
   *
   * Clearing here rather than at each call site also fixes Onboarding.jsx, which
   * called `logout()` bare with no socket teardown at all.
   */
  const logout = useCallback(() => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('matchalize_suspended');

    // Drop every cached response — matches, messages, profile, unread counts.
    queryClientRef.current?.clear();

    // Close the chat socket so no further frames for the old session land.
    try {
      socket?.disconnect();
    } catch {}

    setState({ user: null });

    // Clear httpOnly cookie server-side
    fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const fresh = await api.get('/auth/me');
      localStorage.setItem(USER_KEY, JSON.stringify(fresh));
      setState({ user: fresh });
      return fresh;
    } catch {
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user: state.user, isAuthenticated, login, logout, refreshUser, registerQueryClient }}
    >
      {children}
    </AuthContext.Provider>
  );
};