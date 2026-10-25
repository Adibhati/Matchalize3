
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import neu from '../styles/neu';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import ProfileCard from '../components/ProfileCard';
import { closeAllPopouts } from '../components/PopoutItem';
import DeckActions from '../components/DeckActions';
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
  LOCATION_PREFERENCE_UPDATED_EVENT,
} from '../utils/locationSync';
import shuffle from '../utils/shuffle';
import socket from '../utils/socket';
import LocationNotice from '../components/LocationNotice';
import {
  RotateCw, Compass, AlertTriangle, Heart, Undo2, X,
} from 'lucide-react';

/* Neubrutalist design tokens inspired by the supplied reference; preserve neu token compatibility. */
const t = {
  ...neu,
  ink: '#171414',
  ink2: '#393130',
  ink3: '#6E6160',
  paper: '#FFF9F4',
  card: '#FFFCF8',
  desk: '#FFF9F4',
  yellow: '#FFE76A',
  coral: '#FF7399',
  green: '#B8F0C7',
  pink: '#C8A7FF',
  red: '#D9485D',
  hair: '#171414',
  line: 'rgba(23, 20, 20, .22)',
  fontHeavy: "'Barlow Condensed', sans-serif",
  fontBody: "'Space Grotesk', sans-serif",
  fontMono: "'IBM Plex Mono', monospace",
};

const MAX_GATE_RETRIES = 2;

const Discover = ({
  onSheetNearHeader,
  onGoToProfile,
  onPhoneReplyKeyboardChange,
  isTabletLayout = false,
}) => {
  const isDesktop = useIsDesktop();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [deckExhausted, setDeckExhausted] = useState(false);
  const [appendFetchFailed, setAppendFetchFailed] = useState(false);
  const [rebuiltAt, setRebuiltAt] = useState(0);
  const [undoNonce, setUndoNonce] = useState(0);
  const [undoAvailable, setUndoAvailable] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [actionFlash, setActionFlash] = useState(null);
  const stageRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const [merging, setMerging] = useState(false);

  const actionPendingRef = useRef(false);
  const waitingForDeckStateRef = useRef(null);
  const servedRef = useRef(0);
  const rebuiltTimer = useRef(null);
  const { user: myUser } = useAuth();

  const [locationRead, setLocationRead] = useState(null);

  const [showLearnMore, setShowLearnMore] = useState(false);
  const config = useAppConfig();

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
        setAppendFetchFailed(false);
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
            return true;
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
        return true;
      } catch (err) {
        console.error('Failed to fetch deck profiles:', err);
        if (!append) setError(err.message || 'Something went wrong');
        else setAppendFetchFailed(true);
        return false;
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

  const rebuildDeckForLocation = useCallback(async () => {
    if (deckFetchInFlight.current) await deckFetchInFlight.current;
    clearTimeout(rebuiltTimer.current);
    resetDiscoverStore();
    setProfiles([]);
    setCurrentIndex(0);
    setHasMore(true);
    setDeckExhausted(false);
    servedRef.current = 0;

    await fetchProfiles(false);
  }, [fetchProfiles]);

  useEffect(() => {
    let alive = true;
    let checkingLocation = false;
    let hiddenAt = document.visibilityState === 'hidden' ? Date.now() : null;

    const checkLocation = async (releaseTemporaryGrant = false) => {
      if (checkingLocation) return;
      checkingLocation = true;

      try {
        if (releaseTemporaryGrant) await releaseEphemeralLocation();
        const savedLocation = await api.get('/users/location');
        if (!alive) return;
        setLocationRead(savedLocation ?? null);

        // The saved preference is authoritative. Never read GPS in college mode.
        if (savedLocation?.locationSource !== 'gps') return;

        const result = await syncLocationIfPermitted();
        if (!alive || !result.ok) return;

        const refreshedLocation = await api.get('/users/location');
        if (!alive) return;
        setLocationRead(refreshedLocation ?? null);

        if (result.moved) await rebuildDeckForLocation();
      } catch (error) {
        console.warn('Could not refresh the Deck location state:', error);
      } finally {
        checkingLocation = false;
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
        return;
      }
      if (hiddenAt !== null && Date.now() - hiddenAt >= 5 * 60 * 1000) {
        void checkLocation();
      }
      hiddenAt = null;
    };

    const onLocationPreferenceUpdated = async (event) => {
      try {
        const savedLocation = await api.get('/users/location');
        if (!alive) return;
        setLocationRead(savedLocation ?? null);
        if (event.detail?.moved) await rebuildDeckForLocation();
      } catch (error) {
        console.warn('Could not update the Deck location preference:', error);
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener(LOCATION_PREFERENCE_UPDATED_EVENT, onLocationPreferenceUpdated);
    void checkLocation(true);

    return () => {
      alive = false;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener(LOCATION_PREFERENCE_UPDATED_EVENT, onLocationPreferenceUpdated);
    };
  }, [myUser?._id, rebuildDeckForLocation]);

  useEffect(() => () => {
    clearTimeout(rebuiltTimer.current);
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
      return;
    }

    if (currentIndex >= profiles.length) return;

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

  const runActionTransition = useCallback(async (action, targetIndex, direction) => {
    const waitingAction = action === 'pass' ? 'pass' : action === 'undo' ? 'undo' : 'align';
    waitingForDeckStateRef.current = { targetIndex, action: waitingAction };

    const isMatch = action === 'match';
    if (reduceMotion) {
      handleNextProfile(direction, true);
      return;
    }

    const stage = stageRef.current;
    const stageRect = stage?.getBoundingClientRect();
    const fullViewport = isMatch || (!isDesktop && !isTabletLayout);
    const transitionTarget = fullViewport
      ? null
      : stage?.querySelector('.pc-heroWrap');
    const phoneNav = fullViewport
      ? document.querySelector('nav[aria-label="Primary"]')
      : null;
    const phoneNavTop = phoneNav?.getBoundingClientRect().top ?? window.innerHeight;
    const targetRect = fullViewport
        ? { left: 0, top: 0, width: window.innerWidth, height: phoneNavTop }
        : transitionTarget?.getBoundingClientRect() ?? stageRect;
    const buttonLabel = action === 'pass'
      ? 'Pass this profile'
      : action === 'undo'
        ? 'Go to previous profile — available for 5 seconds'
        : 'Like this profile';
    const button = [...(stage?.querySelectorAll('button[aria-label]') || [])]
      .find((candidate) => candidate.getAttribute('aria-label') === buttonLabel
        && candidate.getClientRects().length > 0);
    const buttonRect = button?.getBoundingClientRect();
    const rawOriginX = targetRect && buttonRect
      ? buttonRect.left + buttonRect.width / 2 - targetRect.left
      : (targetRect?.width ?? 0) / 2;
    const rawOriginY = targetRect && buttonRect
      ? buttonRect.top + buttonRect.height / 2 - targetRect.top
      : (targetRect?.height ?? 0) / 2;
    const width = targetRect?.width ?? 0;
    const height = targetRect?.height ?? 0;
    const originX = Math.min(Math.max(rawOriginX, 0), width);
    const originY = Math.min(Math.max(rawOriginY, 0), height);
    const diameter = 2 * Math.max(
      Math.hypot(originX, originY),
      Math.hypot(width - originX, originY),
      Math.hypot(originX, height - originY),
      Math.hypot(width - originX, height - originY),
    ) + 24;
    const color = isMatch
      ? t.coral
      : action === 'pass'
        ? t.red
        : action === 'undo'
          ? t.yellow
          : '#5BD98A';

    setActionFlash({
      phase: 'expand',
      left: (targetRect?.left ?? stageRect?.left ?? 0) - (stageRect?.left ?? 0),
      top: (targetRect?.top ?? stageRect?.top ?? 0) - (stageRect?.top ?? 0),
      width,
      height,
      originX,
      originY,
      diameter,
      color,
      action,
      fullViewport,
    });

    await new Promise((resolve) => setTimeout(resolve, 300));
    handleNextProfile(direction, true);
    await new Promise((resolve) => setTimeout(resolve, 320));
    if (isMatch) {
      setActionFlash(null);
      return;
    }
    setActionFlash((current) => current ? { ...current, phase: 'reveal' } : current);
    await new Promise((resolve) => setTimeout(resolve, 280));
    setActionFlash(null);
  }, [handleNextProfile, isDesktop, isTabletLayout, reduceMotion]);

  const handleUndo = useCallback(async () => {
    if (actionPendingRef.current || currentIndex <= 0) return false;
    const previousProfile = profiles[currentIndex - 1];
    if (!previousProfile?._id) return false;

    actionPendingRef.current = true;
    setActionPending(true);
    try {
      await api.post(`/discover/undo/${previousProfile._id}`, {});
      setUndoAvailable(false);
      await runActionTransition('undo', currentIndex - 1, 'down');
      return true;
    } catch (err) {
      console.error('Undo pass failed:', err);
      if (!err?.toasted) toast.error('Could not undo this pass. Please try again.');
      actionPendingRef.current = false;
      setActionPending(false);
      return false;
    }
  }, [currentIndex, profiles, runActionTransition]);

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
    setActionPending(true);
    let waitingForNextState = false;

    try {
      if (action === 'align') {
        triggerHaptic('heavy');
        const response = await api.post(`/discover/align/${profile._id}`, payload);

        if (response.matched) {
          if (!response.alignmentId || !response.user?._id || !response.user?.name) {
            throw new Error('Mutual align response is missing the match details.');
          }
          waitingForNextState = true;
          await runActionTransition('match', currentIndex + 1, 'up');
          return;
        }
      } else if (action === 'pass') {
        triggerHaptic('medium');
        await api.post(`/discover/pass/${profile._id}`);
        waitingForNextState = true;
        await runActionTransition('pass', currentIndex + 1, 'none');
        return;
      }

      waitingForNextState = true;
      await runActionTransition('like', currentIndex + 1, 'up');
    } catch (err) {
      actionPendingRef.current = false;
      setActionPending(false);
      if (err.code === 'GATED') {
        toast.info(
          `Finish your profile to interact — you need ${readLadder(config).interact}%.`,
          { label: 'Profile', onClick: () => onGoToProfile?.() },
        );
        return;
      }
      if (err.code === 'DAILY_ALIGN_LIMIT') return;
      console.error('Action failed:', err);
      if (!err?.toasted) {
        toast.error(action === 'align'
          ? 'Could not send the align request. Please try again.'
          : 'Could not pass on this profile. Please try again.');
      }
    } finally {
      if (!waitingForNextState) {
        actionPendingRef.current = false;
        setActionPending(false);
      }
    }
  }, [
    currentIndex,
    profiles,
    deckGated,
    config,
    loadMyProfile,
    onGoToProfile,
    runActionTransition,
  ]);

  useEffect(() => {
    const waiting = waitingForDeckStateRef.current;
    if (!waiting) return;
    if (actionFlash !== null) return;

    if (waiting.targetIndex !== currentIndex) {
      waitingForDeckStateRef.current = null;
      actionPendingRef.current = false;
      setActionPending(false);
      return;
    }

    const nextProfileReady = Boolean(profiles[currentIndex]);
    const endStateReady = currentIndex >= profiles.length
      && !fetchingMore
      && (!hasMore || deckExhausted || appendFetchFailed);
    if (!nextProfileReady && !endStateReady) return;

    if (waiting.action === 'pass') {
      setUndoAvailable(true);
      setUndoNonce((nonce) => nonce + 1);
    } else if (waiting.action === 'align') {
      setUndoAvailable(false);
    }

    waitingForDeckStateRef.current = null;
    actionPendingRef.current = false;
    setActionPending(false);
  }, [
    currentIndex, profiles, fetchingMore, hasMore, deckExhausted, appendFetchFailed,
    actionFlash,
  ]);

  useEffect(() => {
    if (!isDesktop) return;
    const next = profiles[currentIndex + 1]?.photos?.[0];
    if (!next) return;

    const img = new Image();
    img.decoding = 'async';
    img.src = next;
  }, [isDesktop, profiles, currentIndex]);

  if (loading) {
    return (
      <div style={styles.loadingRoot}>
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

  if (currentIndex >= profiles.length && fetchingMore) {
    return (
      <div style={styles.loadingRoot}>
        <style>{DECK_CSS}</style>
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

          <h3 style={styles.stateTitle}>
            {appendFetchFailed ? 'Could not load more profiles' : "You're all caught up"}
          </h3>
          <p style={styles.stateBody}>
            {appendFetchFailed
              ? 'Check your connection and try loading the deck again.'
              : deckExhausted
              ? "You've seen everyone who fits right now. New people join all the time — check back later."
              : "You've reviewed everyone for now. Check back later — new people land all the time."}
          </p>

          {(appendFetchFailed || !deckExhausted) && (
            <button
              onClick={() => fetchProfiles(appendFetchFailed)}
              className="slam-btn"
              style={styles.slamBtn}
            >
              <RotateCw size={14} strokeWidth={2.5} /> {appendFetchFailed ? 'Try again' : 'Refresh'}
            </button>
          )}
        </div>
        <DeckActions
          placement={isDesktop || isTabletLayout ? 'desktop' : 'mobile'}
          onUndo={handleUndo}
          canGoBack={currentIndex > 0}
          undoNonce={undoNonce}
          undoAvailable={undoAvailable}
          actionsDisabled={actionPending}
          showPassButton={false}
          showAlignButton={false}
        />
      </div>
    );
  }

  return (
    <div
      data-popout-affected-region
      aria-busy={actionPending || undefined}
      style={{ ...styles.viewportRoot, ...(isDesktop ? styles.viewportRootDesktop : null) }}
    >
      <style>{DECK_CSS}</style>

      <ShadowbanBanner
        isUnderReview={myUser?.isUnderReview}
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
            const refreshedLocation = await api.get('/users/location');
            setLocationRead(refreshedLocation ?? null);
            if (moved) await rebuildDeckForLocation();
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

      {merging && !loading && (
        <div aria-live="polite" style={styles.mergingNotice}>
          Updating…
        </div>
      )}

      <div
        ref={stageRef}
        className={isDesktop ? 'discover-desktop-stage' : isTabletLayout ? 'discover-tablet-stage' : 'discover-mobile-stage'}
        style={{
          ...styles.stageContainer,
          ...(isDesktop ? styles.stageContainerDesktopNoPad : null),
        }}
      >
        <div style={isDesktop ? styles.deckColumnDesktop : isTabletLayout ? styles.deckColumnTablet : styles.deckColumnMobile}>
          {isTabletLayout && profiles[currentIndex] && (
            <div className="discover-tablet-layout">
              <div className="discover-tablet-card-frame">
                <div
                  key={profiles[currentIndex]._id || profiles[currentIndex].id}
                  style={styles.cardMotionLayer}
                >
                  <ProfileCard
                    profile={profiles[currentIndex]}
                    onAction={handleAction}
                    onSheetNearHeader={onSheetNearHeader}
                    isGated={deckGated}
                    isTabletLayout
                    onPhoneReplyKeyboardChange={onPhoneReplyKeyboardChange}
                  />
                </div>
              </div>
              <DeckActions
                placement="desktop"
                onPass={() => handleAction('pass')}
                onAlign={() => handleAction('align', {})}
                canAlign={!!profiles[currentIndex]}
                onUndo={handleUndo}
                canGoBack={currentIndex > 0}
                undoNonce={undoNonce}
                undoAvailable={undoAvailable}
                actionsDisabled={actionPending}
              />
            </div>
          )}
          {!isTabletLayout && (
            profiles[currentIndex] && (
                <div
                  key={profiles[currentIndex]._id || profiles[currentIndex].id}
                  style={{
                    ...styles.cardMotionLayer,
                    ...(isDesktop ? { left: 68 } : null),
                  }}
                >
                  <ProfileCard
                    profile={profiles[currentIndex]}
                    onAction={handleAction}
                    onSheetNearHeader={onSheetNearHeader}
                    isGated={deckGated}
                    isDesktop={isDesktop}
                    onPhoneReplyKeyboardChange={onPhoneReplyKeyboardChange}
                  />
                </div>
            )
          )}
          {isDesktop && profiles[currentIndex] && (
            <DeckActions
              placement="desktop"
              onPass={() => handleAction('pass')}
              onAlign={() => handleAction('align', {})}
              canAlign={!!profiles[currentIndex]}
              onUndo={handleUndo}
              canGoBack={currentIndex > 0}
              undoNonce={undoNonce}
              undoAvailable={undoAvailable}
              actionsDisabled={actionPending}
            />
          )}
        </div>

        {!isDesktop && !isTabletLayout && (
          <DeckActions
            onPass={() => handleAction('pass')}
            onAlign={() => handleAction('align', {})}
            canAlign={!!profiles[currentIndex]}
            onUndo={handleUndo}
            canGoBack={currentIndex > 0}
            undoNonce={undoNonce}
            undoAvailable={undoAvailable}
            actionsDisabled={actionPending}
          />
        )}

        {actionFlash && (() => {
          const overlay = (
            <div
              aria-hidden="true"
              style={{
                position: actionFlash.fullViewport ? 'fixed' : 'absolute',
                top: actionFlash.fullViewport ? 0 : actionFlash.top,
                left: actionFlash.fullViewport ? 0 : actionFlash.left,
                width: actionFlash.fullViewport ? '100vw' : actionFlash.width,
                height: actionFlash.height,
                borderRadius: 0,
                overflow: 'hidden',
                zIndex: actionFlash.fullViewport ? 10000 : 3,
                pointerEvents: actionFlash.fullViewport ? 'auto' : 'none',
                background: 'transparent',
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.3,
                  ease: 'easeInOut',
                }}
                style={{
                  position: 'absolute',
                  width: actionFlash.diameter,
                  height: actionFlash.diameter,
                  left: actionFlash.originX - actionFlash.diameter / 2,
                  top: actionFlash.originY - actionFlash.diameter / 2,
                  borderRadius: '28%',
                  background: actionFlash.color,
                  transformOrigin: 'center',
                }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.72 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  opacity: { duration: 0.12, delay: 0.24 },
                  scale: { duration: 0.18, ease: 'easeOut' },
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: actionFlash.action === 'undo' ? t.ink : '#fff',
                }}
              >
                {actionFlash.action === 'pass'
                  ? <X size={64} strokeWidth={3.2} />
                  : actionFlash.action === 'undo'
                    ? <Undo2 size={64} strokeWidth={3.2} />
                    : <Heart size={64} fill="currentColor" strokeWidth={3.2} />}
              </motion.div>
            </div>
          );
          return actionFlash.fullViewport ? createPortal(overlay, document.body) : overlay;
        })()}
      </div>

    </div>
  );
};

const DECK_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

  /* Keep the iOS safe-area/status-bar backdrop in warm cream, not a full-bleed pink band. */
  html, body, #root { background-color: #FFF9F4 !important; }

  .slam-btn {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    transition: transform .14s ease, box-shadow .14s ease, background-color .14s ease, border-color .14s ease, opacity .14s ease;
    border: 2px solid #171414;
    border-radius: 16px;
    box-shadow: 4px 4px 0 #171414;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }

  .slam-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    min-height: 48px;
    padding: 13px 20px;
    font-family: ${t.fontMono};
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .07em;
    text-transform: uppercase;
    cursor: pointer;
    color: ${t.ink};
  }

  .slam-btn:focus-visible {
    outline: 3px solid ${t.pink};
    outline-offset: 4px;
  }

  @media (hover: hover) and (pointer: fine) {
    .slam-btn:hover {
      transform: translate(-2px, -2px);
      box-shadow: 6px 6px 0 #171414;
      filter: saturate(1.04);
    }
  }

  .slam-btn:active {
    transform: translate(3px, 3px) !important;
    box-shadow: 1px 1px 0 #171414 !important;
  }

  .discover-mobile-stage,
  .discover-tablet-stage,
  .discover-desktop-stage {
    flex: 1;
    min-height: 0;
    min-width: 0;
  }

  @media (min-width: 768px) {
    .discover-desktop-stage {
      width: 100%;
      padding: 16px 24px 8px !important;
    }
  }

  .discover-tablet-stage {
    padding: 10px 16px !important;
  }

  .discover-tablet-layout {
    --tablet-card-width: min(460px, calc((100dvh - 20px) * 0.64), calc(100% - 68px));
    --tablet-card-height: min(700px, calc(100dvh - 20px));
    position: absolute;
    top: 50%;
    left: 50%;
    width: calc(var(--tablet-card-width) + 68px);
    height: var(--tablet-card-height);
    max-width: 100%;
    transform: translate(-50%, -50%);
  }

  .discover-tablet-card-frame {
    position: absolute;
    top: 0;
    left: 68px;
    width: var(--tablet-card-width);
    max-width: none;
    height: 100%;
    margin: 0;
    box-sizing: border-box;
    min-width: 0;
    min-height: 260px;
    overflow: visible;
  }

  @media (max-width: 760px) {
    .discover-mobile-stage { padding: 0 !important; }
  }

  @media (max-height: 680px) and (min-width: 761px) {
    .discover-desktop-stage { padding-top: 8px !important; padding-bottom: 4px !important; }
  }

  @media (prefers-reduced-motion: reduce) {
    .slam-btn { transition: none !important; }
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
    background: '#FFF9F4',
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
    background: '#FFF9F4',
    position: 'relative',
  },

  viewportRoot: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    background: '#FFF9F4',
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
    maxWidth: 920,
    padding: '14px 20px 8px',
    margin: '0 auto',
    boxSizing: 'border-box',
  },

  stageContainerDesktopNoPad: {
    width: '100%',
    maxWidth: 920,
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
    overflow: 'visible',
  },

  deckColumnTablet: {
    position: 'relative',
    display: 'block',
    width: '100%',
    maxWidth: 1000,
    height: '100%',
    minHeight: 0,
    minWidth: 0,
    overflow: 'visible',
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

  stateCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: t.paper,
    border: `2px solid ${t.ink}`,
    borderRadius: 22,
    boxShadow: '6px 6px 0 #171414',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    padding: '30px 24px 26px',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },

  stateTile: {
    width: 48,
    height: 48,
    borderRadius: 12,
    border: `2px solid ${t.ink}`,
    boxShadow: '3px 3px 0 #171414',
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
    color: '#171414',
    border: `2px solid ${t.ink}`,
    borderRadius: 13,
    boxShadow: '4px 4px 0 #171414',
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
    borderRadius: 12,
    background: '#FFF9F4',
    border: `2px solid ${t.ink}`,
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
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
    background: '#FFF9F4',
    border: `2px solid ${t.ink}`,
    borderRadius: 12,
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    color: t.ink,
    fontFamily: t.fontMono,
    fontSize: 9,
    lineHeight: 1.4,
    textTransform: 'uppercase',
    textAlign: 'center',
    overflowWrap: 'anywhere',
  },

};

export default Discover;
