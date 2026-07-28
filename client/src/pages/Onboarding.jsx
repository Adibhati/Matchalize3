import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useScroll, AnimatePresence } from 'framer-motion';
import { useAppConfig } from '../utils/AppConfigContext';
import { useAuth } from '../utils/AuthContext';
import { api } from '../utils/api';
import { toast } from '../utils/toast';
import { triggerHaptic } from '../utils/haptics';
import { theme as design } from '../utils/theme';
import { 
  Check, X, Camera, ChevronDown, ChevronRight, Lock, RotateCcw, 
  Fingerprint, MapPin, MessageSquare, Sliders, Layers, PenTool, 
  CheckCircle2, LogOut, Edit3, Sparkle, UserCheck, Award, Calendar 
} from 'lucide-react';

const theme = {
  paper: '#fdfbf7',
  surface: '#ffffff',
  surfaceAlt: '#f4f1ea', 
  border: '#e0d8c8',
  borderDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  success: '#2e7d32',
  shadowWarm: 'rgba(139, 69, 19, 0.12)',
};

const TYPEWRITER_FONT = "'Special Elite', 'Courier New', monospace";
const HEADER_FONT = design?.font?.heading || "'Playfair Display', serif";
const LABEL_FONT = design?.font?.body || "'Inter', sans-serif";

const CHAPTER_NAMES = [
  "01: Title",
  "02: Vitals",
  "03: Coordinates",
  "04: Portrait",
  "05: Whispers",
  "06: Parameters",
  "07: Alignment",
  "08: Review"
];

const TORN_EDGE_CLIP = 'polygon(0% 100%, 1.56% 18%, 3.12% 4%, 4.69% 22%, 6.25% 8%, 7.81% 16%, 9.38% 2%, 10.94% 24%, 12.50% 6%, 14.06% 14%, 15.62% 10%, 17.19% 20%, 18.75% 0%, 20.31% 18%, 21.88% 4%, 23.44% 22%, 25.00% 8%, 26.56% 16%, 28.12% 2%, 29.69% 24%, 31.25% 6%, 32.81% 14%, 34.38% 10%, 35.94% 20%, 37.50% 0%, 39.06% 18%, 40.62% 4%, 42.19% 22%, 43.75% 8%, 45.31% 16%, 46.88% 2%, 48.44% 24%, 50.00% 6%, 51.56% 14%, 53.12% 10%, 54.69% 20%, 56.25% 0%, 57.81% 18%, 59.38% 4%, 60.94% 22%, 62.50% 8%, 64.06% 16%, 65.62% 2%, 67.19% 24%, 68.75% 6%, 70.31% 14%, 71.88% 10%, 73.44% 20%, 75.00% 0%, 76.56% 18%, 78.12% 4%, 79.69% 22%, 81.25% 8%, 82.81% 16%, 84.38% 2%, 85.94% 24%, 87.50% 6%, 89.06% 14%, 90.62% 10%, 92.19% 20%, 93.75% 0%, 95.31% 18%, 96.88% 4%, 98.44% 22%, 100.00% 100%)';
const TILT = { prompt_0: '1.4deg', photo_1: '-2.2deg', photo_2: '1.8deg', prompt_1: '-1.1deg', prompt_2: '0.5deg', photo_3: '-0.7deg' };

/* ==================================================================
   ENGINE 1: INTERACTIVE SCRUBBING CHAPTER INDEX
================================================================== */
const ChapterIndex = ({ containerRef, completionStates, activeStepIdx = 0 }) => {
  const [scrubbingIdx, setScrubbingIdx] = useState(null);
  const trackRef = useRef(null);

  const handleTouchScrub = (e) => {
    if (!trackRef.current) return;
    const touch = e.touches ? e.touches[0] : e;
    const rect = trackRef.current.getBoundingClientRect();
    const relativeY = Math.max(0, Math.min(touch.clientY - rect.top, rect.height));
    const percentage = relativeY / rect.height;
    const targetIdx = Math.min(
      Math.floor(percentage * completionStates.length),
      completionStates.length - 1
    );
    
    if (targetIdx !== scrubbingIdx) {
      triggerHaptic('light');
      setScrubbingIdx(targetIdx);
    }
  };

  const handleScrubEnd = () => {
    if (scrubbingIdx !== null && containerRef.current) {
      triggerHaptic('medium');
      const pages = containerRef.current.querySelectorAll('[data-snap-page]');
      if (pages[scrubbingIdx]) {
        pages[scrubbingIdx].scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    setScrubbingIdx(null);
  };

  const currentIdx = scrubbingIdx !== null ? scrubbingIdx : activeStepIdx;
  const lineHeight = `${(currentIdx / (completionStates.length - 1)) * 100}%`;

  return (
    <div 
      ref={trackRef}
      onTouchStart={handleTouchScrub}
      onTouchMove={handleTouchScrub}
      onTouchEnd={handleScrubEnd}
      onMouseDown={handleTouchScrub}
      onMouseMove={(e) => e.buttons === 1 && handleTouchScrub(e)}
      onMouseUp={handleScrubEnd}
      onContextMenu={(e) => e.preventDefault()}
      style={{ 
        position: 'fixed', left: '12px', top: '15%', bottom: '15%', width: '24px', 
        zIndex: 90, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', 
        alignItems: 'center', cursor: 'pointer', touchAction: 'none' 
      }}
    >
      <div style={{ position: 'absolute', top: 0, bottom: 0, width: '2px', backgroundColor: 'rgba(139, 69, 19, 0.15)', zIndex: 1 }} />
      
      <motion.div 
        animate={{ height: lineHeight }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        style={{ position: 'absolute', top: 0, width: '2px', backgroundColor: theme.crimson, boxShadow: `0 0 8px ${theme.crimson}`, zIndex: 2 }} 
      />

      <AnimatePresence>
        {scrubbingIdx !== null && (
          <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.8 }}
            animate={{ opacity: 1, x: 20, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.8 }}
            style={{
              position: 'absolute',
              top: `${(scrubbingIdx / (completionStates.length - 1)) * 100}%`,
              left: '12px',
              transform: 'translateY(-50%)',
              backgroundColor: theme.ink,
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '8px',
              fontFamily: LABEL_FONT,
              fontSize: '11px',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              zIndex: 100
            }}
          >
            {CHAPTER_NAMES[scrubbingIdx]}
          </motion.div>
        )}
      </AnimatePresence>

      {completionStates.map((isComplete, idx) => {
        const isActive = idx === currentIdx;
        return (
          <motion.div 
            key={idx}
            animate={{ 
              backgroundColor: isActive ? theme.crimson : isComplete ? theme.accent : theme.surfaceAlt, 
              borderColor: isActive ? theme.crimson : isComplete ? theme.accent : theme.borderDark, 
              scale: isActive ? 1.4 : isComplete ? 1.1 : 0.9 
            }}
            transition={{ duration: 0.2 }}
            style={{ width: '10px', height: '10px', borderRadius: '50%', zIndex: 3, borderWidth: '2px', borderStyle: 'solid' }} 
          />
        );
      })}
    </div>
  );
};

/* ==================================================================
   ENGINE 2: FLUID SNAP PAGE (PREVENTS SUBMERGED CONTENT & SYMMETRY)
================================================================== */
const SnapPage = ({ children, equalPad = false }) => {
  return (
    <div 
      data-snap-page
      style={{ 
        minHeight: '100dvh', width: '100%', scrollSnapAlign: 'start', scrollSnapStop: 'always', 
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', position: 'relative', 
        padding: `max(70px, env(safe-area-inset-top)) ${equalPad ? '16px' : '24px'} max(50px, env(safe-area-inset-bottom)) ${equalPad ? '16px' : '44px'}`,
        boxSizing: 'border-box'
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ amount: 0.2 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{ width: '100%', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'flex-start' }}
      >
        {children}
      </motion.div>
    </div>
  );
};

/* ==================================================================
   SUB-COMPONENTS FOR STEP 8 PROFILE PREVIEW (100% PARITY)
================================================================== */
const PreviewPhotoCorners = React.memo(() => (
  <>
    <span aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, width: 24, height: 24, background: theme.surface, clipPath: 'polygon(0 0, 100% 0, 0 100%)', zIndex: 3, filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.15))' }} />
    <span aria-hidden="true" style={{ position: 'absolute', top: 0, right: 0, width: 24, height: 24, background: theme.surface, clipPath: 'polygon(100% 0, 0 0, 100% 100%)', zIndex: 3, filter: 'drop-shadow(-1px 1px 2px rgba(0,0,0,0.15))' }} />
    <span aria-hidden="true" style={{ position: 'absolute', bottom: 0, left: 0, width: 24, height: 24, background: theme.surface, clipPath: 'polygon(0 100%, 100% 100%, 0 0)', zIndex: 3, filter: 'drop-shadow(1px -1px 2px rgba(0,0,0,0.15))' }} />
    <span aria-hidden="true" style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, background: theme.surface, clipPath: 'polygon(100% 100%, 0 100%, 100% 0)', zIndex: 3, filter: 'drop-shadow(-1px -1px 2px rgba(0,0,0,0.15))' }} />
  </>
));

const PreviewMountedPhoto = React.memo(({ src, alt, tilt, aspect }) => (
  <div style={{ '--tilt': tilt, transform: 'rotate(var(--tilt, 0deg))', position: 'relative', width: '100%', aspectRatio: aspect || '4 / 5', borderRadius: '6px', border: `6px solid ${theme.surface}`, backgroundColor: theme.surfaceAlt, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
    <img src={src} alt={alt} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    <PreviewPhotoCorners />
  </div>
));

const PreviewIndexCard = ({ children, tilt, tape = 'center' }) => {
  const getTapeConfig = () => {
    const base = { position: 'absolute', top: '-10px', width: '36px', height: '16px', backgroundColor: 'rgba(224, 216, 200, 0.95)', border: '1px solid rgba(139,69,19,0.2)', zIndex: 5 };
    if (tape === 'top-right') return { ...base, right: '16px', transform: 'rotate(4deg)' };
    if (tape === 'top-left') return { ...base, left: '16px', transform: 'rotate(-4deg)' };
    return { ...base, left: '50%', transform: 'translateX(-50%) rotate(-1deg)' };
  };

  return (
    <div style={{ '--tilt': tilt, transform: 'rotate(var(--tilt, 0deg))', backgroundColor: theme.surface, backgroundImage: `linear-gradient(${theme.accent}11 1px, transparent 1px)`, backgroundSize: '100% 24px', border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '24px 16px 20px', minHeight: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <span aria-hidden="true" style={getTapeConfig()} />
      <span aria-hidden="true" style={{ fontFamily: HEADER_FONT, fontSize: '32px', lineHeight: 0.5, opacity: 0.4, marginBottom: '8px', display: 'block', color: theme.accent }}>“</span>
      <p style={{ fontFamily: HEADER_FONT, fontSize: '15px', fontStyle: 'italic', color: theme.ink, margin: '0 0 4px 0', lineHeight: 1.45, textAlign: 'center', fontWeight: 600, wordBreak: 'break-word' }}>{children}</p>
    </div>
  );
};

/* ==================================================================
   MAIN ONBOARDING COMPONENT
================================================================== */
const Onboarding = ({ onComplete }) => {
  const config = useAppConfig();
  const { logout } = useAuth();
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '', dob: '', gender: '', pronouns: '', branch: '', year: '', hostel: '',
    photos: [], bio: '', intent: [], interestedIn: [], interests: [], compatAnswers: [],
    prompts: [{ question: '' }, { question: '' }, { question: '' }],
  });
  
  const [uploadingSlot, setUploadingSlot] = useState(null);
  const [promptPickerSlot, setPromptPickerSlot] = useState(null);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showEraModal, setShowEraModal] = useState(false);
  const [customPromptText, setCustomPromptText] = useState('');
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [cardLock, setCardLock] = useState(false); 
  const [inquiriesReopened, setInquiriesReopened] = useState(false);
  const inquiryRefs = useRef([]);

  const dayRef = useRef(null); const monthRef = useRef(null); const yearRef = useRef(null);

  const isAnyModalOpen = showBranchModal || showEraModal || promptPickerSlot !== null;

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const pages = container.querySelectorAll('[data-snap-page]');
      const scrollPos = container.scrollTop + (window.innerHeight / 3);
      pages.forEach((page, idx) => {
        if (scrollPos >= page.offsetTop && scrollPos < page.offsetTop + page.offsetHeight) {
          setActiveStepIdx(idx);
        }
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    api.get('/users/onboarding/resume').then(res => {
      if (res.data && Object.keys(res.data).length > 0) {
        const saved = res.data;
        setFormData(prev => ({
          ...prev,
          ...saved,
          photos: Array.isArray(saved.photos) ? saved.photos : prev.photos,
          intent: Array.isArray(saved.intent) ? saved.intent : prev.intent,
          interestedIn: Array.isArray(saved.interestedIn) ? saved.interestedIn : prev.interestedIn,
          interests: Array.isArray(saved.interests) ? saved.interests : prev.interests,
          compatAnswers: Array.isArray(saved.compatAnswers) ? saved.compatAnswers : prev.compatAnswers,
          prompts: (Array.isArray(saved.prompts) && saved.prompts.length >= 3) ? saved.prompts : prev.prompts
        }));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const saveTimer = setTimeout(() => {
      if (formData.name || formData.gender || formData.branch) {
        api.put('/users/onboarding/save', { step: activeStepIdx + 1, data: formData }).catch(() => {});
      }
    }, 1000);
    return () => clearTimeout(saveTimer);
  }, [formData, activeStepIdx]);

  const updateField = (field, val) => setFormData(prev => ({ ...prev, [field]: val }));
  
  const toggleArrayItem = (field, item, max = null) => {
    setFormData(prev => {
      const arr = prev[field] || [];
      const isSelected = arr.includes(item);
      if (isSelected) return { ...prev, [field]: arr.filter(i => i !== item) };
      if (max && arr.length >= max) {
        triggerHaptic('heavy'); 
        return prev;
      }
      return { ...prev, [field]: [...arr, item] };
    });
    triggerHaptic('light');
  };

  const triggerUploadClick = (slot) => {
    if (uploadingSlot !== null) { triggerHaptic('heavy'); return; }
    triggerHaptic('light');
    setUploadingSlot(slot);
    fileInputRef.current?.click();

    const handleFocus = () => {
      window.removeEventListener('focus', handleFocus);
      setTimeout(() => {
        if (!fileInputRef.current?.files?.length) setUploadingSlot(null);
      }, 300);
    };
    window.addEventListener('focus', handleFocus);
  };

  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0 || uploadingSlot === null) { setUploadingSlot(null); return; }
    triggerHaptic('medium');
    try {
      const { url } = await api.upload(files[0]);
      const updated = [...formData.photos];
      updated[uploadingSlot] = url;
      updateField('photos', updated);
      triggerHaptic('success');
    } catch (err) { 
      toast.error('The emulsion was corrupted. Try a smaller image.'); 
      triggerHaptic('heavy');
    } finally { setUploadingSlot(null); e.target.value = ''; }
  };

  const handleRemovePhoto = (slot, e) => {
    e.stopPropagation();
    if (uploadingSlot !== null) return; 
    const updated = [...formData.photos];
    updated[slot] = '';
    updateField('photos', updated);
    triggerHaptic('light');
  };

  const dobParts = (formData.dob || '--').split('-');
  const dobY = dobParts[0] || ''; const dobM = dobParts[1] || ''; const dobD = dobParts[2] || '';
  
  const handleDobChange = (part, val) => {
    const num = val.replace(/\D/g, ''); 
    let y = dobY; let m = dobM; let d = dobD;
    if (part === 'd') { d = num.slice(0, 2); if (d.length === 2) { if (parseInt(d) > 31) d = '31'; if (parseInt(d) === 0) d = '01'; monthRef.current?.focus(); } }
    if (part === 'm') { m = num.slice(0, 2); if (m.length === 2) { if (parseInt(m) > 12) m = '12'; if (parseInt(m) === 0) m = '01'; yearRef.current?.focus(); } }
    if (part === 'y') { y = num.slice(0, 4); }
    updateField('dob', `${y}-${m}-${d}`);
  };

  const handleDobKeyDown = (part, e) => {
    if (e.key === 'Backspace') {
      if (part === 'y' && !dobY) monthRef.current?.focus();
      if (part === 'm' && !dobM) dayRef.current?.focus();
    }
  };
  
  const isDateComplete = dobY.length === 4 && dobM.length === 2 && dobD.length === 2;
  const age = isDateComplete ? (() => {
    const today = new Date(); const birth = new Date(`${dobY}-${dobM}-${dobD}`);
    let a = today.getFullYear() - birth.getFullYear();
    const mOffset = today.getMonth() - birth.getMonth();
    return (mOffset < 0 || (mOffset === 0 && today.getDate() < birth.getDate())) ? a - 1 : a;
  })() : null;

  const isVitalsComplete = !!formData.name.trim() && age >= 18 && age <= 40;
  const isCoordsComplete = !!formData.gender && !!formData.branch && !!formData.year && formData.interestedIn.length > 0;
  const isPortraitComplete = !!formData.photos[0] && !!formData.bio.trim() && formData.bio.length <= 160;
  const isWhispersComplete = formData.prompts.filter(p => p?.question?.trim()).length >= 3 && formData.photos.filter((_, i) => i > 0 && formData.photos[i]).length >= 1;
  const isParamsComplete = formData.intent.length > 0;
  const isAlignComplete = formData.compatAnswers.length >= (config.compatQuestions?.length || 7);
  const isFullyComplete = isVitalsComplete && isCoordsComplete && isPortraitComplete && isWhispersComplete && isParamsComplete && isAlignComplete && uploadingSlot === null;

  const missingFields = [];
  if (!isVitalsComplete) missingFields.push('Vitals');
  if (!isCoordsComplete) missingFields.push('Coordinates');
  if (!isPortraitComplete) missingFields.push('About You');
  if (!isWhispersComplete) missingFields.push('Whispers');
  if (!isParamsComplete) missingFields.push('Parameters');
  if (!isAlignComplete) missingFields.push('Alignment');

  const completionStates = [true, isVitalsComplete, isCoordsComplete, isPortraitComplete, isWhispersComplete, isParamsComplete, isAlignComplete, isFullyComplete];

  const handleAffixSeal = async () => {
    if (!isFullyComplete || uploadingSlot !== null) { triggerHaptic('heavy'); return; }
    triggerHaptic('heavy');
    try {
      const res = await api.post('/users/setup', { ...formData, age });
      await api.delete('/users/onboarding/clear').catch(() => {});

      const storedUser = JSON.parse(localStorage.getItem('matchalize_user') || '{}');
      const updatedUser = res?.user || res?.data?.user || res || {
        ...storedUser,
        isSetup: true,
        isOnboarded: true,
        profileCompleted: true,
        onboardingCompleted: true
      };
      
      localStorage.setItem('matchalize_user', JSON.stringify(updatedUser));
      onComplete();
    } catch (err) { toast.error(err.message || 'The seal failed to set. Please try again.'); }
  };

  const styles = {
    headerContainer: { display: 'flex', flexDirection: 'column', marginBottom: '24px' },
    icon: { marginBottom: '8px', color: theme.accent },
    header: { fontFamily: HEADER_FONT, fontSize: '32px', color: theme.ink, fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-0.02em', lineHeight: 1.1 },
    subtitle: { fontFamily: LABEL_FONT, fontSize: '15px', color: theme.inkMuted, margin: 0, lineHeight: 1.4, fontWeight: 500 },
    label: { display: 'block', fontSize: '11px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: theme.accent, marginBottom: '8px', fontFamily: LABEL_FONT },
    input: { width: '100%', backgroundColor: 'transparent', border: 'none', borderBottom: `2px solid ${theme.ink}`, padding: '10px 4px', fontSize: '20px', color: theme.ink, fontFamily: TYPEWRITER_FONT, outline: 'none', borderRadius: 0 },
    textarea: { width: '100%', backgroundColor: 'transparent', border: `1px dashed ${theme.ink}`, borderRadius: '12px', padding: '14px', fontSize: '16px', color: theme.ink, fontFamily: TYPEWRITER_FONT, outline: 'none', resize: 'none', lineHeight: '1.5', wordBreak: 'break-word', whiteSpace: 'pre-wrap' },
    tag: (isActive) => ({
      padding: '14px 18px', minHeight: '48px', borderRadius: '12px',
      border: isActive ? `2px solid ${theme.crimson}` : `1px solid ${theme.borderDark}`,
      backgroundColor: isActive ? 'rgba(139, 26, 26, 0.08)' : theme.surface,
      color: isActive ? theme.crimson : theme.ink,
      fontFamily: TYPEWRITER_FONT, fontSize: '14px', fontWeight: isActive ? '700' : '500',
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: isActive ? '0 4px 12px rgba(139, 26, 26, 0.15)' : '0 2px 4px rgba(0,0,0,0.02)',
      touchAction: 'manipulation'
    }),
  };

  const getIconForInterest = (interest) => {
    const key = Object.keys(config.interestIcons || {}).find(k => interest.toLowerCase().includes(k));
    if (key) return config.interestIcons[key];
    const fallbacks = config.interestIconFallbacks || ['star'];
    let hash = 0;
    for (let i = 0; i < interest.length; i++) hash = interest.charCodeAt(i) + ((hash << 5) - hash);
    return fallbacks[Math.abs(hash) % fallbacks.length];
  };

  // ✅ STEP 1 & 2 FIX: Standardized 180x240px Polaroid Dimensions
  const renderPhotoSlot = (slot, label, isStandard = false) => {
    const url = formData.photos[slot];
    const isDeveloping = uploadingSlot === slot;
    const dimensions = isStandard ? { width: '180px', height: '240px', flexShrink: 0 } : { aspectRatio: '3/4', width: '100%', maxWidth: '200px' };
    
    if (url && !isDeveloping) {
      return (
        <div className="tactile-btn" style={{ borderRadius: '12px', overflow: 'hidden', position: 'relative', cursor: 'pointer', border: `6px solid #fff`, boxShadow: `0 10px 24px ${theme.shadowWarm}`, ...dimensions }} onClick={() => triggerUploadClick(slot)}>
          <img src={url} alt={label} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div aria-hidden="true" style={{ position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%) rotate(-2deg)', width: '40px', height: '14px', backgroundColor: 'rgba(224, 216, 200, 0.95)', border: `1px solid rgba(139, 69, 19, 0.2)` }} />
          <button onClick={(e) => handleRemovePhoto(slot, e)} style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.95)', border: 'none', color: theme.crimson, fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
      );
    }
    return (
      <button className="tactile-btn" onClick={() => triggerUploadClick(slot)} disabled={uploadingSlot !== null} style={{ ...dimensions, borderRadius: '12px', border: `1px dashed ${isDeveloping ? theme.crimson : theme.ink}`, backgroundColor: isDeveloping ? 'rgba(139, 26, 26, 0.05)' : 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: uploadingSlot !== null ? 'not-allowed' : 'pointer', fontFamily: TYPEWRITER_FONT, fontSize: '14px', color: isDeveloping ? theme.crimson : theme.ink, fontWeight: 600, opacity: (uploadingSlot !== null && !isDeveloping) ? 0.4 : 1 }}>
        {isDeveloping ? <span style={{ animation: 'pulse 1.5s infinite' }}>Developing...</span> : <><Camera size={28} style={{ opacity: 0.6 }} /> <span>{label}</span></>}
      </button>
    );
  };

  return (
    <div 
      ref={scrollRef} 
      style={{ 
        height: '100dvh', width: '100%', overflowY: isAnyModalOpen ? 'hidden' : 'auto', 
        overflowX: 'hidden', backgroundColor: theme.surfaceAlt, position: 'relative', 
        scrollSnapType: 'y mandatory', scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' 
      }}
    >
      {/* EXHAUSTIVE MOBILE HARDENING */}
      <style>{`
        ::-webkit-scrollbar { display: none; }
        * { 
          scrollbar-width: none; 
          -webkit-tap-highlight-color: transparent; 
          -webkit-touch-callout: none !important;
          -webkit-user-select: none;
          user-select: none;
          -webkit-user-drag: none !important;
        }
        input, textarea {
          -webkit-user-select: auto !important;
          user-select: auto !important;
        }
        img {
          pointer-events: none;
        }
        .tactile-btn { transition: transform 0.15s ease-out, box-shadow 0.15s ease-out; }
        @media (hover: hover) { .tactile-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(139, 26, 26, 0.12); } }
        .tactile-btn:active:not(:disabled) { transform: scale(0.96) !important; transition: transform 0.05s ease-out !important; }
        ::placeholder { color: ${theme.inkMuted}; opacity: 0.5; font-family: ${TYPEWRITER_FONT}; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      {/* Background Texture */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, backgroundImage: `url("${design?.texture?.grain || ''}")`, mixBlendMode: 'multiply', opacity: 0.6, pointerEvents: 'none', zIndex: 1 }} />
      
      {/* Interactive Scrubbing Side Index */}
      {activeStepIdx !== 7 && (
        <ChapterIndex containerRef={scrollRef} completionStates={completionStates} activeStepIdx={activeStepIdx} />
      )}
      <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handlePhotoSelect} />

      {/* SUBTLE LOG OUT BUTTON */}
      <button
        onClick={() => {
          if (window.confirm('Log out and return to the start screen? Incomplete progress will be saved in your draft.')) {
            triggerHaptic('medium');
            logout();
          }
        }}
        style={{
          position: 'fixed', top: 'max(20px, env(safe-area-inset-top))', right: '20px', zIndex: 100,
          background: 'rgba(253, 251, 247, 0.9)', backdropFilter: 'blur(6px)', border: `1px solid ${theme.borderDark}`,
          borderRadius: '20px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px',
          color: '#8c8275', fontFamily: LABEL_FONT, fontSize: '11px', fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
        }}
      >
        <LogOut size={13} color="#8c8275" /> Log Out
      </button>

      {/* PAGE 0: THE INTRO */}
      <SnapPage>
        <div style={styles.headerContainer}>
          <PenTool size={28} style={styles.icon} strokeWidth={1.5} />
          <h1 style={{ fontFamily: HEADER_FONT, fontSize: '38px', color: theme.ink, fontWeight: 900, margin: '0 0 10px 0', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Volume II:<br/>The Dossier.</h1>
          <p style={styles.subtitle}>Transcribe your story below. Scroll to lock the next page.</p>
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px', color: theme.crimson, fontFamily: LABEL_FONT, fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', animation: 'pulse 2s infinite' }}>
          <ChevronDown size={16} /> Swipe Up
        </div>
      </SnapPage>

      {/* PAGE 1: VITALS */}
      <SnapPage>
        <div style={styles.headerContainer}>
          <Fingerprint size={24} style={styles.icon} strokeWidth={1.5} />
          <h3 style={styles.header}>The Vitals.</h3>
          <p style={styles.subtitle}>What shall the Archives call you?</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div>
            <label style={styles.label}>Given Name</label>
            <input style={styles.input} type="text" value={formData.name} onChange={e => updateField('name', e.target.value)} placeholder="e.g. Arjun" spellCheck="false" autoComplete="off" />
          </div>
          <div>
            <label style={styles.label}>Date of Birth</label>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
              <div style={{ flex: 1 }}><input ref={dayRef} style={{...styles.input, textAlign: 'center'}} placeholder="DD" value={dobD} onChange={e => handleDobChange('d', e.target.value)} onKeyDown={e => handleDobKeyDown('d', e)} type="tel" /></div>
              <span style={{ fontSize: '20px', color: theme.borderDark, fontFamily: TYPEWRITER_FONT, paddingBottom: '6px' }}>/</span>
              <div style={{ flex: 1 }}><input ref={monthRef} style={{...styles.input, textAlign: 'center'}} placeholder="MM" value={dobM} onChange={e => handleDobChange('m', e.target.value)} onKeyDown={e => handleDobKeyDown('m', e)} type="tel" /></div>
              <span style={{ fontSize: '20px', color: theme.borderDark, fontFamily: TYPEWRITER_FONT, paddingBottom: '6px' }}>/</span>
              <div style={{ flex: 1.5 }}><input ref={yearRef} style={{...styles.input, textAlign: 'center'}} placeholder="YYYY" value={dobY} onChange={e => handleDobChange('y', e.target.value)} onKeyDown={e => handleDobKeyDown('y', e)} type="tel" /></div>
            </div>
          </div>
        </div>
      </SnapPage>

      {/* PAGE 2: COORDINATES & SHOW ME */}
      <SnapPage>
        <div style={styles.headerContainer}>
          <MapPin size={24} style={styles.icon} strokeWidth={1.5} />
          <h3 style={styles.header}>The Coordinates.</h3>
          <p style={styles.subtitle}>Define your identity and dating preferences.</p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* My Identity */}
          <div style={{ backgroundColor: theme.surface, padding: '16px', borderRadius: '16px', border: `1px solid ${theme.border}` }}>
            <label style={styles.label}>My Identity</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {['Male', 'Female', 'Non-binary', 'Other'].map(g => (
                <button key={g} className="tactile-btn" onClick={() => updateField('gender', g)} style={styles.tag(formData.gender === g)}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Show Me */}
          <div style={{ backgroundColor: theme.surface, padding: '16px', borderRadius: '16px', border: `1px solid ${theme.border}` }}>
            <label style={styles.label}>Show Me (Interested In)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {['Male', 'Female', 'Non-binary', 'Everyone'].map(pref => (
                <button key={pref} className="tactile-btn" onClick={() => toggleArrayItem('interestedIn', pref)} style={styles.tag(formData.interestedIn.includes(pref))}>
                  {pref}
                </button>
              ))}
            </div>
          </div>

          {/* Academic Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={styles.label}>Branch / Discipline</label>
              <button 
                type="button"
                className="tactile-btn"
                onClick={() => setShowBranchModal(true)}
                style={{ width: '100%', textAlign: 'left', padding: '12px 4px', border: 'none', borderBottom: `2px solid ${theme.ink}`, background: 'transparent', fontFamily: TYPEWRITER_FONT, fontSize: '18px', color: formData.branch ? theme.ink : theme.inkMuted, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>{formData.branch || "Select branch..."}</span>
                <ChevronDown size={18} color={theme.accent} />
              </button>
            </div>
            <div>
              <label style={styles.label}>Era (Graduation Year)</label>
              <button 
                type="button"
                className="tactile-btn"
                onClick={() => setShowEraModal(true)}
                style={{ width: '100%', textAlign: 'left', padding: '12px 4px', border: 'none', borderBottom: `2px solid ${theme.ink}`, background: 'transparent', fontFamily: TYPEWRITER_FONT, fontSize: '18px', color: formData.year ? theme.ink : theme.inkMuted, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>{formData.year || "Select era..."}</span>
                <ChevronDown size={18} color={theme.accent} />
              </button>
            </div>
            <div>
              <label style={styles.label}>Hostel / Quarters (Optional)</label>
              <input style={styles.input} type="text" value={formData.hostel} onChange={e => updateField('hostel', e.target.value)} placeholder="e.g. Hostel 4" spellCheck="false" autoComplete="off" />
            </div>
          </div>
        </div>
      </SnapPage>

      {/* ✅ STEP 1 FIX: TOP-TO-BOTTOM PORTRAIT STACK WITH 50% LARGER POLAROID */}
      <SnapPage>
        <div style={styles.headerContainer}>
          <Camera size={24} style={styles.icon} strokeWidth={1.5} />
          <h3 style={styles.header}>The Portrait.</h3>
          <p style={styles.subtitle}>Draft the foreword to your story.</p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', margin: 'auto 0', width: '100%' }}>
          {renderPhotoSlot(0, 'Primary Photo', true)}
          <div style={{ width: '100%', position: 'relative' }}>
            <label style={styles.label}>About You (Max 160 Chars)</label>
            <textarea 
              style={{...styles.textarea, height: '120px', paddingBottom: '28px', wordBreak: 'break-word', whiteSpace: 'pre-wrap'}} 
              placeholder="What drives you? What are your passions?" 
              value={formData.bio} 
              maxLength={160}
              onChange={e => updateField('bio', e.target.value)} 
              spellCheck="false" 
            />
            <div style={{ position: 'absolute', bottom: '10px', right: '12px', fontSize: '11px', color: theme.inkMuted, fontFamily: TYPEWRITER_FONT }}>
              {formData.bio.length}/160
            </div>
          </div>
        </div>
      </SnapPage>

      {/* ✅ STEP 2 FIX: DYNAMIC WHISPER EXPANSION WITH EXACT POLAROID MATCHING */}
      <SnapPage>
        <div style={styles.headerContainer}>
          <MessageSquare size={24} style={styles.icon} strokeWidth={1.5} />
          <h3 style={styles.header}>The Whispers.</h3>
          <p style={styles.subtitle}>Swipe left to pair a thought with a memory.</p>
        </div>
        
        <div style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', gap: '16px', margin: '0 -24px 0 -44px', padding: '0 24px 10px 44px', touchAction: 'pan-x', overscrollBehavior: 'contain', alignItems: 'center' }}>
          {[0, 1, 2].map((slot) => {
            const prompt = formData.prompts[slot];
            const hasQuestion = prompt?.question;
            return (
              <div key={slot} style={{ minWidth: '85%', minHeight: hasQuestion ? '380px' : '160px', height: hasQuestion ? 'auto' : '160px', scrollSnapAlign: 'center', borderRadius: '16px', padding: '20px', border: `1px dashed ${theme.ink}`, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: theme.paper, transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
                <label style={styles.label}>Whisper #{slot + 1}</label>
                {hasQuestion ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                    <span style={{ fontFamily: TYPEWRITER_FONT, fontSize: '15px', fontWeight: '600', color: theme.ink, lineHeight: 1.4, wordBreak: 'break-word' }}>"{prompt.question}"</span>
                    <button className="tactile-btn" onClick={() => setPromptPickerSlot(slot)} style={{ background: 'none', border: 'none', color: theme.accent, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', padding: 0, textAlign: 'left', fontFamily: LABEL_FONT }}>Change Whisper</button>
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center', paddingTop: '8px' }}>
                      {renderPhotoSlot(slot + 1, 'Attach Polaroid', true)}
                    </div>
                  </div>
                ) : (
                  <button className="tactile-btn" onClick={() => setPromptPickerSlot(slot)} style={{ background: 'none', border: `1px dashed ${theme.borderDark}`, borderRadius: '12px', padding: '20px', width: '100%', height: '100%', fontFamily: TYPEWRITER_FONT, fontSize: '14px', color: theme.ink, fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    + Select a Whisper
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
          <ChevronRight size={16} color={theme.inkMuted} style={{ animation: 'pulse 2s infinite' }} />
        </div>
      </SnapPage>

      {/* PAGE 5: PARAMETERS */}
      <SnapPage>
        <div style={styles.headerContainer}>
          <Sliders size={24} style={styles.icon} strokeWidth={1.5} />
          <h3 style={styles.header}>The Parameters.</h3>
          <p style={styles.subtitle}>What brings you to these pages?</p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label style={styles.label}>Seeking Intent</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {['Dating', 'Friends', 'Study Buddy'].map(i => (
                <button className="tactile-btn" key={i} onClick={() => toggleArrayItem('intent', i)} style={styles.tag(formData.intent.includes(i))}>{i}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={styles.label}>Recorded Curiosities (Max 6)</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {config.interests?.map(i => (
                <button className="tactile-btn" key={i} onClick={() => toggleArrayItem('interests', i, 6)} style={{...styles.tag(formData.interests.includes(i)), padding: '10px 14px', minHeight: '42px', fontSize: '13px'}}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '6px' }}>{getIconForInterest(i)}</span>
                  {i}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SnapPage>

      {/* ✅ STEP 3 FIX: ALIGNMENT DATA WIPE & COMPACT SEALED CARD */}
      <SnapPage>
        <div style={styles.headerContainer}>
          <Layers size={24} style={styles.icon} strokeWidth={1.5} />
          <h3 style={styles.header}>The Alignment.</h3>
          <p style={styles.subtitle}>Swipe left to seal your answers.</p>
        </div>
        
        <div style={{ position: 'relative', width: '100%', flex: 1, minHeight: '340px', display: 'flex', flexDirection: 'column' }}>
          {(!config.compatQuestions || config.compatQuestions.length === 0) ? (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `1px dashed ${theme.ink}`, borderRadius: '16px' }}>
               <p style={{ fontFamily: TYPEWRITER_FONT, fontSize: '16px', color: theme.inkMuted }}>Consulting Archives...</p>
            </div>
          ) : (isAlignComplete && !inquiriesReopened) ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              style={{ 
                margin: 'auto 0', padding: '36px 24px', display: 'flex', flexDirection: 'column', 
                alignItems: 'center', justifyContent: 'center', border: `1px dashed ${theme.ink}`, 
                borderRadius: '16px', backgroundColor: theme.surface, boxShadow: `0 8px 24px ${theme.shadowWarm}` 
              }}
            >
              <Lock size={36} color={theme.ink} style={{ marginBottom: '12px' }} />
              <h4 style={{ fontFamily: HEADER_FONT, fontSize: '24px', color: theme.ink, margin: 0, fontWeight: 800 }}>Inquiries Sealed</h4>
              <p style={{ fontFamily: LABEL_FONT, fontSize: '13px', color: theme.inkMuted, marginTop: '6px', textAlign: 'center' }}>Your alignment matrix has been recorded.</p>
              <button 
                className="tactile-btn" 
                onClick={() => { 
                  triggerHaptic('medium'); 
                  updateField('compatAnswers', []); // Wipe previous responses cleanly
                  setInquiriesReopened(true); 
                }} 
                style={{ marginTop: '20px', padding: '10px 18px', backgroundColor: theme.surfaceAlt, border: `1px solid ${theme.borderDark}`, borderRadius: '20px', color: theme.accent, fontFamily: LABEL_FONT, fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              >
                <RotateCcw size={14} /> Wipe & Re-open Inquiries
              </button>
            </motion.div>
          ) : (
            <div className="hide-scroll" style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', gap: '16px', margin: '0 -24px 0 -44px', padding: '0 24px 10px 44px', touchAction: 'pan-x', overscrollBehavior: 'contain', height: '100%' }}>
              {config.compatQuestions.map((q, idx) => (
                <div key={q.id} ref={el => inquiryRefs.current[idx] = el} style={{ minWidth: '85%', scrollSnapAlign: 'center', padding: '24px', border: `1px dashed ${theme.ink}`, borderRadius: '16px', display: 'flex', flexDirection: 'column', backgroundColor: theme.paper }}>
                  <p style={{ fontFamily: LABEL_FONT, fontSize: '11px', fontWeight: 800, color: theme.accent, textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 16px 0' }}>Inquiry 0{idx + 1} of {config.compatQuestions.length}</p>
                  <p style={{ fontFamily: TYPEWRITER_FONT, fontSize: '20px', color: theme.ink, margin: '0 0 24px 0', fontWeight: '700', lineHeight: 1.3 }}>{q.question}</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
                    {q.options.map(opt => {
                      const selected = formData.compatAnswers.find(a => a.question === q.id)?.answer;
                      return (
                        <button 
                          className="tactile-btn" key={opt.key} 
                          disabled={cardLock}
                          onClick={() => { 
                            if (cardLock) return;
                            setCardLock(true);
                            triggerHaptic('light'); 
                            const ans = [...formData.compatAnswers.filter(a => a.question !== q.id), { question: q.id, answer: opt.key }];
                            updateField('compatAnswers', ans);
                            
                            setTimeout(() => {
                              setCardLock(false);
                              if (idx < config.compatQuestions.length - 1) {
                                inquiryRefs.current[idx + 1]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                              } else {
                                setInquiriesReopened(false);
                              }
                            }, 300);
                          }} 
                          style={{ padding: '16px', fontSize: '16px', fontFamily: TYPEWRITER_FONT, fontWeight: 600, backgroundColor: 'transparent', border: selected === opt.key ? `2px solid ${theme.crimson}` : `1px solid ${theme.borderDark}`, color: selected === opt.key ? theme.crimson : theme.ink, borderRadius: '12px', cursor: cardLock ? 'not-allowed' : 'pointer', textAlign: 'left', opacity: (cardLock && selected !== opt.key) ? 0.5 : 1 }}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SnapPage>

      {/* ✅ STEP 4 FIX: SYMMETRICAL PADDING, ATTACHED CURLY QUOTES & SILKY SCROLLING */}
      <SnapPage equalPad={true}>
        <div style={{ ...styles.headerContainer, marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={28} style={{ color: isFullyComplete ? theme.success : theme.inkMuted }} strokeWidth={1.5} />
              <h3 style={{ ...styles.header, fontSize: '28px', margin: 0 }}>Volume II:<br/>The Review.</h3>
            </div>
            <button
              onClick={() => {
                triggerHaptic('medium');
                const pages = scrollRef.current?.querySelectorAll('[data-snap-page]');
                if (pages?.[1]) pages[1].scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              style={{
                background: 'rgba(139, 69, 19, 0.1)', border: `1px solid ${theme.borderDark}`,
                borderRadius: '16px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px',
                color: theme.accent, fontFamily: LABEL_FONT, fontSize: '12px', fontWeight: 800, cursor: 'pointer'
              }}
            >
              <Edit3 size={14} /> Edit Folio
            </button>
          </div>
          <p style={{ ...styles.subtitle, marginTop: '8px' }}>Inspect your public folio before committing it to campus view.</p>
        </div>
        
        {/* MUSEUM-GRADE PROFILE PREVIEW CARD */}
        <div style={{ backgroundColor: theme.surface, border: `1px solid ${theme.borderDark}`, boxShadow: `0 16px 40px ${theme.shadowWarm}`, borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          
          {/* Hero Image Banner */}
          <div style={{ width: '100%', aspectRatio: '4/5', position: 'relative', backgroundColor: theme.surfaceAlt }}>
            {formData.photos[0] ? (
              <img src={formData.photos[0]} alt="Hero Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.inkMuted, fontFamily: TYPEWRITER_FONT }}>No Portrait Attached</div>
            )}
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,12,10,0.9) 0%, transparent 40%)' }} />
            
            <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', zIndex: 2 }}>
              <h3 style={{ fontFamily: HEADER_FONT, fontSize: '30px', color: '#fff', margin: 0, fontWeight: 800, textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
                {formData.name || 'Anonymous'}, {age || '--'}
              </h3>
              <p style={{ fontFamily: LABEL_FONT, fontSize: '12px', color: 'rgba(255,255,255,0.9)', margin: '4px 0 0 0', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                {formData.branch || 'Discipline'} • {formData.year || 'Era'}
              </p>
            </div>
          </div>
          
          <div aria-hidden="true" style={{ width: '100%', height: '20px', backgroundColor: theme.paper, clipPath: TORN_EDGE_CLIP, marginTop: '-12px', position: 'relative', zIndex: 3, filter: 'drop-shadow(0 -2px 2px rgba(0,0,0,0.1))' }} />

          <div style={{ padding: '16px 20px 24px 20px', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: theme.paper }}>
            
            {/* Editorial Vitals Bento Grid */}
            <div style={{ backgroundColor: theme.surfaceAlt, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: theme.surface, borderRadius: '8px', border: `1px solid ${theme.border}` }}><MapPin size={16} color={theme.accent} /> <span style={{ fontFamily: LABEL_FONT, fontSize: '13px', fontWeight: 600, color: theme.ink }}>{formData.hostel || 'Campus'}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: theme.surface, borderRadius: '8px', border: `1px solid ${theme.border}` }}><Calendar size={16} color={theme.accent} /> <span style={{ fontFamily: LABEL_FONT, fontSize: '13px', fontWeight: 600, color: theme.ink }}>{formData.year || 'Era'}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: theme.surface, borderRadius: '8px', border: `1px solid ${theme.border}` }}><Award size={16} color={theme.accent} /> <span style={{ fontFamily: LABEL_FONT, fontSize: '13px', fontWeight: 600, color: theme.ink }}>{formData.branch || 'Discipline'}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: theme.surface, borderRadius: '8px', border: `1px solid ${theme.border}` }}><Sparkle size={16} color={theme.accent} /> <span style={{ fontFamily: LABEL_FONT, fontSize: '13px', fontWeight: 600, color: theme.ink }}>{formData.pronouns || 'Identity'}</span></div>
              </div>

              {formData.bio && (
                <div style={{ borderTop: `1px solid ${theme.borderDark}`, paddingTop: '16px' }}>
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: theme.accent, marginBottom: '6px', fontFamily: LABEL_FONT }}>Foreword</span>
                  {/* ✅ CURLY QUOTE FIX: &ldquo; and &rdquo; hug the trimmed string tightly */}
                  <p style={{ fontFamily: TYPEWRITER_FONT, fontSize: '14px', color: theme.ink, margin: 0, lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                    &ldquo;{formData.bio?.trim() || 'A mysterious figure walks the halls...'}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* Seeking Parameters & Curiosities Bento Box */}
            <div style={{ backgroundColor: theme.surfaceAlt, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '16px' }}>
              <span style={{ display: 'block', fontSize: '10px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: theme.accent, marginBottom: '12px', fontFamily: LABEL_FONT }}>Seeking Parameters</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: formData.interests.length > 0 ? '16px' : '0' }}>
                {(formData.intent.length > 0 ? formData.intent : ['Connection']).map((item, i) => (
                  <span key={i} style={{ padding: '6px 12px', border: `1.5px solid ${theme.crimson}`, borderRadius: '8px', backgroundColor: 'rgba(139,26,26,0.05)', color: theme.crimson, fontFamily: LABEL_FONT, fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>{item}</span>
                ))}
              </div>
              {formData.interests.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', borderTop: `1px dashed ${theme.borderDark}`, paddingTop: '16px' }}>
                  {formData.interests.map((interest, i) => (
                    <span key={i} style={{ padding: '6px 10px', border: `1px solid ${theme.border}`, borderRadius: '8px', backgroundColor: theme.surface, color: theme.ink, fontFamily: TYPEWRITER_FONT, fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '6px', color: theme.inkMuted }}>{getIconForInterest(interest)}</span>
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Bento Grid Artifacts (Taller 1.48 Aspect Ratio for Final Photo) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 12px', alignItems: 'center' }}>
              <PreviewIndexCard tilt={TILT.prompt_0} tape="top-right">
                {formData.prompts?.[0]?.question || "A shower thought I recently had..."}
              </PreviewIndexCard>

              {formData.photos?.[1] ? (
                <PreviewMountedPhoto src={formData.photos[1]} alt="Artifact 2" tilt={TILT.photo_1} />
              ) : <div />}

              {formData.photos?.[2] ? (
                <PreviewMountedPhoto src={formData.photos[2]} alt="Artifact 3" tilt={TILT.photo_2} />
              ) : <div />}

              <PreviewIndexCard tilt={TILT.prompt_1} tape="top-left">
                {formData.prompts?.[1]?.question || "My ideal weekend looks like..."}
              </PreviewIndexCard>

              {formData.prompts?.[2]?.question && (
                <div style={{ gridColumn: 'span 2' }}>
                  <PreviewIndexCard tilt={TILT.prompt_2} tape="center">
                    {formData.prompts[2].question}
                  </PreviewIndexCard>
                </div>
              )}

              {formData.photos?.[3] && (
                <div style={{ gridColumn: 'span 2' }}>
                  <PreviewMountedPhoto src={formData.photos[3]} alt="Artifact 4" tilt={TILT.photo_3} aspect="1.48" />
                </div>
              )}
            </div>

          </div>
        </div>

        <div style={{ marginTop: '20px', paddingTop: '10px', paddingBottom: '60px' }}>
          {!isFullyComplete && (
            <div style={{ marginBottom: '16px', padding: '14px', border: `1px dashed ${theme.crimson}`, borderRadius: '12px', textAlign: 'center' }}>
              <p style={{ color: theme.crimson, fontSize: '12px', fontFamily: LABEL_FONT, fontWeight: 800, margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Ledger Incomplete</p>
              <p style={{ color: theme.ink, fontSize: '14px', fontFamily: TYPEWRITER_FONT, margin: 0, fontWeight: 600 }}>The Archivist requires: {missingFields.join(', ')}</p>
            </div>
          )}

          <button 
            onClick={handleAffixSeal}
            disabled={!isFullyComplete || uploadingSlot !== null}
            className="tactile-btn"
            style={{
              width: '100%', padding: '22px',
              backgroundColor: isFullyComplete ? theme.crimson : 'transparent',
              color: isFullyComplete ? '#fff' : theme.inkMuted,
              border: isFullyComplete ? 'none' : `1px dashed ${theme.inkMuted}`,
              borderRadius: '16px',
              fontFamily: LABEL_FONT, fontSize: '16px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase',
              cursor: (isFullyComplete && uploadingSlot === null) ? 'pointer' : 'not-allowed',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              opacity: uploadingSlot !== null ? 0.5 : 1,
              boxShadow: isFullyComplete ? '0 8px 24px rgba(139, 26, 26, 0.3)' : 'none'
            }}
          >
            {uploadingSlot !== null ? 'Developing Photos...' : isFullyComplete ? 'Publish Profile & Enter' : 'Complete to Publish'}
          </button>
        </div>
      </SnapPage>

      {/* BRANCH PICKER MODAL */}
      <AnimatePresence>
        {showBranchModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBranchModal(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(20,15,10,0.65)', backdropFilter: 'blur(4px)', zIndex: 100 }} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '70dvh', backgroundColor: theme.surfaceAlt, backgroundImage: `url("${design?.texture?.grain || ''}")`, borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 101, display: 'flex', flexDirection: 'column', boxShadow: '0 -20px 40px rgba(0,0,0,0.3)', overscrollBehavior: 'contain' }}>
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.borderDark}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: HEADER_FONT, fontSize: '20px', fontWeight: '700', color: theme.ink }}>Select Branch</span>
                <button className="tactile-btn" onClick={() => setShowBranchModal(false)} style={{ background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} color={theme.ink} /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {config.branches?.map(b => (
                  <button key={b} className="tactile-btn" onClick={() => { updateField('branch', b); setShowBranchModal(false); }} style={{ padding: '14px 18px', borderRadius: '10px', border: formData.branch === b ? `2px solid ${theme.crimson}` : `1px solid ${theme.borderDark}`, backgroundColor: formData.branch === b ? 'rgba(139, 26, 26, 0.08)' : theme.surface, color: formData.branch === b ? theme.crimson : theme.ink, fontFamily: TYPEWRITER_FONT, fontSize: '15px', fontWeight: formData.branch === b ? '700' : '500', cursor: 'pointer', textAlign: 'left' }}>
                    {b}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ERA PICKER MODAL */}
      <AnimatePresence>
        {showEraModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEraModal(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(20,15,10,0.65)', backdropFilter: 'blur(4px)', zIndex: 100 }} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '60dvh', backgroundColor: theme.surfaceAlt, backgroundImage: `url("${design?.texture?.grain || ''}")`, borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 101, display: 'flex', flexDirection: 'column', boxShadow: '0 -20px 40px rgba(0,0,0,0.3)', overscrollBehavior: 'contain' }}>
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.borderDark}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: HEADER_FONT, fontSize: '20px', fontWeight: '700', color: theme.ink }}>Select Era</span>
                <button className="tactile-btn" onClick={() => setShowEraModal(false)} style={{ background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} color={theme.ink} /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {config.years?.map(y => (
                  <button key={y} className="tactile-btn" onClick={() => { updateField('year', y); setShowEraModal(false); }} style={{ padding: '14px 18px', borderRadius: '10px', border: formData.year === y ? `2px solid ${theme.crimson}` : `1px solid ${theme.borderDark}`, backgroundColor: formData.year === y ? 'rgba(139, 26, 26, 0.08)' : theme.surface, color: formData.year === y ? theme.crimson : theme.ink, fontFamily: TYPEWRITER_FONT, fontSize: '15px', fontWeight: formData.year === y ? '700' : '500', cursor: 'pointer', textAlign: 'left' }}>
                    {y}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* WHISPER PICKER MODAL */}
      <AnimatePresence>
        {promptPickerSlot !== null && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPromptPickerSlot(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(20,15,10,0.65)', backdropFilter: 'blur(4px)', zIndex: 100 }} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '85dvh', backgroundColor: theme.surfaceAlt, backgroundImage: `url("${design?.texture?.grain || ''}")`, borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 101, display: 'flex', flexDirection: 'column', boxShadow: '0 -20px 40px rgba(0,0,0,0.3)', overscrollBehavior: 'contain' }}>
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.borderDark}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: HEADER_FONT, fontSize: '20px', fontWeight: '700', color: theme.ink }}>Archive of Whispers</span>
                <button className="tactile-btn" onClick={() => setPromptPickerSlot(null)} style={{ background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} color={theme.ink} /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', overscrollBehavior: 'contain' }}>
                <div style={{ padding: '16px', borderRadius: '14px', border: `1px dashed ${theme.ink}`, marginBottom: '20px' }}>
                  <label style={styles.label}>Draft Your Own</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input style={{...styles.input, fontSize: '15px', padding: '8px 4px'}} placeholder="Type your own whisper..." value={customPromptText} onChange={e => setCustomPromptText(e.target.value)} spellCheck="false" autoComplete="off" />
                    <button className="tactile-btn" onClick={() => { if (customPromptText.trim()) { const updated = [...formData.prompts]; updated[promptPickerSlot] = { question: customPromptText.trim() }; updateField('prompts', updated); setCustomPromptText(''); setPromptPickerSlot(null); }}} disabled={!customPromptText.trim()} style={{ padding: '10px 18px', backgroundColor: customPromptText.trim() ? theme.crimson : 'transparent', color: customPromptText.trim() ? '#fff' : theme.ink, border: customPromptText.trim() ? 'none' : `1px solid ${theme.ink}`, borderRadius: '8px', fontFamily: LABEL_FONT, fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', cursor: 'pointer' }}>Affix</button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {config.prompts?.map((p, i) => {
                    const promptText = typeof p === 'string' ? p : p.question;
                    if (!promptText) return null;
                    const alreadyUsed = formData.prompts.some((pr, si) => si !== promptPickerSlot && pr?.question === promptText);
                    
                    return (
                      <button key={i} className={alreadyUsed ? "" : "tactile-btn"} disabled={alreadyUsed} onClick={() => { const updated = [...formData.prompts]; updated[promptPickerSlot] = { question: promptText }; updateField('prompts', updated); setPromptPickerSlot(null); }} style={{ width: '100%', textAlign: 'left', padding: '14px 18px', borderRadius: '10px', border: `1px solid ${theme.borderDark}`, backgroundColor: 'transparent', cursor: alreadyUsed ? 'not-allowed' : 'pointer', fontFamily: TYPEWRITER_FONT, fontSize: '15px', color: alreadyUsed ? theme.borderDark : theme.ink, opacity: alreadyUsed ? 0.5 : 1 }}>
                        "{promptText}"
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Onboarding;