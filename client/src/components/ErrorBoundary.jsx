import React from 'react';
import * as Sentry from '@sentry/react';
import { theme as design } from '../utils/theme';
import { FileWarning, RotateCw } from 'lucide-react';

/* ==================================================================
   ARCHIVAL THEME SYSTEM (Localized for crash resilience)
================================================================== */
const theme = {
  paper: '#fdfbf7',
  surfaceAlt: '#f4f1ea',
  borderDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  crimson: '#8b1a1a',
  shadowWarm: 'rgba(139, 69, 19, 0.12)',
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Matchalize UI Error:', error, errorInfo);
    try {
      Sentry.captureException(error, { extra: errorInfo });
    } catch {
      // Sentry not initialized (no DSN) — safe to ignore
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100dvh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px',
          backgroundColor: theme.paper,
          position: 'relative',
          overflow: 'hidden',
          contain: 'strict',
        }}>
          {/* GPU Promoted Zero-Lag Animations & Tactile Physics */}
          <style>{`
            @keyframes errorFadeUp {
              from { opacity: 0; transform: translate3d(0, 16px, 0); filter: blur(4px); }
              to   { opacity: 1; transform: translate3d(0, 0, 0); filter: blur(0px); }
            }
            .error-anim {
              animation: errorFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              will-change: transform, opacity;
            }
            .tactile-btn {
              transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s ease;
              will-change: transform;
            }
            @media (hover: hover) {
              .tactile-btn:hover {
                transform: translate3d(0, -2px, 0) scale3d(1.02, 1.02, 1);
                box-shadow: 0 8px 24px rgba(139, 26, 26, 0.3);
              }
            }
            .tactile-btn:active {
              transform: scale3d(0.96, 0.96, 1) translate3d(0, 0, 0) !important;
              transition: transform 0.08s cubic-bezier(0, 0, 0.2, 1) !important;
              box-shadow: 0 2px 8px rgba(139, 26, 26, 0.15) !important;
            }
            @media (prefers-reduced-motion: reduce) {
              .error-anim { animation: none !important; opacity: 1 !important; transform: none !important; }
              .tactile-btn { transition: none !important; transform: none !important; }
            }
          `}</style>

          {/* Cinematic Film Grain Overlay */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url("${design?.texture?.grain || ''}")`,
              mixBlendMode: 'multiply',
              opacity: 0.85,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />

          <div className="error-anim" style={{ 
            position: 'relative', 
            zIndex: 2, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: '400px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              backgroundColor: 'rgba(139, 26, 26, 0.08)',
              border: `1.5px dashed ${theme.crimson}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px'
            }}>
              <FileWarning size={32} color={theme.crimson} strokeWidth={1.5} />
            </div>

            <h1 style={{ 
              fontFamily: design?.font?.display || "'Playfair Display', serif", 
              fontSize: '32px', 
              fontWeight: 800,
              color: theme.ink, 
              marginBottom: '12px',
              letterSpacing: '-0.02em',
              lineHeight: 1.1
            }}>
              Ink Spilled
            </h1>
            
            <p style={{ 
              fontFamily: design?.font?.body || "'Inter', sans-serif",
              fontSize: '15px', 
              color: theme.inkMuted, 
              marginBottom: '32px', 
              lineHeight: 1.6 
            }}>
              The archival ledger encountered an unexpected tear. 
              Please refresh the page to restore your correspondence session.
            </p>
            
            <button
              className="tactile-btn"
              onClick={() => {
                if (window.navigator && window.navigator.vibrate) {
                  window.navigator.vibrate(50);
                }
                window.location.reload();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 24px',
                backgroundColor: theme.crimson,
                color: '#ffffff',
                border: 'none',
                borderRadius: design?.radius?.md || '12px',
                fontFamily: design?.font?.body || "'Inter', sans-serif",
                fontSize: '13px',
                fontWeight: 800,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(139, 26, 26, 0.25)'
              }}
            >
              <RotateCw size={16} strokeWidth={2.5} />
              Restore Ledger
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;