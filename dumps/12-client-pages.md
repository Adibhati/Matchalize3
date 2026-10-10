# Chunk 12 — Client Pages

> Matchalize · `client-pages` · files 12 of 25 chunks · 1 file(s) · 60 KB · ~17,642 tokens
> Generated 2026-10-09 14:03.
> Paste-safe: within the 100 KB / ~29,257 token target.
>
> Contains:
> - `./client/src/pages/Chat.jsx`

---
### ./client/src/pages/Chat.jsx

```
import React, { useEffect, useState, useRef, useCallback, useLayoutEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import socket from '../utils/socket';
import { api } from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import { toast } from '../utils/toast';
import { triggerHaptic } from '../utils/haptics';
import MessageBubble from '../components/chat/MessageBubble';
import MessageActionMenu from '../components/chat/MessageActionMenu';
import EmojiPicker from '../components/chat/EmojiPicker';
import PhotoViewer from '../components/chat/PhotoViewer';
import ReplyPreview from '../components/chat/ReplyPreview';
import SearchOverlay from '../components/chat/SearchOverlay';
import ReportModal from '../components/chat/ReportModal';
import { theme as design } from '../utils/theme';
import { Search, ChevronLeft, Sparkle, MapPin, Lock } from 'lucide-react';

/* ==================================================================
   ARCHIVAL THEME & TEXTURES
================================================================== */
const theme = {
  paper: 'var(--paper)',
  surface: 'var(--surface)',
  surfaceAlt: 'var(--surface-alt)',
  border: 'var(--line)',
  borderDark: 'var(--line-dark)',
  ink: 'var(--ink)',
  inkMuted: 'var(--ink-muted)',
  accent: 'var(--accent)',
  crimson: 'var(--crimson)',
  shadowWarm: 'var(--accent-12)',
};

// crypto.randomUUID fallback for non-HTTPS / LAN environments
const genId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

const Icon = React.memo(({ path, size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
));

const formatDateSeparator = (dateStr) => {
  if (!dateStr) return '';
  const today = new Date();
  const msgDate = new Date(dateStr);
  const isToday = msgDate.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const isYesterday = msgDate.toDateString() === yesterday.toDateString();
  
  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  return msgDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatLastActive = (lastActive) => {
  if (!lastActive) return 'Offline';
  const now = new Date();
  const last = new Date(lastActive);
  const diffMs = now - last;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Active now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return last.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

async function fetchMessages(alignmentId, cursor = null, limit = 50) {
  try {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    params.set('limit', String(limit));
    const qs = params.toString();
    const data = await api.get(`/messages/${alignmentId}${qs ? '?' + qs : ''}`);
    return {
      messages: Array.isArray(data) ? data : data.messages || [],
      hasMore: data.hasMore || false,
      nextCursor: data.nextCursor || null,
    };
  } catch (err) {
    console.error('Fetch messages error:', err);
    return { messages: [], hasMore: false, nextCursor: null };
  }
}

/* ==================================================================
   CHAT PROFILE VIEW (100% Visual Parity with Discovery ProfileCard)
================================================================== */
const chatTheme = {
  color: {
    paper: 'var(--paper)', surface: 'var(--surface)', surfaceAlt: 'var(--surface-alt)', border: 'var(--line)',
    borderDark: 'var(--line-dark)', ink: 'var(--ink)', inkSoft: 'var(--ink-soft)', inkMuted: 'var(--ink-muted)',
    accent: 'var(--accent)', crimson: 'var(--crimson)', shadowWarm: 'var(--accent-12)', shadowDark: 'var(--ink-20)',
  },
  font: { display: "'Playfair Display', Georgia, serif", body: "'Inter', -apple-system, sans-serif" },
};

function buildTornEdge(teeth = 64) {
  const heights = [0, 18, 4, 22, 8, 16, 2, 24, 6, 14, 10, 20];
  const pts = ['0% 100%'];
  for (let i = 0; i <= teeth; i++) {
    const x = ((i / teeth) * 100).toFixed(2);
    const y = heights[i % heights.length];
    pts.push(`${x}% ${y}%`);
  }
  pts.push('100% 100%');
  return `polygon(${pts.join(',')})`;
}
const CHAT_TORN_EDGE_CLIP = buildTornEdge();

const TILT = { prompt_0: '1.4deg', photo_1: '-2.2deg', photo_2: '1.8deg', prompt_1: '-1.1deg', prompt_2: '0.5deg', photo_3: '-0.7deg' };

const ChatSectionLabel = React.memo(({ children }) => (
  <p style={{ fontFamily: chatTheme.font.body, fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: chatTheme.color.accent, margin: '0 0 12px 0', display: 'flex', alignItems: 'center' }}>
    <span aria-hidden="true" style={{ display: 'inline-block', width: '16px', height: '2px', backgroundColor: chatTheme.color.accent, marginRight: '8px', borderRadius: '2px' }} />
    {children}
  </p>
));

const ChatStitchSeam = React.memo(() => (
  <div aria-hidden="true" style={{ height: '1px', backgroundImage: `repeating-linear-gradient(90deg, ${chatTheme.color.border} 0px, ${chatTheme.color.border} 8px, transparent 8px, transparent 14px)`, opacity: 0.8, margin: '16px 0' }} />
));

const ChatPhotoCorners = React.memo(() => (
  <>
    <span aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, width: 24, height: 24, background: chatTheme.color.surface, clipPath: 'polygon(0 0, 100% 0, 0 100%)', zIndex: 3 }} />
    <span aria-hidden="true" style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, background: chatTheme.color.surface, clipPath: 'polygon(100% 100%, 0 100%, 100% 0)', zIndex: 3 }} />
  </>
));

const ChatMountedPhoto = React.memo(({ src, alt, tilt, aspect }) => (
  <div className="pc-dynamic-shadow" style={{ '--tilt': tilt, transform: 'rotate(var(--tilt, 0deg))', position: 'relative', width: '100%', height: aspect ? 'auto' : '200px', aspectRatio: aspect || undefined, borderRadius: '6px', border: `6px solid ${chatTheme.color.surface}`, backgroundColor: chatTheme.color.surfaceAlt, overflow: 'hidden' }}>
    <img src={src} alt={alt} className="pc-photo-img" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    <ChatPhotoCorners />
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at var(--lamp-pct-x, 50%) var(--lamp-pct-y, 30%), rgba(255,255,255,0.35) 0%, transparent 50%)', pointerEvents: 'none', zIndex: 4, mixBlendMode: 'soft-light' }} />
  </div>
));

const ChatIndexCard = ({ children, tilt, wide, tape = 'center' }) => {
  const getTapeConfig = () => {
    const base = { position: 'absolute', top: '-10px', width: '36px', height: '16px', backgroundColor: 'var(--tape-90)', backdropFilter: 'blur(3px)', border: '1px solid var(--accent-20)', zIndex: 5 };
    if (tape === 'top-right') return { ...base, right: '16px', '--tape-rot': '4deg', transform: 'rotate(4deg)' };
    if (tape === 'top-left') return { ...base, left: '16px', '--tape-rot': '-4deg', transform: 'rotate(-4deg)' };
    return { ...base, left: '50%', '--tape-rot': '-1deg', transform: 'translateX(-50%) rotate(-1deg)' };
  };
  return (
    <div className="pc-dynamic-shadow" style={{ '--tilt': tilt, transform: 'rotate(var(--tilt, 0deg))', backgroundColor: chatTheme.color.surface, backgroundImage: `linear-gradient(${chatTheme.color.accent}11 1px, transparent 1px)`, backgroundSize: '100% 24px', border: `1px solid ${chatTheme.color.border}`, borderRadius: '8px', padding: '24px 16px 20px', height: wide ? 'auto' : '100%', minHeight: wide ? undefined : '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <span aria-hidden="true" className="pc-tape" style={getTapeConfig()} />
      <span aria-hidden="true" className="pc-metallic-foil" style={{ fontFamily: chatTheme.font.display, fontSize: '32px', lineHeight: 0.5, opacity: 0.45, marginBottom: '8px', display: 'block', background: `linear-gradient(-135deg, var(--accent-strong) 0%, var(--accent) 30%, var(--gold) 50%, var(--accent) 70%, var(--accent-strong) 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>“</span>
      <p style={{ fontFamily: chatTheme.font.display, fontSize: '15px', fontStyle: 'italic', color: chatTheme.color.ink, margin: '0 0 4px 0', lineHeight: 1.45, textAlign: 'center', fontWeight: 600 }}>{children}</p>
    </div>
  );
};

const ChatProfileView = ({ profile, onClose, unavailable }) => {
  if (!profile) return null;

  if (unavailable) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(20,15,10,0.7)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxHeight: '50dvh', backgroundColor: chatTheme.color.paper, borderTopLeftRadius: '24px', borderTopRightRadius: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 -12px 32px var(--wm-20)', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--accent-08)', border: '2px solid var(--accent-15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <Lock size={28} color={chatTheme.color.inkMuted} strokeWidth={1.5} />
          </div>
          <p style={{ fontFamily: chatTheme.font.display, fontSize: '20px', fontWeight: 700, color: chatTheme.color.ink, margin: '0 0 8px', textAlign: 'center', letterSpacing: '-0.02em' }}>
            This user is no longer available
          </p>
          <p style={{ fontFamily: chatTheme.font.body, fontSize: '13px', color: chatTheme.color.inkMuted, margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
            This profile is no longer accessible.
          </p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(20,15,10,0.7)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} style={{ width: '100%', maxHeight: '92vh', backgroundColor: chatTheme.color.paper, borderTopLeftRadius: '24px', borderTopRightRadius: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 -12px 32px var(--wm-20)' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${chatTheme.color.borderDark}`, backgroundColor: chatTheme.color.paper, borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 10, position: 'sticky', top: 0 }}>
          <span style={{ fontFamily: chatTheme.font.display, fontSize: '20px', fontWeight: 700, color: chatTheme.color.ink }}>View Profile</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }} aria-label="Close profile">
            <Icon path={<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>} size={24} color={chatTheme.color.inkMuted} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="pc-scroll" style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '40px', position: 'relative' }}>
          
          {/* 1. Hero Photo Section */}
          <div style={{ width: '100%', position: 'relative' }}>
            <div style={{ width: '100%', aspectRatio: '4/5.8', position: 'relative', backgroundColor: chatTheme.color.surfaceAlt, overflow: 'hidden' }}>
              <img src={profile.photos?.[0] || 'https://via.placeholder.com/600x800/e8e4d9/1a1a1a?text=No+Photo'} alt={profile.name} className="pc-photo-img" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.2) 0%, transparent 50%), linear-gradient(to top, rgba(15,12,10,0.98) 0%, rgba(15,12,10,0.6) 40%, rgba(0,0,0,0.1) 75%, transparent 100%)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '38px', left: '24px', right: '24px', zIndex: 2 }}>
                <div className="pc-fade-1" style={{ display: 'inline-block', padding: '5px 12px', background: 'var(--paper-20)', backdropFilter: 'blur(12px)', borderRadius: design.radius.sm, border: '1px solid rgba(255,255,255,0.4)', marginBottom: '12px' }}>
                  <span style={{ fontFamily: chatTheme.font.body, fontSize: '10px', color: '#fff', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700 }}>Archival Subject</span>
                </div>
                <h2 className="pc-fade-1" style={{ fontFamily: chatTheme.font.display, fontSize: 'clamp(30px, 7vw, 42px)', color: '#fff', margin: 0, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05, textShadow: '0 4px 20px rgba(0,0,0,0.6)' }}>
                  {profile.name || 'Anonymous'}<span style={{ fontWeight: 400, opacity: 0.85 }}>, {profile.age || '—'}</span>
                </h2>
                <p className="pc-fade-2" style={{ fontFamily: chatTheme.font.body, fontSize: '11px', color: 'rgba(255,255,255,0.92)', margin: '8px 0 0 0', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  {profile.branch || 'General'} <Sparkle size={12} color="var(--gold)" style={{ margin: '0 8px', flexShrink: 0 }} /> {profile.year?.toUpperCase() || '—'}
                </p>
              </div>
            </div>
            <div aria-hidden="true" style={{ width: '100%', height: '24px', backgroundColor: chatTheme.color.paper, clipPath: CHAT_TORN_EDGE_CLIP, marginTop: '-14px', position: 'relative', zIndex: 3 }} />
          </div>

          <div style={{ padding: '24px 24px 0 24px' }}>
            
            {/* 2. Vitals */}
            <ChatSectionLabel>Vitals</ChatSectionLabel>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {profile.gender && <span className="pc-pill" style={{ padding: '6px 12px', border: `1px solid ${chatTheme.color.border}`, borderRadius: design.radius.sm, backgroundColor: chatTheme.color.surface, color: chatTheme.color.ink, fontFamily: chatTheme.font.body, fontSize: '11px', fontWeight: 600, letterSpacing: '0.2px' }}>{profile.gender}</span>}
              {profile.pronouns && <span className="pc-pill" style={{ padding: '6px 12px', border: `1px solid ${chatTheme.color.border}`, borderRadius: design.radius.sm, backgroundColor: chatTheme.color.surface, color: chatTheme.color.ink, fontFamily: chatTheme.font.body, fontSize: '11px', fontWeight: 600, letterSpacing: '0.2px' }}>{profile.pronouns}</span>}
              {profile.hostel && <span className="pc-pill" style={{ padding: '6px 12px', border: `1px solid ${chatTheme.color.border}`, borderRadius: design.radius.sm, backgroundColor: chatTheme.color.surface, color: chatTheme.color.ink, fontFamily: chatTheme.font.body, fontSize: '11px', fontWeight: 600, letterSpacing: '0.2px', display: 'inline-flex', alignItems: 'center' }}><MapPin size={12} style={{ marginRight: 4 }} /> {profile.hostel}</span>}
            </div>

            <ChatStitchSeam />

            {/* 4. Seeking Parameters */}
            <div style={{ margin: '24px 0' }}>
              <ChatSectionLabel>Seeking</ChatSectionLabel>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(profile.intent && profile.intent.length > 0 ? profile.intent : ['Long-term', 'Connection', 'Growth']).map((item, i) => (
                  <span key={i} className="pc-pill" style={{ padding: '6px 12px', border: `1px solid ${chatTheme.color.ink}`, borderRadius: design.radius.sm, backgroundColor: chatTheme.color.ink, color: chatTheme.color.paper, fontFamily: chatTheme.font.body, fontSize: '11px', fontWeight: 600, letterSpacing: '0.2px' }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* 5. Recorded Curiosities */}
            {profile.interests && profile.interests.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <ChatSectionLabel>Recorded Curiosities</ChatSectionLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {profile.interests.map((interest, i) => (
                    <span key={i} className="pc-pill" style={{ padding: '6px 12px', border: `1px solid var(--tape-70)`, borderRadius: design.radius.sm, backgroundColor: chatTheme.color.surfaceAlt, color: chatTheme.color.ink, fontFamily: chatTheme.font.body, fontSize: '11px', fontWeight: 500 }}>
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Bento Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 16px', marginBottom: '48px', paddingTop: '8px' }}>
              <ChatIndexCard tilt={TILT.prompt_0} tape="top-right">
                {profile.prompts?.[0]?.question || "A shower thought I recently had..."}
              </ChatIndexCard>

              {profile.photos?.[1] ? (
                <ChatMountedPhoto src={profile.photos[1]} alt={`${profile.name}, photo 2`} tilt={TILT.photo_1} />
              ) : <div />}

              {profile.photos?.[2] ? (
                <ChatMountedPhoto src={profile.photos[2]} alt={`${profile.name}, photo 3`} tilt={TILT.photo_2} />
              ) : <div />}

              <ChatIndexCard tilt={TILT.prompt_1} tape="top-left">
                {profile.prompts?.[1]?.question || "My ideal weekend looks like..."}
              </ChatIndexCard>

              {profile.prompts?.[2] && (
                <ChatIndexCard tilt={TILT.prompt_2} wide tape="center">
                  {profile.prompts[2].question}
                </ChatIndexCard>
              )}

              {profile.photos?.[3] && (
                <ChatMountedPhoto src={profile.photos[3]} alt={`${profile.name}, photo 4`} tilt={TILT.photo_3} aspect="16/9" />
              )}
            </div>
          </div>
        </div>

        {/* Archival Animations */}
        <style>{`
          @keyframes pcFadeUp { from { opacity: 0; transform: translate3d(0, 16px, 0); filter: blur(2px); } to { opacity: 1; transform: translate3d(0, 0, 0); filter: blur(0px); } }
          @keyframes pcRadarSweep { 0% { transform: rotate(-90deg); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: rotate(270deg); opacity: 0; } }
          @keyframes pcHintPulse { 0% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.95; transform: scale(1.03); } 100% { opacity: 0.4; transform: scale(1); } }
          .pc-fade-1 { animation: pcFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both; }
          .pc-fade-2 { animation: pcFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both; }
          .pc-scroll::-webkit-scrollbar { width: 4px; }
          .pc-scroll::-webkit-scrollbar-track { background: transparent; }
          .pc-scroll::-webkit-scrollbar-thumb { background: ${chatTheme.color.borderDark}; border-radius: 4px; }
          .pc-sweep { animation: pcRadarSweep 1.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; transform-origin: 44px 44px; }
          .pc-hint-pulse { animation: pcHintPulse 2.8s ease-in-out infinite; }
          .pc-dynamic-shadow { will-change: transform; transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.25s ease; }
          .pc-dynamic-shadow:active { transform: scale3d(0.98, 0.98, 1) translate3d(0, 0, 0) !important; transition: transform 0.1s cubic-bezier(0, 0, 0.2, 1) !important; }
          .pc-metallic-foil { background: linear-gradient(-135deg, var(--accent-strong) 0%, var(--accent) 30%, var(--gold) 50%, var(--accent) 70%, var(--accent-strong) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .pc-pill { transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease; display: inline-flex; align-items: center; will-change: transform; }
          .pc-tape { transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1); will-change: transform; }
          .pc-photo-img { transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); will-change: transform; }
          @media (prefers-reduced-motion: reduce) { .pc-fade-1, .pc-fade-2, .pc-sweep, .pc-hint-pulse { animation: none !important; opacity: 1 !important; transform: none !important; } .pc-dynamic-shadow, .pc-photo-img, .pc-pill, .pc-tape { transition: none !important; } }
        `}</style>
      </motion.div>
    </motion.div>
  );
};

/* ==================================================================
   MAIN CHAT COMPONENT
================================================================== */
const Chat = ({ match, onBack }) => {
  const matchUser = match?.user;
  const alignmentId = match?._id;
  const otherUserId = matchUser?._id;
  
  const [inputText, setInputText] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  
  // Online status
  const [isOnline, setIsOnline] = useState(false);
  const [lastActive, setLastActive] = useState(null);
  
  // Pagination (cursor-based)
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Scroll to bottom
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerAnchor, setEmojiPickerAnchor] = useState(null);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [photoViewerUrl, setPhotoViewerUrl] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const fileInputRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const typingTimer = useRef(null);
  const listEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const prevMessagesLengthRef = useRef(0);
  const pendingMsgIdRef = useRef(null);
  const [socketConnected, setSocketConnected] = useState(socket?.connected ?? true);
  const otherUnavailable = matchUser?.suspended || matchUser?.isDeleted;

  const { user } = useAuth();
  const myId = user?._id;
  const myName = user?.name;

  const queryClient = useQueryClient();
  const { data: queryMessages = [], isLoading: loading, isError, error: queryError } = useQuery({
    queryKey: ['messages', alignmentId],
    queryFn: async () => {
      const d = await fetchMessages(alignmentId, null, 50);
      setHasMore(d.hasMore);
      setCursor(d.nextCursor);
      if (socket) socket.emit('read-messages', { alignmentId });
      return d.messages;
    },
    enabled: !!alignmentId,
  });
  const messages = queryMessages;
  const error = isError ? (queryError?.message || 'Failed to load messages') : null;

  // Socket Subscriptions
  useEffect(() => {
    if (!socket || !alignmentId) return;
    setCursor(null);
    socket.emit('join-alignment', alignmentId);

    const onReconnect = () => {
      if (alignmentId) socket.emit('join-alignment', alignmentId);
    };
    socket.on('connect', onReconnect);

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    const onNew = (msg) => {
      if (msg?.alignmentId === alignmentId) {
        queryClient.setQueryData(['messages', alignmentId], (prev = []) => (prev.some((p) => p._id === msg._id) ? prev : [...prev, msg]));
        socket.emit('read-messages', { alignmentId });
        triggerHaptic('light');
      }
    };
    const onRead = () => {
      queryClient.setQueryData(['messages', alignmentId], (prev = []) => prev.map((m) => (String(m.sender || m.senderId) === String(myId) ? { ...m, read: true, readAt: new Date().toISOString() } : m)));
    };
    const onTyping = () => setOtherTyping(true);
    const onStop = () => setOtherTyping(false);
    const onReactionUpdate = ({ msgId, reactions }) => {
      queryClient.setQueryData(['messages', alignmentId], (prev = []) => prev.map((m) => (m._id === msgId ? { ...m, reactions } : m)));
    };
    const onMessageDeleted = ({ msgId }) => {
      queryClient.setQueryData(['messages', alignmentId], (prev = []) => prev.map((m) => (m._id === msgId ? { ...m, deleted: true, text: '', mediaUrl: '' } : m)));
    };
    const onOnlineUpdate = ({ userId, online, lastActive: la }) => {
      if (userId === otherUserId) {
        setIsOnline(online);
        setLastActive(la);
      }
    };

    socket.on('new-message', onNew);
    socket.on('messages-read', onRead);
    socket.on('user-typing', onTyping);
    socket.on('user-stop-typing', onStop);
    socket.on('reaction-update', onReactionUpdate);
    socket.on('message-deleted', onMessageDeleted);
    socket.on('online-update', onOnlineUpdate);

    // Declared at effect scope (not inside the `if`) so the cleanup below can pass
    // it to socket.off. `socket.off(event)` with no listener removes EVERY
    // listener for that event, so a bare unsubscribe deafens chat app-wide — this
    // line was previously `socket.off('online-status')`.
    const onOnlineStatus = ({ online, lastActive: la }) => {
      setIsOnline(online);
      setLastActive(la);
    };

    if (otherUserId) {
      socket.emit('check-online', { alignmentId, targetUserId: otherUserId });
      socket.on('online-status', onOnlineStatus);
    }

    return () => {
      if (typingTimer.current) {
        clearTimeout(typingTimer.current);
        typingTimer.current = null;
        socket.emit('stop-typing', { alignmentId });
      }
      socket.off('connect', onReconnect);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('new-message', onNew);
      socket.off('messages-read', onRead);
      socket.off('user-typing', onTyping);
      socket.off('user-stop-typing', onStop);
      socket.off('reaction-update', onReactionUpdate);
      socket.off('message-deleted', onMessageDeleted);
      socket.off('online-update', onOnlineUpdate);
      // `socket.off(event)` with no listener removes EVERY listener for that
      // event — one careless unsubscribe deafens chat for the whole app. Every
      // other line above passes its handler; this one didn't. Harmless today
      // (online-status has a single subscriber) but it breaks silently the day
      // a second component subscribes.
      socket.off('online-status', onOnlineStatus);
    };
  }, [alignmentId, myId, otherUserId, queryClient]);

  // ⚓ ZERO-LAG SCROLL ANCHOR: Freezes viewport when older messages are prepended to DOM
  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // If messages grew because we loaded history (not because we sent a new message at the bottom)
    if (messages.length > prevMessagesLengthRef.current && prevScrollHeightRef.current > 0) {
      const heightDifference = container.scrollHeight - prevScrollHeightRef.current;
      if (container.scrollTop < 100 && heightDifference > 0) {
        container.scrollTop = heightDifference;
      }
    }
    
    prevScrollHeightRef.current = container.scrollHeight;
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!showScrollButton) {
      listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, otherTyping, loading, showScrollButton]);

  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const { messages: olderMsgs, hasMore: more, nextCursor } = await fetchMessages(alignmentId, cursor, 50);
    queryClient.setQueryData(['messages', alignmentId], (prev = []) => [...olderMsgs, ...prev]);
    setCursor(nextCursor);
    setHasMore(more);
    setLoadingMore(false);
  }, [loadingMore, hasMore, cursor, alignmentId, queryClient]);

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
    setShowScrollButton(!isNearBottom);

    if (scrollTop < 5 && hasMore && !loadingMore && !loading) {
      loadMoreMessages();
    }
  }, [hasMore, loadingMore, loading, loadMoreMessages]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!socket) return;
    if (!typingTimer.current) socket.emit('typing', { alignmentId, userName: myName });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('stop-typing', { alignmentId });
      typingTimer.current = null;
    }, 500);
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !alignmentId) {
      console.error('Cannot send: missing text or alignmentId');
      return;
    }
    if (!pendingMsgIdRef.current) pendingMsgIdRef.current = genId();
    triggerHaptic('medium');
    socket.emit('stop-typing', { alignmentId });
    if (typingTimer.current) { clearTimeout(typingTimer.current); typingTimer.current = null; }

    try {
      const msg = await api.post(`/messages/${alignmentId}`, {
        text,
        replyTo: replyTo?._id || null,
        clientMsgId: pendingMsgIdRef.current,
      });
      queryClient.setQueryData(['messages', alignmentId], (prev = []) => [...prev, msg]);
      setInputText('');
      setReplyTo(null);
      setShowScrollButton(false);
      pendingMsgIdRef.current = null;
    } catch (err) {
      console.error('Send failed:', err);
      if (!err?.toasted) {
        toast.error('Couldn\'t send message. Check your connection.', {
          label: 'Retry',
          onClick: () => handleSend()
        });
      }
    }
  };

  const handleFileClick = () => { triggerHaptic('light'); fileInputRef.current?.click(); };

  const onFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setShowActionSheet(true);
    triggerHaptic('medium');
    e.target.value = '';
  };

  const uploadAndSend = async (kind) => {
    const file = pendingFile;
    setShowActionSheet(false);
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await api.upload(file);
      if (url) {
        triggerHaptic('heavy');
        if (!pendingMsgIdRef.current) pendingMsgIdRef.current = genId();
        const msg = await api.post(`/messages/${alignmentId}`, {
          type: kind,
          mediaUrl: url,
          replyTo: replyTo?._id || null,
          clientMsgId: pendingMsgIdRef.current,
        });
        queryClient.setQueryData(['messages', alignmentId], (prev = []) => [...prev, msg]);
        pendingMsgIdRef.current = null;
        setReplyTo(null);
        setShowScrollButton(false);
      }
    } catch (err) { 
      console.error('Upload failed:', err);
      if (!err?.toasted) {
        toast.error('Couldn\'t upload photo. Check your connection.', {
          label: 'Retry',
          onClick: () => uploadAndSend(kind)
        }); 
      }
    } finally { 
      setUploading(false);
      setPendingFile(null);
    }
  };

  const startRecording = async () => {
    triggerHaptic('medium');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/mp4';
      const rec = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = async () => {
        const ext = mimeType.includes('mp4') ? 'm4a' : 'webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const file = new File([blob], `voice.${ext}`, { type: mimeType });
        setPendingFile(file);
        setShowActionSheet(true);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch { setRecording(false); }
  };

  const stopRecording = () => { triggerHaptic('heavy'); recorderRef.current?.stop(); setRecording(false); };

  const handleLongPress = (message, event) => {
    if (message.deleted) return;
    const rect = event.target.closest('[data-bubble="true"]')?.getBoundingClientRect();
    if (rect) { setSelectedMessage(message); setMenuAnchor(rect); }
  };

  const handleCloseMenu = () => { setSelectedMessage(null); setMenuAnchor(null); };
  const handleReply = () => { setReplyTo(selectedMessage); handleCloseMenu(); triggerHaptic('light'); };
  
  const handleReact = () => {
    setEmojiPickerAnchor(menuAnchor);
    setMenuAnchor(null);
    setShowEmojiPicker(true);
  };

  const handleEmojiSelect = async (emoji) => {
    setShowEmojiPicker(false);
    setEmojiPickerAnchor(null);
    const target = selectedMessage;
    setSelectedMessage(null);
    if (!target) return;
    try {
      const data = await api.post(`/messages/${alignmentId}/reaction`, { msgId: target._id, emoji });
      queryClient.setQueryData(['messages', alignmentId], (prev = []) => prev.map((m) => (m._id === target._id ? { ...m, reactions: data.reactions } : m)));
    } catch (err) { console.error('Reaction failed:', err); }
  };

  const handleCopy = () => {
    if (selectedMessage?.text) navigator.clipboard.writeText(selectedMessage.text);
    triggerHaptic('light');
    handleCloseMenu();
  };

  const handleReport = () => {
    setShowReportModal(true);
    handleCloseMenu();
  };

  const handleDelete = async () => {
    if (!selectedMessage) return;
    if (!window.confirm('Delete this message?')) return;
    try {
      await api.delete(`/messages/${alignmentId}/${selectedMessage._id}`);
      queryClient.setQueryData(['messages', alignmentId], (prev = []) => prev.map((m) => (m._id === selectedMessage._id ? { ...m, deleted: true } : m)));
      triggerHaptic('heavy');
    } catch (err) { 
      console.error('Delete failed:', err);
      if (!err?.toasted) {
        toast.error('Failed to delete. Please try again.');
      }
    }
    handleCloseMenu();
  };

  const handleImageClick = (url) => { setPhotoViewerUrl(url); setShowPhotoViewer(true); triggerHaptic('light'); };

  // Optimized Search Jump utilizing CSS class animations to prevent DOM style lag
  const handleSearchJump = (msgId) => {
    const el = document.querySelector(`[data-msg-id="${msgId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('highlight-pulse');
      setTimeout(() => { el.classList.remove('highlight-pulse'); }, 2000);
    }
  };

  const handleUnmatch = async () => {
    if (!window.confirm('End this conversation? This cannot be undone.')) return;
    try {
      await api.delete(`/alignments/${alignmentId}`);
      triggerHaptic('heavy');
      onBack();
    } catch (err) {
      console.error('Unmatch failed:', err);
      if (!err?.toasted) {
        toast.error('Failed to end this conversation. Please try again.');
      }
    }
    setShowHeaderMenu(false);
  };

  const handleBlock = async () => {
    if (!window.confirm('Block this user? They will no longer be able to message you.')) return;
    try {
      await api.post(`/report/block/${otherUserId}`);
      triggerHaptic('heavy');
      onBack();
    } catch (err) {
      console.error('Block failed:', err);
      if (!err?.toasted) {
        toast.error('Failed to block this user. Please try again.', {
          label: 'Retry',
          onClick: () => handleBlock()
        });
      }
    }
    setShowHeaderMenu(false);
  };

  const scrollToBottom = () => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollButton(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.paperGrain} aria-hidden="true" />

      {/* ARCHIVAL HEADER WITH ONLINE STATUS */}
      <div style={styles.header}>
        <button style={styles.backBtn} onPointerDown={(e) => { e.preventDefault(); triggerHaptic('light'); onBack(); }} onClick={() => { triggerHaptic('light'); onBack(); }} aria-label="Go back to letters"><ChevronLeft size={24} color={theme.ink} /></button>

        <div style={styles.headerLeft} onClick={() => setShowProfile(true)}>
          <div style={{ position: 'relative' }}>
            <img 
              src={matchUser?.photos?.[0] || 'https://via.placeholder.com/80'} 
              alt={matchUser?.name} 
              loading="lazy"
              decoding="async"
              onLoad={(e) => { e.currentTarget.style.opacity = 1; }}
              onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/80'; e.currentTarget.style.opacity = 1; }}
              style={{ ...styles.headerAvatar, opacity: 0, transition: 'opacity 0.3s ease-out' }} 
            />
            {isOnline && <div style={styles.onlineDot} />}
          </div>
          <div style={styles.headerInfo}>
            <span style={styles.headerName}>{matchUser?.name || 'Connection'}</span>
            <span style={styles.headerStatus}>
              {otherTyping ? 'Typing...' : isOnline ? 'Online' : formatLastActive(lastActive)}
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button style={styles.iconBtn} onClick={() => setShowSearch(true)} title="Search" aria-label="Search messages">
            <Search size={20} color={theme.ink} />
          </button>

          <div style={{ position: 'relative' }}>
            <button style={styles.iconBtn} onClick={() => setShowHeaderMenu(!showHeaderMenu)} aria-label="Open chat options">
              <Icon path={<><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></>} size={20} color={theme.ink} />
            </button>
            
            <AnimatePresence>
              {showHeaderMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  style={styles.dropdownMenu}
                >
                  <button style={styles.dropdownItem} onClick={() => { setShowProfile(true); setShowHeaderMenu(false); }}>
                    <Icon path={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>} size={16} />
                    View Profile
                  </button>
                  <button style={{...styles.dropdownItem, color: theme.crimson}} onClick={() => { handleReport(); setShowHeaderMenu(false); }}>
                    <Icon path={<><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></>} size={16} color={theme.crimson} />
                    Report User
                  </button>
                  <button style={{...styles.dropdownItem, color: theme.crimson}} onClick={handleBlock}>
                    <Icon path={<><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></>} size={16} color={theme.crimson} />
                    Block User
                  </button>
                  <button style={{...styles.dropdownItem, color: theme.crimson}} onClick={handleUnmatch}>
                    <Icon path={<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>} size={16} color={theme.crimson} />
                    Unmatch
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div style={styles.tornEdgeBottom} aria-hidden="true" />
      </div>

      {!socketConnected && (
        <div style={{ background: '#f59e0b', color: '#fff', textAlign: 'center', padding: '6px 12px', fontSize: '13px', fontWeight: 500, letterSpacing: '0.3px' }}>
          Reconnecting...
        </div>
      )}

      {otherUnavailable && (
        <div style={{
          background: 'var(--accent-06)',
          borderBottom: '1px solid var(--accent-12)',
          padding: '10px 24px',
          textAlign: 'center',
          position: 'relative', zIndex: 5,
        }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: 'var(--ink-muted)', margin: 0 }}>
            This user can no longer receive messages
          </p>
        </div>
      )}

      {/* MESSAGES STAGE WITH ZERO-LAG ENGINE */}
      <div 
        ref={messagesContainerRef}
        className="archival-scrollbar" 
        style={styles.messages}
        onScroll={handleScroll}
      >
        <style>{`
          .archival-scrollbar::-webkit-scrollbar { width: 4px; }
          .archival-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .archival-scrollbar::-webkit-scrollbar-thumb { background: ${theme.borderDark}; border-radius: 4px; }
          @keyframes blink { 0% { opacity: 0.2; } 20% { opacity: 1; } 100% { opacity: 0.2; } }
          @keyframes highlightBg { 0% { background-color:'var(--accent-20)'; } 100% { background-color: transparent; } }
          .highlight-pulse { animation: highlightBg 2s ease-out forwards; }
          
          /* Interactive Button Tactile Physics */
          .tactile-btn { transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), background-color 0.2s ease; will-change: transform; }
          @media (hover: hover) { .tactile-btn:hover { transform: translate3d(0, -2px, 0) scale3d(1.02, 1.02, 1); } }
          .tactile-btn:active { transform: scale3d(0.96, 0.96, 1) translate3d(0, 0, 0) !important; transition: transform 0.08s cubic-bezier(0, 0, 0.2, 1) !important; }
        `}</style>
        
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: theme.inkMuted, fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>
            Opening chat...
          </div>
        ) : error ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: theme.crimson, fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>
            {error}
          </div>
        ) : (
          <>
            {loadingMore && (
              <div style={{ padding: '20px', textAlign: 'center', color: theme.inkMuted, fontFamily: "'Inter', sans-serif", fontSize: '12px' }}>
                Loading older messages...
              </div>
            )}

            {/* Opening Letter Card */}
            {messages.filter(m => m.type === 'opening_letter').map(m => (
              <div key={m._id} style={styles.openingLetterCard}>
                <div style={styles.openingLetterLabel}>Opening Letter</div>
                {(m.mediaUrl || m.image) && (
                  <img
                    src={m.mediaUrl || m.image}
                    alt="Opening letter"
                    onClick={() => handleImageClick(m.mediaUrl || m.image)}
                    style={{ width: '100%', borderRadius: design?.radius?.md || '8px', margin: '8px 0', cursor: 'zoom-in', display: 'block' }}
                  />
                )}
                <div style={styles.openingLetterText}>{m.text}</div>
                <div style={styles.openingLetterDate}>
                  {m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                </div>
              </div>
            ))}

            {messages.filter(m => m.type !== 'opening_letter').map((m, i, filteredArr) => {
              const isMine = String(m.sender || m.senderId) === String(myId);
              const time = m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
              const receipt = isMine ? (m.read || m.readAt ? 'SEEN' : 'SENT') : null;
              const msgDate = formatDateSeparator(m.createdAt);
              const prevDate = i > 0 ? formatDateSeparator(filteredArr[i-1].createdAt) : null;
              const showDate = msgDate && msgDate !== prevDate;
              const replyPreview = m.replyTo ? messages.find((msg) => msg._id === (m.replyTo._id || m.replyTo)) : null;

              return (
                <React.Fragment key={m._id || i}>
                  {showDate && (
                    <div style={styles.dateSeparator}>
                      <span style={styles.dateText}>{msgDate}</span>
                    </div>
                  )}
                  <div data-msg-id={m._id} style={{ borderRadius: '8px' }}>
                    <MessageBubble
                      message={m}
                      isMine={isMine}
                      time={time}
                      receipt={receipt}
                      onLongPress={handleLongPress}
                      onImageClick={handleImageClick}
                      replyPreview={replyPreview}
                    />
                  </div>
                </React.Fragment>
              );
            })}
            {otherTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.typing}>
                <span style={styles.typingDot} />
                <span style={{...styles.typingDot, animationDelay: '0.2s'}} />
                <span style={{...styles.typingDot, animationDelay: '0.4s'}} />
              </motion.div>
            )}
            <div ref={listEndRef} style={{ height: '10px' }} />
          </>
        )}
      </div>

      {/* SCROLL TO BOTTOM BUTTON */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={scrollToBottom}
            style={styles.scrollButton}
            aria-label="Scroll to bottom"
          >
            <Icon path={<polyline points="6 9 12 15 18 9" />} size={20} color={theme.accent} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* REPLY PREVIEW */}
      <AnimatePresence>
        {replyTo && <ReplyPreview replyTo={replyTo} otherName={matchUser?.name} onCancel={() => setReplyTo(null)} />}
      </AnimatePresence>

      {/* INPUT BAR WITH WASHI TAPE */}
      {match.isActive !== false && !otherUnavailable ? (
      <div style={styles.inputBar}>
        <div style={styles.washiTape} aria-hidden="true" />
        
        <button 
          className="tactile-btn"
          style={styles.attachBtn} 
          onClick={handleFileClick} 
          title="Attach"
          aria-label="Attach photo or file"
        >
          <Icon path={<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />} size={22} color={theme.accent} />
        </button>
        
        <div style={styles.inputWrapper}>
          <input
            style={styles.input}
            value={inputText}
            onChange={handleInputChange}
            placeholder={uploading ? "Transmitting..." : "Write a message..."}
            disabled={uploading}
            maxLength={5000}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
        </div>

        {inputText.trim() ? (
          <button 
            className="tactile-btn"
            style={styles.sendBtn} 
            onClick={handleSend}
            title="Send"
            aria-label="Send message"
          >
            <Icon path={<><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></>} size={20} color="#fff" />
          </button>
        ) : (
          <button 
            className="tactile-btn"
            style={styles.attachBtn} 
            onClick={recording ? stopRecording : startRecording}
            title="Voice"
            aria-label="Record voice message"
          >
            <Icon 
              path={<><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></>} 
              size={22} 
              color={recording ? theme.crimson : theme.accent}
            />
          </button>
        )}
      </div>
      ) : (
      <div style={{...styles.inputBar, justifyContent: 'center', padding: '12px 16px'}}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: theme.inkMuted, fontStyle: 'italic' }}>
          This conversation has ended
        </span>
      </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileSelected} />

      {/* OVERLAYS */}
      {selectedMessage && menuAnchor && (
        <MessageActionMenu
          anchorRect={menuAnchor}
          isMine={String(selectedMessage.sender || selectedMessage.senderId) === String(myId)}
          isMedia={selectedMessage.type === 'image' || selectedMessage.type === 'audio'}
          onClose={handleCloseMenu}
          onReply={handleReply}
          onReact={handleReact}
          onCopy={handleCopy}
          onReport={handleReport}
          onDelete={handleDelete}
        />
      )}

      {showEmojiPicker && (
        <EmojiPicker
          anchorRect={emojiPickerAnchor}
          onSelect={handleEmojiSelect}
          onClose={() => { setShowEmojiPicker(false); setEmojiPickerAnchor(null); setSelectedMessage(null); }}
        />
      )}

      {showPhotoViewer && <PhotoViewer src={photoViewerUrl} onClose={() => setShowPhotoViewer(false)} />}

      {showSearch && (
        <SearchOverlay
          messages={messages}
          alignmentId={alignmentId}
          myId={myId}
          onClose={() => setShowSearch(false)}
          onJumpTo={handleSearchJump}
        />
      )}

      {showReportModal && (
        <ReportModal
          reportedUserId={otherUserId}
          onClose={() => setShowReportModal(false)}
          onReported={() => {
            setShowReportModal(false);
            toast.success('Report submitted. Thank you for keeping the community safe.');
          }}
        />
      )}

      {/* ACTION SHEET */}
      <AnimatePresence>
        {showActionSheet && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.sheetBackdrop} onClick={() => { setShowActionSheet(false); setPendingFile(null); }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} style={styles.sheet} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.border}` }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: '700', color: theme.ink }}>Attach Media</span>
                <button onClick={() => { setShowActionSheet(false); setPendingFile(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <Icon path={<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>} size={20} color={theme.inkMuted} />
                </button>
              </div>
              <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button className="tactile-btn" style={styles.sheetBtn} onClick={() => uploadAndSend('image')}>
                  <Icon path={<><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>} size={20} />
                  Send as Photograph
                </button>
                <button className="tactile-btn" style={styles.sheetBtn} onClick={() => uploadAndSend('audio')}>
                  <Icon path={<><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /></>} size={20} />
                  Send as Voice Note
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ARCHIVAL PROFILE SHEET */}
      <AnimatePresence>
        {showProfile && <ChatProfileView profile={matchUser} unavailable={otherUnavailable} onClose={() => setShowProfile(false)} />}
      </AnimatePresence>
    </div>
  );
};

/* ==================================================================
   STYLES
================================================================== */
const styles = {
  page: { position: 'fixed', inset: 0, backgroundColor: theme.paper, display: 'flex', flexDirection: 'column', zIndex: 50, overflow: 'hidden' },
  paperGrain: { position: 'absolute', inset: 0, backgroundImage: `url("${design?.texture?.grain || ''}")`, mixBlendMode: 'multiply', opacity: 0.85, pointerEvents: 'none', zIndex: 1 },
  
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px', boxSizing: 'border-box', padding: '0 24px', backgroundColor: theme.surface, borderBottom: `2px solid ${theme.borderDark}`, position: 'relative', zIndex: 10, contain: 'layout style' },
  backBtn: { background: theme.surface, border: `1px solid ${theme.border}`, color: theme.ink, borderRadius: design?.radius?.md || '8px', padding: '10px', marginRight: '4px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.15s ease', WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation', minWidth: '44px', minHeight: '44px' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1 },
  headerAvatar: { width: '44px', height: '44px', borderRadius: '12px', objectFit: 'cover', border: `2px solid ${theme.borderDark}` },
  onlineDot: { position: 'absolute', bottom: '2px', right: '2px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--success)', border: `2px solid ${theme.surface}` },
  headerInfo: { display: 'flex', flexDirection: 'column' },
  headerName: { fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: '700', color: theme.ink, lineHeight: 1.2 },
  headerStatus: { fontFamily: "'Inter', sans-serif", fontSize: '11px', color: theme.inkMuted, marginTop: '2px', letterSpacing: '0.5px' },
  iconBtn: { background: 'none', border: 'none', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: design?.radius?.md || '8px' },
  dropdownMenu: { position: 'absolute', top: '100%', right: 0, backgroundColor: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '12px', zIndex: 100, overflow: 'hidden', minWidth: '180px', marginTop: '8px' },
  dropdownItem: { display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '14px 16px', background: 'none', border: 'none', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: '500', color: theme.ink, cursor: 'pointer', textAlign: 'left' },
  tornEdgeBottom: { position: 'absolute', bottom: '-12px', left: 0, right: 0, height: '12px', backgroundColor: theme.surface, clipPath: 'polygon(0 0, 2% 60%, 4% 20%, 6% 80%, 8% 40%, 10% 90%, 12% 30%, 14% 70%, 16% 50%, 18% 100%, 20% 20%, 22% 80%, 24% 40%, 26% 90%, 28% 30%, 30% 70%, 32% 50%, 34% 100%, 36% 20%, 38% 80%, 40% 40%, 42% 90%, 44% 30%, 46% 70%, 48% 50%, 50% 100%, 52% 20%, 54% 80%, 56% 40%, 58% 90%, 60% 30%, 62% 70%, 64% 50%, 66% 100%, 68% 20%, 70% 80%, 72% 40%, 74% 90%, 76% 30%, 78% 70%, 80% 50%, 82% 100%, 84% 20%, 86% 80%, 88% 40%, 90% 90%, 92% 30%, 94% 70%, 96% 50%, 98% 100%, 100% 0)', zIndex: 11 },

  messages: { flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '24px 28px', position: 'relative', zIndex: 2, contain: 'content', willChange: 'scroll-position' },
  dateSeparator: { display: 'flex', justifyContent: 'center', margin: '24px 0 16px' },
  dateText: { fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: '700', color: theme.inkMuted, backgroundColor: theme.surfaceAlt, padding: '5px 14px', borderRadius: design?.radius?.sm || '4px', border: `1px solid ${theme.border}`, textTransform: 'uppercase', letterSpacing: '1px' },
  openingLetterCard: { margin: '8px 16px 16px', padding: '16px 20px', background: 'linear-gradient(135deg, var(--paper) 0%, var(--surface-alt) 100%)', border: `1px solid ${theme.border}`, borderRadius: '12px', textAlign: 'center' },
  openingLetterLabel: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: theme.accent, marginBottom: '8px' },
  openingLetterText: { fontFamily: "'Inter', sans-serif", fontSize: '15px', lineHeight: '1.5', color: theme.ink, fontStyle: 'italic' },
  openingLetterDate: { fontFamily: "'Inter', sans-serif", fontSize: '11px', color: theme.inkMuted, marginTop: '8px' },
  typing: { color: theme.inkMuted, padding: '0 16px 6px', display: 'flex', alignItems: 'center', gap: '4px' },
  typingDot: { display: 'inline-block', width: '6px', height: '6px', backgroundColor: theme.accent, borderRadius: '50%', animation: 'blink 1.4s infinite both' },
  
  scrollButton: {
    position: 'absolute',
    bottom: '140px',
    right: '24px',
    width: '44px',
    height: '44px',
    borderRadius: design?.radius?.md || '8px',
    backgroundColor: theme.surface,
    border: `2px solid ${theme.borderDark}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 20,
  },
  
inputBar: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 24px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', borderTop: `2px solid ${theme.borderDark}`, backgroundColor: theme.surface, position: 'relative', zIndex: 10, contain: 'layout style' },
  washiTape: { position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%) rotate(-1deg)', width: '60px', height: '16px', backgroundColor: 'var(--tape-90)', backdropFilter: 'blur(2px)', border: '1px solid var(--accent-20)', zIndex: 11 },
  attachBtn: { background: theme.surfaceAlt, border: `1.5px solid ${theme.border}`, borderRadius: design?.radius?.md || '8px', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  inputWrapper: { flex: 1, backgroundColor: theme.surfaceAlt, border: `1.5px solid ${theme.border}`, borderRadius: '24px', padding: '0 20px', display: 'flex', alignItems: 'center' },
  sendBtn: { width: '44px', height: '44px', borderRadius: design?.radius?.md || '8px', backgroundColor: theme.crimson, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },

  sheetBackdrop: { position: 'fixed', inset: 0, backgroundColor: 'rgba(20,15,10,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', zIndex: 120 },
  sheet: { backgroundColor: theme.paper, backgroundImage: `url("${design?.texture?.grain || ''}")`, width: '100%', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', boxShadow: '0 -12px 32px var(--wm-20)' },
  sheetBtn: { display: 'flex', alignItems: 'center', gap: '12px', width: '100%', background: theme.surface, border: `1.5px solid ${theme.borderDark}`, color: theme.ink, fontFamily: "'Inter', sans-serif", fontWeight: '600', padding: '16px', borderRadius: '12px', fontSize: '14px', cursor: 'pointer' },
};

export default Chat;
```

