import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from './api';
import { theme as design } from './theme';

const AppConfigContext = createContext(null);

export const useAppConfig = () => useContext(AppConfigContext);

export const AppConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await api.get('/config');
        setConfig(data);
      } catch (err) {
        console.error('Failed to load app config:', err);
        setError(err.message);
      } finally {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        setLoading(false);
      }
    };
    
    fetchConfig();
    
    // Timeout after 10 seconds
    timeoutRef.current = setTimeout(() => {
      if (loading) {
        setError('Config load timed out');
        setLoading(false);
      }
    }, 10000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!config && loading) {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#000', color: '#fff',
        fontFamily: 'Geist, sans-serif', fontSize: '14px',
      }}>
        Loading...
      </div>
    );
  }

  if (!config && error) {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '16px',
        background: '#000', color: '#fff',
        fontFamily: 'Geist, sans-serif', fontSize: '14px',
        padding: '24px', textAlign: 'center',
      }}>
        <span>Failed to load application config.</span>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 24px', borderRadius: design.radius.md,
            border: '1px solid rgba(249,115,22,0.3)',
            background: 'rgba(249,115,22,0.1)',
            color: '#f97316', cursor: 'pointer',
            fontWeight: '600', fontFamily: 'Geist, sans-serif',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <AppConfigContext.Provider value={config}>
      {children}
    </AppConfigContext.Provider>
  );
};
