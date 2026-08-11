import { toast } from './toast';

const apiHostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const API_PORT = import.meta.env.VITE_API_PORT || '5005';
const isLocalhost = apiHostname === 'localhost' || apiHostname === '127.0.0.1';
const isPrivateIP = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(apiHostname);
const isDev = isLocalhost || isPrivateIP;
export const API_BASE = import.meta.env.VITE_API_URL || (isDev ? `http://${apiHostname}:${API_PORT}` : window.location.origin);
const BASE_URL = `${API_BASE}/api`;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE;

const handleResponse = async (response) => {
  // 401 or 403 (suspended): Session expired or account suspended — redirect
  if (response.status === 401 || response.status === 403) {
    const errorData = await response.json().catch(() => ({}));
    localStorage.removeItem('matchalize_user');
    if (errorData.suspended) {
      // Save suspension data for the lock screen to pick up
      localStorage.setItem('matchalize_suspended', JSON.stringify({
        reason: errorData.reason || 'Account suspended',
        suspendedAt: new Date().toISOString(),
      }));
      toast.error('Your account has been suspended. Please contact support.');
    }
    if (typeof window !== 'undefined' && window.location.pathname !== '/auth') {
      window.location.href = '/auth';
    }
    throw new Error(errorData.message || 'Unauthorized');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data.message || 'Something went wrong';
    toast.error(errorMessage);
    throw new Error(errorMessage);
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

  upload: async (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    const res = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
};
