import { toast } from './toast';

const apiHostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const API_PORT = import.meta.env.VITE_API_PORT || '5005';
const isLocalhost = apiHostname === 'localhost' || apiHostname === '127.0.0.1';
const isPrivateIP = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(apiHostname);
const isDev = isLocalhost || isPrivateIP;

export const API_BASE = import.meta.env.VITE_API_URL || (isDev ? `http://${apiHostname}:${API_PORT}` : window.location.origin);
const BASE_URL = `${API_BASE}/api`;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE;

const fail = (message, extra) => {
  const e = new Error(message);
  e.toasted = true;
  if (extra) Object.assign(e, extra);
  return e;
};

const handleResponse = async (response) => {
  if (response.status === 401) {
    const errorData = await response.json().catch(() => ({}));
    localStorage.removeItem('matchalize_user');
    if (typeof window !== 'undefined' && window.location.pathname !== '/auth') {
      window.location.href = '/auth';
    }
    throw fail(errorData.message || 'Session expired. Please log in again.');
  }

  if (response.status === 403) {
    const errorData = await response.json().catch(() => ({}));

    if (errorData.suspended) {
      // No toast here (G1): the hard navigation to /auth tears React down, so a
      // toast could never survive it. Auth.jsx reads `matchalize_suspended` and
      // swaps to the full-screen AccountSuspendedScreen, which does the job.
      localStorage.removeItem('matchalize_user');
      localStorage.setItem('matchalize_suspended', JSON.stringify({
        reason: errorData.reason || 'Account suspended',
        suspendedAt: new Date().toISOString(),
      }));
      if (typeof window !== 'undefined' && window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
      throw fail(errorData.message || 'Account suspended');
    }

    if (errorData.deleted) {
      localStorage.removeItem('matchalize_user');
      if (typeof window !== 'undefined' && window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
      throw fail(errorData.message || 'Account deleted');
    }

    // Deck/profile gate. Never toasted centrally: the call site owns the copy
    // (G10/G11) and needs `code` to know it may replay the action once the gate
    // resolves. Previously this threw with no `code`, so Discover's recovery
    // branch (which read `err.response.data.code`) never matched and the action
    // failed silently.
    if (errorData.code === 'GATED') {
      throw fail(errorData.message || 'Action not allowed.', { code: 'GATED' });
    }

    // Directional block (G2c): you blocked them — state the rule and offer a way
    // out. The server sends the blocked user's id so the Unblock button can act.
    if (errorData.code === 'YOU_BLOCKED') {
      const message = errorData.message || "You can't message someone you've blocked.";
      toast.error(message, {
        label: 'Unblock',
        onClick: () => api.delete(`/report/block/${errorData.blockedUserId}`).catch(() => {}),
      }, { icon: 'Ban' });
      throw fail(message, { code: 'YOU_BLOCKED', blockedUserId: errorData.blockedUserId });
    }

    // Their chat/alignment is gone (G2b). Reveal nothing if they blocked you
    // (G2d reuses this same code so a blockeé can't confirm a block).
    if (errorData.code === 'CONVERSATION_GONE') {
      const message = errorData.message || 'This conversation is no longer available.';
      toast.error(message, undefined, { icon: 'MessageSquareOff' });
      throw fail(message, { code: 'CONVERSATION_GONE' });
    }

    const message = errorData.message || 'Something went wrong. Please try again.';
    toast.error(message);
    throw fail(message);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    let errorMessage = data.message || 'Something went wrong. Please try again.';
    let icon = undefined;

    if (response.status >= 500) {
      errorMessage = 'Our side had a problem. Try again in a moment.';
      icon = 'Server';
    }

    toast.error(errorMessage, undefined, { icon });
    throw fail(errorMessage, { code: data.code });
  }
  return data;
};

export const api = {
  get: async (path) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      credentials: 'include',
    });
    return handleResponse(res);
  },
  post: async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  put: async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  delete: async (path) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return handleResponse(res);
  },
  upload: async (file, { signal } = {}) => {
    const formData = new FormData();
    formData.append('photo', file);
    const res = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
      signal,
    });
    return handleResponse(res);
  },
};