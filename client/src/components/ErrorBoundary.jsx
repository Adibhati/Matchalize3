import React from 'react';
import * as Sentry from '@sentry/react';
import { theme as design } from '../utils/theme';
import { FileWarning, RotateCw } from 'lucide-react';

/* Locked tokens — same family as ProfileCard */
const t = {
  desk: '#ece4d4',
  paper: '#fdfbf7',
  surfaceAlt: '#f4f1ea',
  lineDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkSoft: '#4a4a4a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  fontDisplay: design?.font?.heading || design?.font?.display || "'Playfair Display', Georgia, serif",
  fontBody: design?.font?.body || "'Inter', -apple-system, sans-serif",
  fontType: "'Special Elite', 'Courier New', monospace",
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
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          backgroundColor: t.desk,
          boxSizing: 'border-box',
        }}>
          <style>{`
            @keyframes errorFadeUp {
              from { opacity: 0; transform: translate3d(0, 16px, 0); }
              to   { opacity: 1; transform: translate3d(0, 0, 0); }
            }
            .error-anim {
              animation: errorFadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
              will-change: transform, opacity;
            }
            .tactile-btn { transition: transform 0.15s ease-out; will-change: transform; }
            .tactile-btn:active { transform: scale(0.96) !important; }
            @media (prefers-reduced-motion: reduce) {
              .error-anim { animation: none !important; opacity: 1 !important; transform: none !important; }
              .tactile-btn { transition: none !important; transform: none !important; }
            }
          `}</style>

          {/* Grain film — same strength as every other surface */}
          <div
            aria-hidden="true"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundImage: `url("${design?.texture?.grain || ''}")`,
              mixBlendMode: 'multiply',
              opacity: 0.3,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />

          {/* The floating paper panel */}
          <div
            className="error-anim"
            style={{
              position: 'relative',
              zIndex: 2,
              maxWidth: 380,
              width: '100%',
              backgroundColor: t.paper,
              border: '1px solid rgba(212,197,169,0.7)',
              borderRadius: 18,
              boxShadow: '0 14px 34px rgba(88,63,30,0.16), 0 3px 8px rgba(88,63,30,0.08)',
              padding: '32px 28px 28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
          >
            {/* Icon in the standard 12px-radius tile */}
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: t.surfaceAlt,
              border: '1px solid rgba(212,197,169,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}>
              <FileWarning size={18} color={t.accent} strokeWidth={2} />
            </div>

            <h1 style={{
              fontFamily: t.fontDisplay,
              fontSize: 30,
              fontWeight: 800,
              color: t.ink,
              margin: 0,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}>
              Ink Spilled
            </h1>

            <p style={{
              fontFamily: t.fontBody,
              fontSize: 14,
              color: t.inkSoft,
              margin: '12px 0 0 0',
              lineHeight: 1.6,
            }}>
              Something tore in the archive. Refresh to restore your session.
            </p>

            {/* Findings-style error note — typewriter, hairline box */}
            {this.state.error?.message && (
              <div style={{
                width: '100%',
                marginTop: 18,
                border: '1px solid rgba(139,69,19,0.3)',
                borderRadius: 6,
                backgroundColor: 'rgba(139,69,19,0.03)',
                padding: '10px 12px',
                boxSizing: 'border-box',
              }}>
                <p style={{
                  fontFamily: t.fontType,
                  fontSize: 11.5,
                  color: t.inkMuted,
                  margin: 0,
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                }}>
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* The one crimson moment — pill CTA */}
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
                gap: 8,
                marginTop: 24,
                padding: '14px 26px',
                backgroundColor: t.crimson,
                color: '#ffffff',
                border: 'none',
                borderRadius: 999,
                fontFamily: t.fontBody,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '1.8px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(139,26,26,0.28)',
              }}
            >
              <RotateCw size={14} strokeWidth={2.5} />
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