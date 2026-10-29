import React from 'react';
import { ChevronLeft } from 'lucide-react';
import neu from '../styles/neu';
import { toast } from '../utils/toast';

const t = neu;

// Change names, prices and perks here only.
const PLANS = [
  {
    id: 'free', name: 'Non-Chalant', tagline: 'Easy does it.',
    price: 'Free', per: '', bg: t.card, current: true,
    perks: ['7 aligns a day', 'Chat with your matches'],
    cta: 'Current plan',
  },
  {
    id: 'mid', name: 'Not So Chalant', tagline: 'Slightly interested.',
    price: '₹149', per: '/mo', bg: t.pink,
    perks: ['Unlimited aligns', 'See who aligned with you'],
    cta: 'Choose Not So Chalant',
  },
  {
    id: 'top', name: 'Chalant', tagline: 'Fully committed.',
    price: '₹299', per: '/mo', bg: t.yellow, badge: 'Most wanted',
    perks: ['Everything in Not So Chalant', 'Priority in the deck', 'Extra Roulette spins'],
    cta: 'Choose Chalant',
  },
];

const CSS = `
  .up-btn { transition: transform .08s steps(2), box-shadow .08s steps(2); cursor: pointer; }
  .up-btn:active { transform: translate(3px, 3px); box-shadow: 0 0 0 ${t.ink} !important; }
`;

const Upgrade = ({ onClose }) => {
  const handleChoose = (plan) => {
    // TODO: start the Razorpay checkout for plan.id here
    toast.success(`${plan.name} is coming soon`);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 600, backgroundColor: t.paper, display: 'flex', flexDirection: 'column' }}>
      <style>{CSS}</style>

      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 20px', paddingTop: 'max(14px, env(safe-area-inset-top, 0px))',
      }}>
        <button
          type="button" className="up-btn" onClick={onClose} aria-label="Back"
          style={{
            width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: t.card, border: `3px solid ${t.ink}`, borderRadius: 12,
            boxShadow: `3px 3px 0 ${t.ink}`, padding: 0,
          }}
        >
          <ChevronLeft size={22} strokeWidth={3} color={t.ink} />
        </button>
        <p style={{ margin: 0, fontFamily: t.fontMono, fontSize: 13, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: t.ink }}>
          Huh Plus
        </p>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '8px 20px calc(32px + env(safe-area-inset-bottom, 0px))' }}>
        <div style={{ maxWidth: 460, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
          <h1 style={{ margin: 0, fontFamily: t.fontHeavy, fontSize: 40, fontWeight: 400, lineHeight: 1.05, color: t.ink }}>
            How chalant are you?
          </h1>

          {PLANS.map((plan) => (
            <div key={plan.id} style={{
              position: 'relative', display: 'flex', flexDirection: 'column', gap: 14,
              padding: 20, backgroundColor: plan.bg, color: t.ink,
              border: `3px solid ${t.ink}`, borderRadius: 18, boxShadow: `6px 6px 0 ${t.ink}`,
            }}>
              {plan.badge && (
                <span style={{
                  position: 'absolute', top: -16, right: 14, padding: '4px 10px',
                  backgroundColor: t.coral, border: `3px solid ${t.ink}`, transform: 'rotate(4deg)',
                  fontFamily: t.fontMono, fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
                }}>
                  {plan.badge}
                </span>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
                <div>
                  <h2 style={{ margin: 0, fontFamily: t.fontHeavy, fontSize: 24, fontWeight: 400 }}>{plan.name}</h2>
                  <p style={{ margin: '4px 0 0', fontFamily: t.fontMono, fontSize: 13, color: t.ink2 }}>{plan.tagline}</p>
                </div>
                <p style={{ margin: 0, fontFamily: t.fontHeavy, fontSize: 28, whiteSpace: 'nowrap' }}>
                  {plan.price}
                  {plan.per && <span style={{ fontFamily: t.fontMono, fontSize: 13, fontWeight: 700 }}> {plan.per}</span>}
                </p>
              </div>

              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {plan.perks.map((perk) => (
                  <li key={perk} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: t.fontBody, fontSize: 15, fontWeight: 600 }}>
                    <span style={{ width: 10, height: 10, backgroundColor: t.ink, flexShrink: 0 }} />
                    {perk}
                  </li>
                ))}
              </ul>

              <button
                type="button" className="up-btn" disabled={plan.current}
                onClick={() => handleChoose(plan)}
                style={{
                  height: 48, border: `3px solid ${t.ink}`, borderRadius: 12,
                  backgroundColor: plan.current ? t.paper : t.ink,
                  color: plan.current ? t.ink : t.paper,
                  fontFamily: t.fontMono, fontSize: 14, fontWeight: 700,
                  letterSpacing: '.08em', textTransform: 'uppercase',
                  cursor: plan.current ? 'default' : 'pointer',
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}

          {/* change this line if you end up selling one-time passes instead */}
          <p style={{ margin: 0, textAlign: 'center', fontFamily: t.fontMono, fontSize: 12, color: t.ink2 }}>
            Renews monthly · Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
};

export default Upgrade;