import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { api, API_BASE } from '../utils/api';
import { theme as design } from '../utils/theme';
import { Feather, KeyRound } from 'lucide-react';

// Sunlit Library token set — same family as Auth/ProfileCard
const t = {
  desk: '#ece4d4',
  paper: '#fdfbf7',
  card: '#fffdf8',
  surfaceAlt: '#f4f1ea',
  lineDark: '#d4c5a9',
  line: '#e0d8c8',
  ink: '#1a1a1a',
  inkSoft: '#4a4a4a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  accentSoft: 'rgba(139, 69, 19, 0.18)',
  accentFaint: 'rgba(139, 69, 19, 0.05)',
  crimson: '#8b1a1a',
  success: '#2e7d32',
  fontDisplay: design?.font?.heading || "'Playfair Display', Georgia, serif",
  fontBody: design?.font?.body || "'Inter', -apple-system, sans-serif",
  fontType: "'Special Elite', 'Courier New', monospace",
  grain: design?.texture?.grain || '',
};

// Single source of truth for tier thresholds (mirrored in backend)
const TIER_THRESHOLDS = { charter: 50, founding: 250 };

// FIXED: Match the server's hardcoded constant exactly
const FALLBACK_LAUNCH_DATE = new Date('2026-10-02T00:00:00Z');

const tierName = (position) => {
  if (position <= TIER_THRESHOLDS.charter) return 'Charter';
  if (position <= TIER_THRESHOLDS.founding) return 'Founding';
  return 'Original';
};

const useCountdown = (target) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return {
    daysS: String(days).padStart(2, '0'),
    hoursS: String(hours).padStart(2, '0'),
    minutesS: String(minutes).padStart(2, '0'),
    secondsS: String(seconds).padStart(2, '0'),
  };
};

const TimeBox = ({ value, label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div
      style={{
        width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 16, border: `1px solid ${t.line}`, backgroundColor: t.card,
        fontFamily: t.fontType, fontSize: 26, fontWeight: 700, color: t.accent,
        boxShadow: '0 2px 6px rgba(139,69,19,0.06)',
      }}
    >
      {value}
    </div>
    <span style={{ marginTop: 6, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: t.inkMuted, fontFamily: t.fontBody, fontWeight: 500 }}>
      {label}
    </span>
  </div>
);

const Stat = ({ value, label, accent }) => (
  <div
    style={{
      borderRadius: 14, border: `1px solid ${t.line}`, backgroundColor: t.card, padding: 14,
      boxShadow: '0 2px 6px rgba(139,69,19,0.05)',
    }}
  >
    <div style={{ fontFamily: t.fontType, fontSize: 24, fontWeight: 700, color: accent || t.ink }}>
      {value}
    </div>
    <div style={{ marginTop: 2, fontSize: 11, color: t.inkMuted, fontFamily: t.fontBody }}>{label}</div>
  </div>
);

const Panel = ({ children, style = {} }) => (
  <div
    style={{
      borderRadius: 16, border: `1px solid ${t.line}`, backgroundColor: t.card, padding: 20,
      boxShadow: '0 2px 8px rgba(139,69,19,0.05)', ...style,
    }}
  >
    {children}
  </div>
);

export default function Waitlist() {
  const [step, setStep] = useState('landing');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [myData, setMyData] = useState(null);
  const [recentToasts, setRecentToasts] = useState([]);

  const confettiFired = useRef(false);
  const toastTimersRef = useRef([]);

  // FIXED: stable launch date — countdown never resets on refetch
  const launchDate = useMemo(
    () => (stats?.launchDate ? new Date(stats.launchDate) : FALLBACK_LAUNCH_DATE),
    [stats?.launchDate]
  );
  const countdown = useCountdown(launchDate);

  const fetchStats = useCallback(async () => {
    try {
      setStats(await api.get('/waitlist/stats'));
    } catch {
      // keep last stats
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, 15000);
    return () => {
      clearInterval(id);
      toastTimersRef.current.forEach(clearTimeout);
      toastTimersRef.current = [];
    };
  }, [fetchStats]);

  // FIXED: Real joins instead of fabricated names — matches ethical framework
  useEffect(() => {
    if (step !== 'success' || !stats?.recentJoins?.length) return;

    const formatJoin = (join) => {
      if (!join.name || join.name === 'An IITian') return 'An IITian just joined';
      const firstName = join.name.split(' ')[0];
      const yearMatch = join.year?.match(/Freshies|Sophies|Thirdies|Fourthies/);
      const yearMap = { Freshies: '28', Sophies: '27', Thirdies: '26', Fourthies: '25' };
      const yearSuffix = yearMatch ? yearMap[yearMatch[0]] || '27' : '27';
      const branchShort = join.branch ? join.branch.split(' ')[0] : 'IITB';
      return `${firstName} from ${branchShort} '${yearSuffix} just joined`;
    };

    const interval = setInterval(() => {
      const join = stats.recentJoins[Math.floor(Math.random() * stats.recentJoins.length)];
      const id = Date.now() + Math.random();
      setRecentToasts(prev => [{ id, name: formatJoin(join) }, ...prev].slice(0, 3));
      const timer = setTimeout(() => {
        setRecentToasts(prev => prev.filter(toast => toast.id !== id));
      }, 4000);
      toastTimersRef.current.push(timer);
    }, 8000 + Math.random() * 5000);

    return () => {
      clearInterval(interval);
      toastTimersRef.current.forEach(clearTimeout);
      toastTimersRef.current = [];
    };
  }, [step, stats]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const normalized = email.trim().toLowerCase().replace(/\s+/g, '');
    setEmail(normalized);
    if (!normalized || !/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(normalized)) {
      setError('Please enter a valid email.');
      return;
    }
    if (!normalized.endsWith('@iitb.ac.in')) {
      setError('Currently only @iitb.ac.in emails are accepted.');
      return;
    }
    setLoading(true);
    try {
      // Raw fetch so the 409 resume body and error status are preserved
      const res = await fetch(`${API_BASE}/api/waitlist/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: normalized,
          name: name.trim(),
          referralCode: referralCode.trim().toUpperCase(),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 409) {
        confettiFired.current = true;
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 }, colors: ['#8b4513', '#d4c5a9', '#8b1a1a', '#fdfbf7'] });
        setMyData(data);
        setStep('success');
        return;
      }
      if (!res.ok) {
        setError(data.message || 'Something went wrong. Please try again.');
        return;
      }

      if (!confettiFired.current) {
        confettiFired.current = true;
        confetti({ particleCount: 160, spread: 100, origin: { y: 0.6 }, colors: ['#8b4513', '#d4c5a9', '#8b1a1a', '#fdfbf7'] });
      }
      setMyData(data);
      setStep('success');
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const pct = stats ? Math.round((stats.total / 250) * 100) : 0;

  return (
    <div
      style={{
        minHeight: '100dvh', backgroundColor: t.desk, color: t.ink,
        fontFamily: t.fontBody, position: 'relative', overflowX: 'hidden',
        backgroundImage: `radial-gradient(ellipse at top, rgba(139,69,19,0.06), transparent 60%), ${t.grain}`,
      }}
    >
      <style>{`
        @keyframes wlToast { from { opacity: 0; transform: translate3d(0, -12px, 0); } to { opacity: 1; transform: translate3d(0, 0, 0); } }
        .wl-toast { animation: wlToast 0.3s ease-out both; }
        @keyframes wlFadeUp { from { opacity: 0; transform: translate3d(0, 18px, 0); } to { opacity: 1; transform: translate3d(0, 0, 0); } }
        .wl-fade-up { animation: wlFadeUp 0.55s cubic-bezier(0.2, 0.8, 0.3, 1) both; }
      `}</style>

      {/* Recent join toasts — real data from stats.recentJoins */}
      <div style={{ position: 'fixed', top: 96, left: 16, zIndex: 50, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
        {recentToasts.map(toast => (
          <div
            key={toast.id}
            className="wl-toast"
            style={{
              borderRadius: 12, border: `1px solid ${t.line}`, backgroundColor: 'rgba(253,251,247,0.94)',
              padding: '10px 14px', fontSize: 12.5, color: t.inkSoft, boxShadow: '0 6px 18px rgba(26,26,26,0.12)',
              fontFamily: t.fontBody, maxWidth: 260,
            }}
          >
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 99, backgroundColor: t.crimson, marginRight: 8, verticalAlign: 'middle' }} />
            {toast.name}
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '28px 20px 64px', position: 'relative' }}>
        {/* Masthead */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32, height: 32, borderRadius: 10, backgroundColor: t.accent, color: t.paper,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 17, boxShadow: '0 3px 8px rgba(139,69,19,0.3)',
              }}
            >
              M
            </div>
            <span style={{ fontFamily: t.fontDisplay, fontWeight: 700, fontSize: 17, letterSpacing: '0.01em' }}>
              Matchalize
            </span>
          </div>
          <span
            style={{
              border: `1px solid ${t.lineDark}`, borderRadius: 999, padding: '5px 12px',
              fontFamily: t.fontType, fontSize: 10.5, letterSpacing: '0.22em', color: t.accent,
              backgroundColor: 'rgba(253,251,247,0.6)', textTransform: 'uppercase',
            }}
          >
            Founding Cohort
          </span>
        </div>

        <AnimatePresence mode="wait">
          {step === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
            >
              {/* Live badge */}
              <div
                className="wl-fade-up"
                style={{
                  marginTop: 40, display: 'inline-flex', alignItems: 'center', gap: 8,
                  border: `1px solid ${t.line}`, borderRadius: 999, padding: '6px 14px',
                  backgroundColor: 'rgba(253,251,247,0.7)', fontSize: 12, color: t.inkSoft, fontFamily: t.fontBody,
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: 99, backgroundColor: t.accent, animation: 'wlPulse 1.6s ease-in-out infinite' }} />
                {stats ? `${stats.last24h} joined in the last 24h` : 'Join the waitlist'}
              </div>
              <style>{`@keyframes wlPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }`}</style>

              {/* Hero */}
              <h1
                className="wl-fade-up"
                style={{
                  marginTop: 22, fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 38, lineHeight: 1.12,
                  letterSpacing: '-0.01em', color: t.ink,
                }}
              >
                The founders of the{' '}
                <em style={{ color: t.accent, fontStyle: 'italic' }}>campus dating economy</em>{' '}
                at IIT Bombay.
              </h1>
              <p className="wl-fade-up" style={{ marginTop: 14, maxWidth: 460, fontSize: 14.5, lineHeight: 1.65, color: t.inkSoft }}>
                The <strong style={{ color: t.ink }}>Charter Cohort</strong> gets first access, an exclusive badge, and a direct line to product decisions.
              </p>

              {/* Tier tiles */}
              <div className="wl-fade-up" style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <Stat value="50" label="Charter spots" accent={t.accent} />
                <Stat value="250" label="Founding seats" accent={t.accent} />
                <Stat value="0" label="Public" accent={t.inkMuted} />
              </div>

              {/* Founding progress */}
              <div className="wl-fade-up" style={{ marginTop: 16 }}>
                <Panel>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 12.5, color: t.inkSoft, fontFamily: t.fontBody }}>
                    <span>{stats ? `${stats.total} founding members` : 'Loading…'}</span>
                    <span style={{ fontFamily: t.fontType, fontWeight: 700, color: t.accent }}>{pct}%</span>
                  </div>
                  <div style={{ marginTop: 10, height: 8, borderRadius: 999, backgroundColor: t.desk, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%', borderRadius: 999,
                        background: `linear-gradient(90deg, ${t.accent}, #a05a1c)`,
                        width: `${pct}%`, transition: 'width 1s ease',
                      }}
                    />
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: t.inkMuted }}>
                    <span>Founding Cohort fills at 250</span>
                    <span>{stats ? 250 - stats.total : '—'} left</span>
                  </div>
                </Panel>
              </div>

              {/* Perks */}
              <div className="wl-fade-up" style={{ marginTop: 28 }}>
                <h2 style={{ fontFamily: t.fontDisplay, fontWeight: 700, fontSize: 17, color: t.ink }}>Your spot could be worth it</h2>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, color: t.inkSoft }}>Referral Jump</span>
                    <span style={{ fontSize: 14, fontFamily: t.fontType, color: t.accent, fontWeight: 700 }}>+2 to +15 spots</span>
                  </div>
                  <div style={{ height: 1, backgroundColor: t.line }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, color: t.inkSoft }}>Top 50</span>
                    <span style={{ fontSize: 14, fontFamily: t.fontType, color: t.accent, fontWeight: 700 }}>Charter badge</span>
                  </div>
                  <div style={{ height: 1, backgroundColor: t.line }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, color: t.inkSoft }}>Every 3-day check-in streak</span>
                    <span style={{ fontSize: 14, fontFamily: t.fontType, color: t.accent, fontWeight: 700 }}>+2 spots</span>
                  </div>
                </div>
              </div>

              {/* Join form */}
              <form className="wl-fade-up" onSubmit={handleSubmit} style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {error && (
                  <div
                    style={{
                      borderRadius: 12, border: `1px solid rgba(139,26,26,0.35)`, backgroundColor: 'rgba(139,26,26,0.06)',
                      padding: '10px 14px', fontSize: 13, color: t.crimson,
                    }}
                  >
                    {error}
                  </div>
                )}
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  maxLength={60}
                  style={{
                    borderRadius: 12, border: `1px solid ${t.line}`, backgroundColor: t.paper, padding: '13px 15px',
                    fontSize: 14, color: t.ink, outline: 'none', fontFamily: t.fontBody,
                    boxShadow: 'inset 0 1px 2px rgba(26,26,26,0.04)',
                  }}
                  onFocus={e => Object.assign(e.target.style, { borderColor: t.accent, boxShadow: `0 0 0 3px ${t.accentSoft}` })}
                  onBlur={e => Object.assign(e.target.style, { borderColor: t.line, boxShadow: 'inset 0 1px 2px rgba(26,26,26,0.04)' })}
                />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@iitb.ac.in"
                  autoFocus
                  style={{
                    borderRadius: 12, border: `1px solid ${t.line}`, backgroundColor: t.paper, padding: '13px 15px',
                    fontSize: 14, color: t.ink, outline: 'none', fontFamily: t.fontBody,
                    boxShadow: 'inset 0 1px 2px rgba(26,26,26,0.04)',
                  }}
                  onFocus={e => Object.assign(e.target.style, { borderColor: t.accent, boxShadow: `0 0 0 3px ${t.accentSoft}` })}
                  onBlur={e => Object.assign(e.target.style, { borderColor: t.line, boxShadow: 'inset 0 1px 2px rgba(26,26,26,0.04)' })}
                />
                <div>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={e => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="Referral code (optional — +2 to +15 spots)"
                    maxLength={6}
                    style={{
                      borderRadius: 12, border: `1px solid ${t.line}`, backgroundColor: t.paper, padding: '13px 15px',
                      width: '100%', fontSize: 14, color: t.ink, outline: 'none', fontFamily: t.fontType,
                      letterSpacing: '0.15em', boxShadow: 'inset 0 1px 2px rgba(26,26,26,0.04)',
                    }}
                    onFocus={e => Object.assign(e.target.style, { borderColor: t.accent, boxShadow: `0 0 0 3px ${t.accentSoft}` })}
                    onBlur={e => Object.assign(e.target.style, { borderColor: t.line, boxShadow: 'inset 0 1px 2px rgba(26,26,26,0.04)' })}
                  />
                  <p style={{ marginTop: 6, paddingLeft: 2, fontSize: 11, color: t.inkMuted }}>
                    Hint: find a friend already in — you'll both move up.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    borderRadius: 12, backgroundColor: t.accent, color: t.paper, padding: '14px 15px',
                    fontSize: 14.5, fontWeight: 600, fontFamily: t.fontBody, border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(139,69,19,0.3)', opacity: loading ? 0.6 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {loading ? 'Claiming your spot…' : (<><Feather size={16} /> Claim your founding spot →</>)}
                </button>
                <p style={{ textAlign: 'center', fontSize: 11, color: t.inkMuted }}>
                  {stats ? `${stats.charter} Charter / ${stats.founding} Founding spots claimed` : '…'}
                </p>
              </form>

              {/* Countdown */}
              <div className="wl-fade-up" style={{ marginTop: 40, borderTop: `1px solid ${t.line}`, paddingTop: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: t.inkMuted, fontFamily: t.fontBody }}>
                  <span>Launch countdown</span>
                  <span style={{ color: t.accent, fontFamily: t.fontType }}>{stats ? 'Live' : '…'}</span>
                </div>
                <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18 }}>
                  <TimeBox value={countdown.daysS} label="Days" />
                  <span style={{ fontFamily: t.fontType, fontWeight: 700, color: t.accent, fontSize: 20 }}>:</span>
                  <TimeBox value={countdown.hoursS} label="Hours" />
                  <span style={{ fontFamily: t.fontType, fontWeight: 700, color: t.accent, fontSize: 20 }}>:</span>
                  <TimeBox value={countdown.minutesS} label="Mins" />
                  <span style={{ fontFamily: t.fontType, fontWeight: 700, color: t.accent, fontSize: 20 }}>:</span>
                  <TimeBox value={countdown.secondsS} label="Secs" />
                </div>
              </div>
            </motion.div>
          )}

          {step === 'success' && myData && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              {/* Admission ticket */}
              <div
                style={{
                  marginTop: 36, borderRadius: 22, border: `1px solid ${t.lineDark}`,
                  background: `linear-gradient(180deg, rgba(139,69,19,0.07), transparent 45%), ${t.paper}`,
                  padding: 28, boxShadow: '0 10px 30px rgba(139,69,19,0.14)', position: 'relative', overflow: 'hidden',
                  backgroundImage: `linear-gradient(180deg, rgba(139,69,19,0.07), transparent 45%), ${t.grain}`,
                }}
              >
                {/* Corner stamp */}
                <div
                  style={{
                    position: 'absolute', top: 18, right: -38, transform: 'rotate(45deg)', width: 150,
                    textAlign: 'center', padding: '5px 0', borderTop: `1.5px solid ${t.crimson}`, borderBottom: `1.5px solid ${t.crimson}`,
                    fontFamily: t.fontType, fontSize: 11, letterSpacing: '0.28em', color: t.crimson, textTransform: 'uppercase',
                    backgroundColor: 'rgba(139,26,26,0.05)',
                  }}
                >
                  Booking Verified
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: t.fontType, fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase', color: t.accent }}>
                    {tierName(myData.position)} Cohort
                  </span>
                  <span style={{ fontFamily: t.fontType, fontSize: 13, color: t.inkMuted, border: `1px solid ${t.line}`, borderRadius: 999, padding: '4px 10px' }}>
                    #{myData.position}
                  </span>
                </div>

                <div style={{ marginTop: 22 }}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.15 }}
                    style={{ fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 40, letterSpacing: '-0.01em', color: myData.referralBonus ? t.accent : t.ink, lineHeight: 1.1 }}
                  >
                    {myData.referralBonus ? `+${myData.referralBonus.spotsJumped} SPOTS` : 'SPOT CLAIMED'}
                  </motion.div>
                  <p style={{ marginTop: 12, maxWidth: 380, fontSize: 14, lineHeight: 1.65, color: t.inkSoft }}>
                    {myData.referralBonus ? (
                      <>
                        <span style={{ color: t.accent, fontWeight: 600 }}>{myData.referralBonus.referrerName}</span> jumped from
                        #{myData.position + myData.referralBonus.spotsJumped} to #{myData.referralBonus.newPosition}.
                        You now hold <strong style={{ color: t.ink }}>#{myData.position}</strong> of 250.
                      </>
                    ) : (
                      <>
                        You're <strong style={{ color: t.ink }}>#{myData.position}</strong> in line.
                        Share your code to move up — every friend you bring jumps you both.
                      </>
                    )}
                  </p>
                </div>

                {/* Progress */}
                <div style={{ marginTop: 22 }}>
                  <div style={{ height: 8, borderRadius: 999, backgroundColor: t.desk, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%', borderRadius: 999,
                        background: `linear-gradient(90deg, ${t.accent}, #a05a1c)`,
                        width: `${Math.min(100, (myData.position / 250) * 100)}%`,
                      }}
                    />
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: t.inkMuted }}>
                    <span>Top {tierName(myData.position).toLowerCase()} of 250</span>
                    <span>{myData.position} of 250</span>
                  </div>
                </div>

                {/* Referral code */}
                <div
                  style={{
                    marginTop: 22, borderRadius: 14, border: `1px solid ${t.lineDark}`, backgroundColor: 'rgba(253,251,247,0.7)',
                    padding: 16,
                  }}
                >
                  <div style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: t.inkMuted, fontFamily: t.fontBody, fontWeight: 600 }}>
                    Your referral code
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <motion.div
                      initial={{ opacity: 0, letterSpacing: '0.8em' }}
                      animate={{ opacity: 1, letterSpacing: '0.18em' }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      style={{ fontFamily: t.fontType, fontSize: 28, fontWeight: 700, color: t.accent }}
                    >
                      {myData.referralCode}
                    </motion.div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(myData.referralCode);
                        triggerCopyFlash();
                      }}
                      style={{
                        borderRadius: 10, border: `1px solid ${t.lineDark}`, backgroundColor: t.paper,
                        padding: '8px 14px', fontSize: 12, fontWeight: 600, color: t.accent, cursor: 'pointer', fontFamily: t.fontBody,
                      }}
                    >
                      <KeyRound size={13} style={{ verticalAlign: '-2px', marginRight: 5 }} />
                      Copy
                    </button>
                  </div>
                </div>

                {/* Mini stats */}
                <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, textAlign: 'center' }}>
                  <div style={{ borderRadius: 12, border: `1px solid ${t.line}`, backgroundColor: 'rgba(253,251,247,0.6)', padding: '12px 4px' }}>
                    <div style={{ fontFamily: t.fontType, fontWeight: 700, fontSize: 16, color: t.accent }}>#{myData.position}</div>
                    <div style={{ marginTop: 3, fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.inkMuted }}>My spot</div>
                  </div>
                  <div style={{ borderRadius: 12, border: `1px solid ${t.line}`, backgroundColor: 'rgba(253,251,247,0.6)', padding: '12px 4px' }}>
                    <div style={{ fontFamily: t.fontType, fontWeight: 700, fontSize: 16, color: t.accent }}>
                      {myData.referralBonus ? `+${myData.referralBonus.spotsJumped}` : '+0'}
                    </div>
                    <div style={{ marginTop: 3, fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.inkMuted }}>Advantage</div>
                  </div>
                  <div style={{ borderRadius: 12, border: `1px solid ${t.line}`, backgroundColor: 'rgba(253,251,247,0.6)', padding: '12px 4px' }}>
                    <div style={{ fontFamily: t.fontType, fontWeight: 700, fontSize: 16, color: t.inkMuted }}>Pending</div>
                    <div style={{ marginTop: 3, fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.inkMuted }}>Status</div>
                  </div>
                </div>

                <p style={{ marginTop: 20, textAlign: 'center', fontSize: 11, color: t.inkMuted }}>
                  We're onboarding a small Founding Cohort before public launch.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <CopyFlashController />
    </div>
  );
}

/* Tiny helper to flash a "Copied" state on the copy button */
function CopyFlashController() {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    window.__setWaitlistCopied = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    };
    return () => { delete window.__setWaitlistCopied; };
  }, []);
  return copied ? (
    <div
      style={{
        position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 60,
        borderRadius: 999, backgroundColor: t.ink, color: t.paper, padding: '9px 18px', fontSize: 12.5,
        fontFamily: t.fontBody, boxShadow: '0 8px 20px rgba(26,26,26,0.25)',
      }}
    >
      Code copied to clipboard
    </div>
  ) : null;
}

function triggerCopyFlash() {
  if (window.__setWaitlistCopied) window.__setWaitlistCopied();
}