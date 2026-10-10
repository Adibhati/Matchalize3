import React from 'react';
import * as Sentry from '@sentry/react';
import { FileWarning, RotateCw } from 'lucide-react';
import neu from '../styles/neu';

/* The shared neo-brutalist canon (src/styles/neu.js) */
const t = neu;

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
            .eb-slam { display: inline-flex; align-items: center; gap: 8px;
              padding: 14px 26px; background: ${t.yellow}; color: ${t.ink};
              border: 2px solid ${t.ink}; border-radius: 12px; box-shadow: 4px 4px 0 ${t.ink};
              font-family: ${t.fontMono}; font-size: 12px; font-weight: 700;
              letter-spacing: .12em; text-transform: uppercase; cursor: pointer;
              transition: transform .08s steps(2), box-shadow .08s steps(2);
              -webkit-tap-highlight-color: transparent; }
            .eb-slam:active { transform: translate(4px, 4px); box-shadow: 0 0 0 ${t.ink}; }
            @media (hover: hover) and (pointer: fine) {
              .eb-slam:hover:not(:active) { transform: translate(-1px, -1px); box-shadow: 5px 5px 0 ${t.ink}; }
            }
            @media (prefers-reduced-motion: reduce) {
              .error-anim { animation: none !important; opacity: 1 !important; transform: none !important; }
              .eb-slam { transition: none !important; }
            }
          `}</style>

          {/* The floating candy card */}
          <div
            className="error-anim"
            style={{
              position: 'relative',
              zIndex: 2,
              maxWidth: 380,
              width: '100%',
              backgroundColor: t.paper,
              border: `2px solid ${t.ink}`,
              borderRadius: 20,
              boxShadow: `8px 8px 0 ${t.ink}`,
              padding: '32px 24px 28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
          >
            {/* Icon tile — coral, same DNA as the deck error state */}
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: t.coral,
              border: `2px solid ${t.ink}`,
              boxShadow: `4px 4px 0 ${t.ink}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}>
              <FileWarning size={24} color={t.ink} strokeWidth={2.4} />
            </div>

            <h1 style={{
              fontFamily: t.fontHeavy,
              fontSize: 24,
              fontWeight: 400,
              color: t.ink,
              margin: 0,
              letterSpacing: '-.01em',
              lineHeight: 1.1,
              textTransform: 'uppercase',
            }}>
              Ink Spilled
            </h1>

            <p style={{
              fontFamily: t.fontBody,
              fontSize: 14,
              fontWeight: 500,
              color: t.ink2,
              margin: '12px 0 0 0',
              lineHeight: 1.6,
            }}>
              Something broke on our end. Refresh to get back in.
            </p>

            {/* Error note — bordered mono strip */}
            {this.state.error?.message && (
              <div style={{
                width: '100%',
                marginTop: 18,
                border: `2px solid ${t.ink}`,
                borderRadius: 10,
                backgroundColor: t.card,
                padding: '10px 12px',
                boxSizing: 'border-box',
              }}>
                <p style={{
                  fontFamily: t.fontMono,
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: t.ink3,
                  margin: 0,
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                  textAlign: 'left',
                }}>
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* The one yellow moment — slam CTA */}
            <button
              className="eb-slam"
              onClick={() => {
                if (window.navigator && window.navigator.vibrate) {
                  window.navigator.vibrate(50);
                }
                window.location.reload();
              }}
            >
              <RotateCw size={14} strokeWidth={2.8} />
              Refresh
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;