
import React, { useState, useEffect, useCallback, useRef } from 'react';
import neu from '../styles/neu';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileCard from '../components/ProfileCard';
import { closeAllPopouts } from '../components/PopoutItem';
import DeckActions from '../components/DeckActions';
import ProfileCardSkeleton from '../components/ProfileCardSkeleton';
import { api } from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import { useAppConfig } from '../utils/AppConfigContext';
import { canInteract, readLadder } from '../utils/ladder';
import ShadowbanBanner from '../components/ShadowbanBanner';
import LearnMoreSheet from '../components/LearnMoreSheet';
import { triggerHaptic } from '../utils/haptics';
import { toast } from '../utils/toast';
import {
  discoverStore,
  initDiscoverStore,
  saveDiscoverStore,
  resetDiscoverStore,
} from '../utils/discoverStore';
import { useIsDesktop } from '../utils/useIsDesktop';
import {
  syncLocationIfPermitted,
  releaseEphemeralLocation,
  watchGeolocationPermission,
  GEO_PERMISSION,
} from '../utils/locationSync';
import shuffle from '../utils/shuffle';
import socket from '../utils/socket';
import LocationNotice from '../components/LocationNotice';
import DiscoverRebuildOverlay from '../components/DiscoverRebuildOverlay';
import { RotateCw, Compass, AlertTriangle, X, Undo2, Heart } from 'lucide-react';

/* Exact visual language from Splash.jsx. Keep token names compatible with neu. */
const t = {
  ...neu,
  ink: '#111211',
  ink2: '#383832',
  ink3: '#77766F',
  paper: '#F1EDE2',
  card: '#F8F5EC',
  desk: '#111211',
  yellow: '#E0A15E',
  coral: '#C96F68',
  green: '#779477',
  pink: '#A3A3A1',
  red: '#A84F4A',
  hair: 'rgba(17,18,17,.22)',
  line: 'rgba(241,237,226,.2)',
  fontHeavy: "'Barlow Condensed', sans-serif",
  fontBody: "'Space Grotesk', sans-serif",
  fontMono: "'IBM Plex Mono', monospace",
};

const slideVariants = {
  enter: (direction = 'up') => ({
    opacity: 0,
    y: direction === 'down' ? -34 : 34,
    scale: 0.985,
    zIndex: 1,
  }),
  center: {
    opacity: 1,
    y: 0,
    scale: 1,
    zIndex: 2,
    transition: {
      type: 'spring',
      stiffness: 280,
      damping: 27,
      mass: 0.85,
    },
  },
  exit: (direction = 'up') => ({
    opacity: 0,
    y: direction === 'down' ? 42 : -42,
    scale: 0.985,
    zIndex: 1,
    transition: {
      duration: 0.19,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const springTransition = {
  type: 'spring',
  stiffness: 280,
  damping: 27,
  mass: 0.85,
};

const MAX_GATE_RETRIES = 2;

const Discover = ({ onOpenChat, onSheetNearHeader, onGoToProfile }) => {
  const isDesktop = useIsDesktop();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [deckExhausted, setDeckExhausted] = useState(false);
  const [rebuiltAt, setRebuiltAt] = useState(0);
  const [slideDirection, setSlideDirection] = useState('up');
  const [undoNonce, setUndoNonce] = useState(0);
  const [merging, setMerging] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [showAlignmentModal, setShowAlignmentModal] = useState(false);
  const [alignedProfile, setAlignedProfile] = useState(null);

  const actionPendingRef = useRef(false);
  const servedRef = useRef(0);
  const rebuiltTimer = useRef(null);
  const { user: myUser } = useAuth();

  const [locationRead, setLocationRead] = useState(null);

  useEffect(() => {
    if (!myUser?._id) return;
    let alive = true;

    api.get('/users/location')
      .then((r) => {
        if (alive) setLocationRead(r ?? null);
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, [myUser?._id]);

  const [showLearnMore, setShowLearnMore] = useState(false);
  const shadowbanScore = myUser?.shadowbanScore || 0;
  const config = useAppConfig();

  const [rebuildOverlay, setRebuildOverlay] = useState(false);
  const rebuildOverlayTimer = useRef(null);

  const [myProfile, setMyProfile] = useState(null);
  const [myProfileState, setMyProfileState] = useState('loading');
  const myProfileScore = myProfile?.profileScore ?? 0;
  const deckGated = !canInteract(myProfileScore, config);

  const loadMyProfile = useCallback(async () => {
    setMyProfileState((s) => (s === 'error' ? 'loading' : s));

    try {
      const me = await api.get('/auth/me');
      setMyProfile(me);
      setMyProfileState('ready');
      return me;
    } catch {
      setMyProfileState('error');
      return null;
    }
  }, []);

  useEffect(() => {
    loadMyProfile();
  }, [loadMyProfile]);

  useEffect(() => {
    const onOnline = () => loadMyProfile();
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadMyProfile();
    };

    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [loadMyProfile]);

  const gateRetries = useRef(0);

  useEffect(() => {
    if (myProfileState !== 'error') return undefined;
    if (gateRetries.current >= MAX_GATE_RETRIES) return undefined;

    gateRetries.current += 1;
    const timer = setTimeout(() => loadMyProfile(), 2500);

    return () => clearTimeout(timer);
  }, [myProfileState, loadMyProfile]);

  useEffect(() => {
    if (myProfileState === 'ready') gateRetries.current = 0;
  }, [myProfileState]);

  const deckFetchInFlight = useRef(null);

  const fetchProfiles = useCallback(async (append = false) => {
    if (deckFetchInFlight.current) return deckFetchInFlight.current;

    const run = (async () => {
      if (!append) {
        setLoading(true);
        setError(null);
        resetDiscoverStore();
      } else {
        setFetchingMore(true);
      }

      try {
        const servedCount = append ? servedRef.current : 0;
        const q = `/discover?limit=10&served=${servedCount}`;
        const data = await api.get(q);
        const newProfiles = shuffle(data.users || []);

        servedRef.current = Number.isFinite(data.served)
          ? data.served
          : servedCount + newProfiles.length;

        if (append) {
          if (newProfiles.length === 0) {
            setHasMore(false);
            setDeckExhausted(!!data.deckExhausted);
            discoverStore.hasMore = false;
            saveDiscoverStore();
            return;
          }

          setProfiles((prev) => {
            const next = [...prev, ...newProfiles];
            discoverStore.profiles = next;
            discoverStore.hasMore = data.hasMore;
            saveDiscoverStore();
            return next;
          });
        } else if (newProfiles.length > 0) {
          setProfiles(newProfiles);
          setCurrentIndex(0);
          discoverStore.profiles = newProfiles;
          discoverStore.currentIndex = 0;
          discoverStore.hasMore = data.hasMore;
          saveDiscoverStore();
        }

        setHasMore(data.hasMore);
        setDeckExhausted(!!data.deckExhausted);

        if (data.rebuiltWindow && append) {
          setRebuiltAt(Date.now());
          clearTimeout(rebuiltTimer.current);
          rebuiltTimer.current = setTimeout(() => setRebuiltAt(0), 4000);
        }
      } catch (err) {
        console.error('Failed to fetch deck profiles:', err);
        if (!append) setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
        setFetchingMore(false);
      }
    })();

    deckFetchInFlight.current = run;

    try {
      await run;
    } finally {
      deckFetchInFlight.current = null;
    }

    return run;
  }, []);

  const refreshLocation = useCallback(async () => {
    const res = await syncLocationIfPermitted();

    if (!res.ok) {
      if (res.reason === 'denied') setLocationDenied(true);

      toast.error(
        res.reason === 'denied'
          ? 'Location permission was denied. Enable it in browser settings.'
          : res.reason === 'insecure-context'
            ? 'Location only works on a secure connection.'
            : "Couldn't get a location reading. Try again, or check phone GPS settings.",
      );
      return;
    }

    if (!res.moved) {
      toast.info('Your location is already current.');
      return;
    }

    resetDiscoverStore();
    setProfiles([]);
    setCurrentIndex(0);
    setHasMore(true);
    setDeckExhausted(false);
    setRebuiltAt(Date.now());
    servedRef.current = 0;

    await fetchProfiles(false);
    toast.success('Location updated. Showing people near you.');
  }, [fetchProfiles]);

  const rebuildDeckForLocation = useCallback(async () => {
    clearTimeout(rebuiltTimer.current);
    clearTimeout(rebuildOverlayTimer.current);
    resetDiscoverStore();
    setProfiles([]);
    setCurrentIndex(0);
    setHasMore(true);
    setDeckExhausted(false);
    servedRef.current = 0;

    rebuildOverlayTimer.current = setTimeout(
      () => setRebuildOverlay(true),
      250,
    );

    try {
      await fetchProfiles(false);
    } finally {
      clearTimeout(rebuildOverlayTimer.current);
      setRebuildOverlay(false);
    }
  }, [fetchProfiles]);

  useEffect(() => {
    if (!navigator?.permissions?.query) return;
    let alive = true;

    navigator.permissions.query({ name: 'geolocation' })
      .then((r) => {
        if (!alive) return;
        setLocationDenied(r.state === GEO_PERMISSION.DENIED);
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        await releaseEphemeralLocation();
        const res = await syncLocationIfPermitted();

        if (!alive || !res.ok || !res.moved) return;

        resetDiscoverStore();
        setProfiles([]);
        setCurrentIndex(0);
        setHasMore(true);
        setDeckExhausted(false);
        servedRef.current = 0;
      } catch {
        // Location maintenance must not interrupt Discover.
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => watchGeolocationPermission((state) => {
    setLocationDenied(state === GEO_PERMISSION.DENIED);
  }), []);

  useEffect(() => () => {
    clearTimeout(rebuiltTimer.current);
    clearTimeout(rebuildOverlayTimer.current);
  }, []);

  const refreshMerged = useCallback(async () => {
    setMerging(true);

    try {
      const data = await api.get('/discover?limit=20');
      const fresh = data.users || [];
      if (fresh.length === 0) return;

      const byId = new Map(fresh.map((p) => [String(p._id), p]));

      setProfiles((prev) => {
        if (prev.length === 0) return prev;
        let changed = false;

        const next = prev.map((p) => {
          const f = byId.get(String(p._id));
          if (!f) return p;
          changed = true;

          return {
            ...f,
            hybridScore: f.hybridScore ?? p.hybridScore,
            distanceBand: f.distanceBand ?? p.distanceBand,
          };
        });

        if (!changed) return prev;

        discoverStore.profiles = next;
        saveDiscoverStore();
        return next;
      });
    } catch {
      // Keep the cached deck usable if reconciliation fails.
    } finally {
      setMerging(false);
    }
  }, []);

  useEffect(() => {
    const userId = myUser?._id;
    if (!userId) return;

    const restored = initDiscoverStore(userId);

    if (restored && discoverStore.profiles.length > 0) {
      setProfiles(discoverStore.profiles);
      setCurrentIndex(discoverStore.currentIndex);
      setHasMore(discoverStore.hasMore);
      setLoading(false);
      return;
    }

    fetchProfiles(false);
  }, [myUser?._id, fetchProfiles, refreshMerged]);

  useEffect(() => {
    const onProfileUpdated = (card) => {
      if (!card?._id) return;

      setProfiles((prev) => {
        const idx = prev.findIndex(
          (p) => String(p._id) === String(card._id),
        );
        if (idx === -1) return prev;

        const next = [...prev];
        next[idx] = {
          ...card,
          hybridScore: card.hybridScore ?? prev[idx].hybridScore,
          distanceBand: card.distanceBand ?? prev[idx].distanceBand,
        };

        discoverStore.profiles = next;
        saveDiscoverStore();
        return next;
      });
    };

    socket.on('profile-updated', onProfileUpdated);
    return () => socket.off('profile-updated', onProfileUpdated);
  }, []);

  const handleNextProfile = useCallback((direction = 'up', isAction = false) => {
    if (direction === 'down') {
      if (currentIndex <= 0) return;

      const next = Math.max(0, currentIndex - 1);
      setCurrentIndex(next);
      discoverStore.currentIndex = next;
      saveDiscoverStore();
      setSlideDirection('down');
      return;
    }

    if (currentIndex >= profiles.length) return;
    setSlideDirection(direction);

    if (!isAction) {
      const passedProfile = profiles[currentIndex];

      if (passedProfile) {
        api.post(`/discover/pass/${passedProfile._id}`).catch(console.error);
        triggerHaptic('light');
      }
    }

    const next = currentIndex + 1;
    setCurrentIndex(next);
    discoverStore.currentIndex = next;
    discoverStore.profiles = profiles;
    saveDiscoverStore();

    if (
      profiles.length - currentIndex <= 6
      && hasMore
      && !deckExhausted
      && !fetchingMore
    ) {
      fetchProfiles(true);
    }
  }, [
    currentIndex, profiles, hasMore, deckExhausted, fetchingMore, fetchProfiles,
  ]);

  const handleAction = useCallback(async (action, payload = {}) => {
    if (actionPendingRef.current) return;
    if (currentIndex >= profiles.length) return;

    const profile = profiles[currentIndex];
    if (!profile) return;

    if (action !== 'pass' && deckGated) {
      triggerHaptic('medium');
      closeAllPopouts();

      const need = readLadder(config).interact;
      const fresh = await loadMyProfile();

      toast.info(
        fresh && Number.isFinite(fresh.profileScore)
          ? `Profile strength: ${fresh.profileScore}%. You need ${need}% to interact.`
          : `Finish your profile to interact — you need ${need}%.`,
        { label: 'Profile', onClick: () => onGoToProfile?.() },
      );
      return;
    }

    actionPendingRef.current = true;

    try {
      if (action === 'align') {
        triggerHaptic('heavy');
        const response = await api.post(`/discover/align/${profile._id}`, payload);

        if (response.matched) {
          setAlignedProfile({
            ...response.user,
            alignmentId: response.alignmentId,
          });
          setShowAlignmentModal(true);
        }
      } else if (action === 'pass') {
        triggerHaptic('medium');
        await api.post(`/discover/pass/${profile._id}`);
        setUndoNonce((n) => n + 1);
      }

      handleNextProfile('up', true);
    } catch (err) {
      if (err.code === 'GATED') {
        toast.info(
          `Finish your profile to interact — you need ${readLadder(config).interact}%.`,
          { label: 'Profile', onClick: () => onGoToProfile?.() },
        );
        return;
      }
      console.error('Action failed:', err);
    } finally {
      actionPendingRef.current = false;
    }
  }, [
    currentIndex,
    profiles,
    handleNextProfile,
    deckGated,
    config,
    loadMyProfile,
    onGoToProfile,
  ]);

  useEffect(() => {
    if (!isDesktop) return;
    const next = profiles[currentIndex + 1]?.photos?.[0];
    if (!next) return;

    const img = new Image();
    img.decoding = 'async';
    img.src = next;
  }, [isDesktop, profiles, currentIndex]);

  useEffect(() => {
    if (!isDesktop) return;

    const onKey = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      if (
        tag === 'input'
        || tag === 'textarea'
        || e.target?.isContentEditable
      ) return;

      if (showAlignmentModal) {
        if (e.key === 'Escape') {
          setShowAlignmentModal(false);
          setAlignedProfile(null);
        }
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const k = e.key;

      if (k === 'ArrowRight' || k === 'l' || k === 'L') {
        e.preventDefault();
        triggerHaptic('heavy');
        handleAction('align', {});
      } else if (k === 'ArrowLeft' || k === 'p' || k === 'P') {
        e.preventDefault();
        triggerHaptic('medium');
        handleAction('pass');
      } else if (k === 'ArrowDown' || k === 'b' || k === 'B') {
        e.preventDefault();
        triggerHaptic('light');
        handleNextProfile('down');
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isDesktop, showAlignmentModal, handleAction, handleNextProfile]);

  if (loading) {
    return (
      <div style={styles.loadingRoot}>
        <ProfileCardSkeleton />
        <DiscoverRebuildOverlay show={rebuildOverlay} />
        <style>{DECK_CSS}</style>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div style={styles.stateRoot}>
        <style>{DECK_CSS}</style>
        <div style={styles.stateCard}>
          <div style={{ ...styles.stateTile, background: t.coral }}>
            <AlertTriangle size={22} strokeWidth={2.2} color={t.ink} />
          </div>
          <h3 style={styles.stateTitle}>The deck hit a snag</h3>
          <p style={styles.stateBody}>{error}</p>
          <button
            onClick={() => fetchProfiles(false)}
            className="slam-btn"
            style={styles.slamBtn}
          >
            <RotateCw size={14} strokeWidth={2.5} /> Try again
          </button>
        </div>
      </div>
    );
  }

  if (!profiles || profiles.length === 0 || currentIndex >= profiles.length) {
    return (
      <div style={styles.stateRoot}>
        <style>{DECK_CSS}</style>
        <div style={styles.stateCard}>
          <div style={{ ...styles.stateTile, background: t.yellow }}>
            <Compass size={22} strokeWidth={2.2} color={t.ink} />
          </div>

          <h3 style={styles.stateTitle}>You're all caught up</h3>
          <p style={styles.stateBody}>
            {deckExhausted
              ? "You've seen everyone who fits right now. New people join all the time — check back later."
              : "You've reviewed everyone for now. Check back later — new people land all the time."}
          </p>

          {!deckExhausted && (
            <button
              onClick={() => fetchProfiles(false)}
              className="slam-btn"
              style={styles.slamBtn}
            >
              <RotateCw size={14} strokeWidth={2.5} /> Refresh
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.viewportRoot, ...(isDesktop ? styles.viewportRootDesktop : null) }}>
      <style>{DECK_CSS}</style>

      <ShadowbanBanner
        score={shadowbanScore}
        onLearnMore={() => setShowLearnMore(true)}
      />
      {showLearnMore && (
        <LearnMoreSheet onClose={() => setShowLearnMore(false)} />
      )}

      {myUser && locationRead && (
        <LocationNotice
          college={myUser.college}
          variant={locationRead.active ? 'active' : 'fallback'}
          onLocationChanged={async (moved) => {
            if (!moved) return;
            await rebuildDeckForLocation();
          }}
        />
      )}

      <AnimatePresence>
        {rebuiltAt > 0 && Date.now() - rebuiltAt < 4000 && (
          <motion.div
            key="rebuilt"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            role="status"
            style={styles.rebuiltNotice}
          >
            Showing newer profiles
          </motion.div>
        )}
      </AnimatePresence>

      <DiscoverRebuildOverlay show={rebuildOverlay} />

      {merging && !loading && (
        <div aria-live="polite" style={styles.mergingNotice}>
          Updating…
        </div>
      )}

      <div
        className={isDesktop ? 'discover-desktop-stage' : 'discover-mobile-stage'}
        style={{
          ...styles.stageContainer,
          ...(isDesktop ? styles.stageContainerDesktopNoPad : null),
        }}
      >
        <div style={isDesktop ? styles.deckColumnDesktop : styles.deckColumnMobile}>
          <AnimatePresence custom={slideDirection}>
            {profiles[currentIndex] && (
              <motion.div
                key={profiles[currentIndex]._id || profiles[currentIndex].id}
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={springTransition}
                style={styles.cardMotionLayer}
              >
                <ProfileCard
                  profile={profiles[currentIndex]}
                  onAction={handleAction}
                  onSheetNearHeader={onSheetNearHeader}
                  isGated={deckGated}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!isDesktop && (
          <DeckActions
            onPass={() => handleAction('pass')}
            onAlign={() => handleAction('align', {})}
            canAlign={!!profiles[currentIndex]}
            onUndo={() => handleNextProfile('down')}
            canGoBack={currentIndex > 0}
            undoNonce={undoNonce}
            onRefreshLocation={locationDenied ? undefined : refreshLocation}
          />
        )}
      </div>

      {isDesktop && (
        <div
          className="discover-desktop-actions"
          style={styles.desktopActionBar}
          role="toolbar"
          aria-label="Discovery actions"
        >
          <button
            className="deck-action-btn"
            title="Previous profile (↓ or B)"
            aria-label="Previous profile"
            disabled={currentIndex <= 0}
            onClick={() => handleNextProfile('down')}
            style={{ ...styles.deckBtn, background: t.paper, color: t.ink }}
          >
            <Undo2 size={19} strokeWidth={2.2} />
          </button>

          <button
            className="deck-action-btn"
            title="Pass (← or P)"
            aria-label="Pass"
            onClick={() => handleAction('pass')}
            style={{ ...styles.deckBtn, background: t.card, color: t.ink }}
          >
            <X size={21} strokeWidth={2.4} />
          </button>

          <button
            className="deck-action-btn deck-align-btn"
            title="Align with this profile (→ or L)"
            aria-label="Align with this profile"
            onClick={() => handleAction('align', {})}
            style={{
              ...styles.deckBtn,
              width: 104,
              background: t.yellow,
              color: t.ink,
              borderColor: t.yellow,
            }}
          >
            ALIGN <span aria-hidden="true">↗</span>
          </button>

          <div
            className="deck-hints-desktop"
            aria-hidden="true"
            style={styles.deckHints}
          >
            <span><kbd className="deck-kbd">←</kbd> pass</span>
            <span><kbd className="deck-kbd">→</kbd> align</span>
            <span><kbd className="deck-kbd">↓</kbd> back</span>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showAlignmentModal && alignedProfile && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={styles.modalScrim}
              onClick={() => {
                setShowAlignmentModal(false);
                setAlignedProfile(null);
              }}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              transition={{
                type: 'spring',
                damping: 22,
                stiffness: 300,
              }}
              style={styles.matchModal}
            >
              <span aria-hidden="true" style={styles.confettiAmber} />
              <span aria-hidden="true" style={styles.confettiCoral} />
              <span aria-hidden="true" style={styles.confettiSage} />
              <span aria-hidden="true" style={styles.confettiConcrete} />

              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: 0.1,
                  type: 'spring',
                  damping: 14,
                  stiffness: 280,
                }}
                style={styles.matchIcon}
              >
                <Heart size={40} strokeWidth={2.2} color={t.ink} fill={t.ink} />
              </motion.div>

              <h2 style={styles.matchTitle}>
                Aligned<span style={{ color: t.coral }}>!</span>
              </h2>

              <p style={styles.matchBody}>
                You and {alignedProfile.name} found common ground. The chat is now open.
              </p>

              <div style={styles.matchActions}>
                <button
                  className="slam-btn"
                  onClick={() => {
                    triggerHaptic('heavy');
                    setShowAlignmentModal(false);
                    if (onOpenChat && alignedProfile) {
                      onOpenChat({
                        _id: alignedProfile.alignmentId,
                        user: alignedProfile,
                      });
                    }
                    setAlignedProfile(null);
                  }}
                  style={styles.openChatButton}
                >
                  Open chat
                </button>

                <button
                  onClick={() => {
                    setShowAlignmentModal(false);
                    setAlignedProfile(null);
                  }}
                  style={styles.keepBrowsingButton}
                >
                  Keep browsing
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const DECK_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

  .slam-btn,
  .deck-action-btn {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    transition:
      transform .18s cubic-bezier(.2,.8,.2,1),
      background-color .18s ease,
      border-color .18s ease,
      opacity .18s ease;
  }

  .slam-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    min-height: 48px;
    padding: 13px 20px;
    border: 1px solid #111211;
    border-radius: 3px;
    font-family: ${t.fontMono};
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .09em;
    text-transform: uppercase;
    cursor: pointer;
  }

  .deck-action-btn {
    flex-shrink: 0;
    cursor: pointer;
    touch-action: manipulation;
  }

  .deck-action-btn:disabled {
    opacity: .3;
    cursor: not-allowed;
    box-shadow: none !important;
  }

  .deck-action-btn:focus-visible,
  .slam-btn:focus-visible {
    outline: 2px solid ${t.yellow};
    outline-offset: 4px;
  }

  @media (hover: hover) and (pointer: fine) {
    .deck-action-btn:hover:not(:disabled) {
      transform: translateY(-3px);
    }

    .slam-btn:hover {
      transform: translateY(-2px);
      filter: brightness(1.035);
    }
  }

  .deck-action-btn:active:not(:disabled),
  .slam-btn:active {
    transform: scale(.97) !important;
  }

  kbd.deck-kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 23px;
    min-height: 22px;
    padding: 2px 5px;
    border: 1px solid ${t.hair};
    border-radius: 3px;
    background: ${t.paper};
    color: ${t.ink};
    font: 600 10px ${t.fontMono};
  }

  .discover-mobile-stage,
  .discover-desktop-stage {
    flex: 1;
    min-height: 0;
    min-width: 0;
  }

  @media (max-width: 760px) {
    .deck-hints-desktop {
      display: none !important;
    }

    .discover-mobile-stage {
      padding: 0 !important;
    }
  }

  @media (max-height: 680px) and (min-width: 761px) {
    .discover-desktop-stage {
      padding-top: 8px !important;
      padding-bottom: 4px !important;
    }

    .discover-desktop-actions {
      padding-top: 6px !important;
      padding-bottom: 8px !important;
    }
  }

  @media (max-width: 380px) {
    .discover-desktop-actions {
      gap: 8px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .slam-btn,
    .deck-action-btn {
      transition: none !important;
    }
  }
`;

const styles = {
  loadingRoot: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 12,
    boxSizing: 'border-box',
    backgroundColor: t.desk,
    position: 'relative',
  },

  stateRoot: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 20,
    boxSizing: 'border-box',
    backgroundColor: t.desk,
    position: 'relative',
  },

  viewportRoot: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: t.desk,
    position: 'relative',
    overflow: 'hidden',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  },

  viewportRootDesktop: {
    alignItems: 'center',
    width: '100%',
  },

  stageContainer: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
    zIndex: 2,
    padding: '0 0 8px',
    boxSizing: 'border-box',
  },

  stageContainerDesktop: {
    width: '100%',
    maxWidth: 580,
    padding: '14px 20px 8px',
    margin: '0 auto',
    boxSizing: 'border-box',
  },

  stageContainerDesktopNoPad: {
    width: '100%',
    maxWidth: 580,
    padding: '14px 20px 8px',
    margin: '0 auto',
    boxSizing: 'border-box',
  },

  deckColumnMobile: {
    position: 'relative',
    width: '100%',
    height: '100%',
    minHeight: 0,
    minWidth: 0,
    overflow: 'hidden',
  },

  deckColumnDesktop: {
    position: 'relative',
    width: '100%',
    height: '100%',
    minHeight: 0,
    minWidth: 0,
    backgroundColor: t.desk,
    border: '1px solid rgba(241,237,226,.2)',
    borderRadius: 5,
    overflow: 'hidden',
    isolation: 'isolate',
  },

  cardMotionLayer: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    minWidth: 0,
    willChange: 'transform, opacity',
    backfaceVisibility: 'hidden',
  },

  desktopActionBar: {
    position: 'relative',
    zIndex: 3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: '10px 20px 16px',
    width: '100%',
    maxWidth: 580,
    margin: '0 auto',
    boxSizing: 'border-box',
    flexShrink: 0,
  },

  deckBtn: {
    width: 52,
    height: 52,
    minWidth: 52,
    borderRadius: 5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: `1px solid ${t.paper}`,
    boxShadow: 'none',
    fontFamily: t.fontMono,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '.08em',
  },

  deckHints: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginLeft: 8,
    fontFamily: t.fontMono,
    fontSize: 9,
    color: 'rgba(241,237,226,.6)',
    whiteSpace: 'nowrap',
  },

  stateCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: t.paper,
    border: `1px solid ${t.paper}`,
    borderRadius: 4,
    boxShadow: '0 14px 36px rgba(0,0,0,.2)',
    padding: '30px 24px 26px',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },

  stateTile: {
    width: 48,
    height: 48,
    borderRadius: 4,
    border: `1px solid ${t.ink}`,
    boxShadow: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  stateTitle: {
    fontFamily: t.fontHeavy,
    fontSize: 28,
    lineHeight: .95,
    fontWeight: 800,
    color: t.ink,
    letterSpacing: '-.015em',
    textTransform: 'uppercase',
    margin: '0 0 10px',
  },

  stateBody: {
    fontFamily: t.fontBody,
    fontSize: 13,
    fontWeight: 500,
    lineHeight: 1.7,
    maxWidth: 270,
    margin: '0 0 24px',
    color: t.ink2,
  },

  slamBtn: {
    padding: '13px 22px',
    background: t.coral,
    color: t.ink,
    border: `1px solid ${t.ink}`,
    borderRadius: 2,
    boxShadow: 'none',
  },

  rebuiltNotice: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
    width: 'fit-content',
    maxWidth: 'calc(100% - 24px)',
    marginInline: 'auto',
    boxSizing: 'border-box',
    zIndex: 40,
    pointerEvents: 'none',
    padding: '8px 14px',
    borderRadius: 2,
    background: t.paper,
    border: `1px solid ${t.paper}`,
    color: t.ink,
    fontFamily: t.fontMono,
    fontSize: 9,
    lineHeight: 1.4,
    letterSpacing: '.06em',
    textTransform: 'uppercase',
    textAlign: 'center',
    overflowWrap: 'anywhere',
  },

  mergingNotice: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
    width: 'fit-content',
    maxWidth: 'calc(100% - 24px)',
    marginInline: 'auto',
    boxSizing: 'border-box',
    zIndex: 30,
    pointerEvents: 'none',
    padding: '6px 10px',
    background: t.paper,
    border: `1px solid ${t.paper}`,
    borderRadius: 2,
    color: t.ink,
    fontFamily: t.fontMono,
    fontSize: 9,
    lineHeight: 1.4,
    textTransform: 'uppercase',
    textAlign: 'center',
    overflowWrap: 'anywhere',
  },

  modalScrim: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(17,18,17,.78)',
    zIndex: 99998,
  },

  matchModal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: 340,
    backgroundColor: t.paper,
    border: `1px solid ${t.ink}`,
    borderRadius: 4,
    boxShadow: '0 18px 48px rgba(0,0,0,.25)',
    padding: '30px 24px 24px',
    textAlign: 'left',
    zIndex: 99999,
    overflow: 'hidden',
  },

  confettiAmber: {
    position: 'absolute',
    top: 18,
    left: 20,
    width: 12,
    height: 12,
    borderRadius: 0,
    background: t.yellow,
    border: `1px solid ${t.ink}`,
  },

  confettiCoral: {
    position: 'absolute',
    top: 26,
    right: 24,
    width: 10,
    height: 10,
    borderRadius: 0,
    background: t.coral,
    border: `1px solid ${t.ink}`,
  },

  confettiSage: {
    position: 'absolute',
    bottom: 78,
    left: 28,
    width: 10,
    height: 10,
    borderRadius: 0,
    background: t.green,
    border: `1px solid ${t.ink}`,
  },

  confettiConcrete: {
    position: 'absolute',
    bottom: 88,
    right: 30,
    width: 12,
    height: 12,
    borderRadius: 0,
    background: t.pink,
    border: `1px solid ${t.ink}`,
  },

  matchIcon: {
    width: 72,
    height: 72,
    margin: '0 0 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: t.yellow,
    border: `1px solid ${t.ink}`,
    borderRadius: 4,
  },

  matchTitle: {
    fontFamily: t.fontHeavy,
    fontSize: 34,
    lineHeight: .9,
    fontWeight: 800,
    color: t.ink,
    margin: '0 0 10px',
    letterSpacing: '-.015em',
    textTransform: 'uppercase',
  },

  matchBody: {
    fontFamily: t.fontBody,
    fontSize: 13,
    fontWeight: 500,
    color: t.ink2,
    margin: '0 0 24px',
    lineHeight: 1.7,
  },

  matchActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },

  openChatButton: {
    width: '100%',
    padding: 15,
    background: t.coral,
    color: t.ink,
    border: `1px solid ${t.ink}`,
    borderRadius: 2,
    boxShadow: 'none',
    fontFamily: t.fontMono,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '.12em',
    textTransform: 'uppercase',
    cursor: 'pointer',
  },

  keepBrowsingButton: {
    width: '100%',
    padding: 15,
    background: 'transparent',
    color: t.ink,
    border: `1px solid ${t.hair}`,
    borderRadius: 2,
    fontFamily: t.fontMono,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '.12em',
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
};

export default Discover;
