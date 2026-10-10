# Chunk 13 — Client Pages

> Matchalize · `client-pages` · files 13 of 25 chunks · 2 file(s) · 76 KB · ~22,093 tokens
> Generated 2026-10-09 14:03.
> Paste-safe: within the 100 KB / ~29,257 token target.
>
> Contains:
> - `./client/src/pages/Discover.jsx`
> - `./client/src/pages/Matches.jsx`

---
### ./client/src/pages/Discover.jsx

```
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { discoverStore, initDiscoverStore, saveDiscoverStore, resetDiscoverStore } from '../utils/discoverStore';
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

/* Locked tokens — neubrutalism, same family as ProfileCard */
const t = {
  desk: '#131313',
  paper: '#FFF9EC',
  card: '#FFFFFF',
  ink: '#191919',
  ink2: '#5F5B52',
  ink3: '#A39E92',
  hair: '#EBE5D6',
  yellow: '#FFD43D',
  coral: '#FF7A59',
  green: '#5BD98A',
  pink: '#FFA3C6',
  red: '#E5484D',
  fontHeavy: "'Archivo Black', 'Arial Black', sans-serif",
  fontBody: "'Inter', -apple-system, 'Segoe UI', sans-serif",
  fontMono: "'Space Mono', 'Courier New', monospace",
};

const slideVariants = {
  enter: (direction) => ({
    opacity: 0,
    scale: 0.92,
    filter: 'blur(12px)',
    zIndex: 2,
  }),
  center: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    zIndex: 2,
  },
  exit: (direction) => ({
    opacity: 0,
    scale: 0.95,
    filter: 'blur(8px)',
    zIndex: 1,
  }),
};

const springTransition = {
  type: 'spring',
  stiffness: 220,
  damping: 18,
  mass: 1,
};

/* How many times the gate will re-read `/auth/me` on its own before handing
   recovery to the online/visibility listeners. See the backoff effect below. */
const MAX_GATE_RETRIES = 2;

/* `onGoToProfile` — raised by the gate toast's action button. Navigating is the
   PARENT's job: Discover doesn't own the tab bar, and routing from here would
   mean reaching into AppShell's state. */
const Discover = ({ onOpenChat, onSheetNearHeader, onGoToProfile }) => {
  const isDesktop = useIsDesktop();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  /* Nobody eligible is left in the system. Distinct from hasMore=false: that
     only means "this page is the last one for now", which the prefetcher
     resolves on its own. This means there is genuinely nothing behind it, and
     paging further would loop the user over people they have already seen. */
  const [deckExhausted, setDeckExhausted] = useState(false);
  /* Set when the server re-decided the deck order mid-browse (new session,
     expired session, or window extension). Drives the brief "showing newer
     profiles" line — deliberately NOT a button. See the decision that no
     dating app exposes a user-triggered re-roll. */
  const [rebuiltAt, setRebuiltAt] = useState(0);
  const [slideDirection, setSlideDirection] = useState('up');
  const [undoNonce, setUndoNonce] = useState(0);   /* bump to re-arm the 5s undo */
  const [merging, setMerging] = useState(false); /* subtle Updating pill during the background reconcile */
  const [locationDenied, setLocationDenied] = useState(false);
  const [showAlignmentModal, setShowAlignmentModal] = useState(false);
  const [alignedProfile, setAlignedProfile] = useState(null);

  const actionPendingRef = useRef(false);

  /* How many cards the server has actually served this viewer, so the next page
     request can number its impressions by true deck position. A ref rather than
     state: it changes on every fetch and nothing renders from it, and putting it
     in state would make `fetchProfiles` depend on itself. */
  const servedRef = useRef(0);
  /* Holds the dismiss timer for the "Showing newer profiles" notice. A ref, not
     state: the timer identity must survive re-renders without itself causing
     one. */
  const rebuiltTimer = useRef(null);
  const { user: myUser } = useAuth();

  /* 📍 WHAT THE SERVER IS ACTUALLY RANKING BY.
   *
   * `myUser.locationSource` is a stored preference: 'gps' means a reading was
   * saved once, possibly weeks ago. The ranking pipeline uses a reading only if
   * it is still inside the 30-day TTL, so the preference and the behaviour can
   * disagree — and when they do, the stored preference is the one that lies.
   *
   * This reads the server's own answer, which is derived from the same
   * `isFreshLocation` the pipeline uses. Until it arrives `active` is null and
   * neither notice renders, so there is no flash of a claim we have not checked
   * yet — the wrong first impression is worse than a half-second of silence. */
  const [locationRead, setLocationRead] = useState(null);
  useEffect(() => {
    if (!myUser?._id) return;
    let alive = true;
    api.get('/users/location')
      .then((r) => { if (alive) setLocationRead(r ?? null); })
      .catch(() => { /* Offline or restarting. The notice is an optimisation;
                         failing to read it must never hide the deck. */ });
    return () => { alive = false; };
  }, [myUser?._id]);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const shadowbanScore = myUser?.shadowbanScore || 0;

  const config = useAppConfig();

  /* 📍 REBUILD STATE FOR A LOCATION CHANGE.
   *
   * One flag, not two. A separate `rebuilding` flag was here and was never read
   * by anything — set, then dead. `rebuildOverlay` alone is enough: it is the
   * only rebuild state any consumer needs, and `profiles` already goes to `[]`
   * during a rebuild so there is nothing to interact with. */
  const [rebuildOverlay, setRebuildOverlay] = useState(false);
  const rebuildOverlayTimer = useRef(null);

  /* The viewer's own profile — the ONLY thing in Discover that needs it, since
     the deck cards are other people's profiles.

     `myProfileState` exists so a real 0% is distinguishable from a failed read.
     These used to be the same thing (`myProfile === null` → score 0), which let
     the gate toast announce "You're at 0%" after a single dropped request —
     a number we never fetched, stated as fact. State is separate now:
       loading → we don't know yet
       ready   → we have a score, however small
       error   → the read failed; the gate still shows, but the copy doesn't lie */
  const [myProfile, setMyProfile] = useState(null);
  const [myProfileState, setMyProfileState] = useState('loading'); // loading | ready | error
  const myProfileScore = myProfile?.profileScore ?? 0;

  /* The single gate decision, derived once and handed to both the card and the
     action handler. Two things consume it, so it must not be recomputed
     independently in each — the card needs it to know not to play its seal
     animation, and the handler needs it to know not to send.

     Fail-closed and deliberately unchanged: an unreadable profile is treated as
     not-verified, because the alternative is silently leaving the deck fully
     interactive for anyone we can't score. Only the COPY became honest about
     uncertainty; the gate itself still refuses to open on a guess. */
  const deckGated = !canInteract(myProfileScore, config);

  const loadMyProfile = useCallback(async () => {
    // Only surface 'loading' again if we'd already failed — flipping back to
    // loading on every retry would make the deck flicker through an error state
    // we already recovered from.
    setMyProfileState((s) => (s === 'error' ? 'loading' : s));
    try {
      const me = await api.get('/auth/me');
      setMyProfile(me);
      setMyProfileState('ready');
      return me;
    } catch {
      // Deliberately NOT nulled on failure, same reasoning as the college list
      // in Auth.jsx: a blip after a good read should not wipe a score we already
      // have. The error state is what tells the toast not to quote a number.
      setMyProfileState('error');
      return null;
    }
  }, []);

  useEffect(() => { loadMyProfile(); }, [loadMyProfile]);

  /* Recover from a failed read instead of stranding the deck at "0%" until the
     tab remounts. Both events mean "the network situation probably changed":
     `online` for a dropped connection, `visibilitychange` for a phone that
     went to sleep mid-request. Same shape as the college retry in Auth.jsx. */
  useEffect(() => {
    const onOnline = () => loadMyProfile();
    const onVisible = () => { if (document.visibilityState === 'visible') loadMyProfile(); };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [loadMyProfile]);

  /* Bounded backoff for the initial failure, so a server that isn't up yet
     doesn't leave the deck permanently at "unknown" until someone toggles the
     tab. The cap is load-bearing, not decoration: `loadMyProfile` flips state
     back to 'error' on every failure, so an uncapped effect would re-arm itself
     forever and poll a dead server every 2.5s for the life of the tab. After
     MAX_GATE_RETRIES the online/visibility listeners above own recovery. */
  const gateRetries = useRef(0);
  useEffect(() => {
    if (myProfileState !== 'error') return undefined;
    if (gateRetries.current >= MAX_GATE_RETRIES) return undefined;
    gateRetries.current += 1;
    const t = setTimeout(() => loadMyProfile(), 2500);
    return () => clearTimeout(t);
  }, [myProfileState, loadMyProfile]);

  /* A successful read earns the retries back — otherwise a user whose network
     dropped once during onboarding would burn through the budget and lose the
     self-healing the backoff exists to provide. */
  useEffect(() => {
    if (myProfileState === 'ready') gateRetries.current = 0;
  }, [myProfileState]);

  /* Guards against StrictMode's double mount and the Profile→Discover
     remount: a second call while one is in flight awaits the same request
     instead of starting a parallel one (which the server answered 500s to). */
  const deckFetchInFlight = useRef(null);

  const fetchProfiles = useCallback(async (append = false) => {
    if (deckFetchInFlight.current) return deckFetchInFlight.current;
    const run = (async () => {
    if (!append) { setLoading(true); setError(null); resetDiscoverStore(); }
    else setFetchingMore(true);

    try {
      // The feed is platform-wide and person-ranked. There is no campus
      // narrowing: campus is verification and a card badge only, so nothing
      // about it is sent. Distance comes from each person's own location on the
      // server, falling back to their campus coordinates server-side when they
      // have no fresh reading — the client never decides that.
      //
      // `served` is the count of cards already shown to this viewer this
      // session. The server needs it to number each impression by its real
      // position in the deck; without it every page would restart at 0 and
      // "how deep did they get" would be meaningless. Sent on append only —
      // a fresh (non-append) load starts a new deck, so it starts at 0 too.
      const servedCount = append ? servedRef.current : 0;
      const q = `/discover?limit=10&served=${servedCount}`;
      const data = await api.get(q);
      /* 🃏 SHUFFLE THE INCOMING BATCH ONLY — never the accumulated list.

         The server's order is meaningful: distance band, then intent, then
         quality, and then two rules that deliberately STEP reserved cards
         through the window rather than front-loading them (the 20% own-college
         cap and the newcomer reserve). Those steps land on a regular stride, so
         the same college and the same newcomers recur at the same offsets in
         every batch. A user learns the shape of the feed without noticing they
         are learning it.

         Shuffling the batch hides that stride while changing nothing else:

         ⚠️ Membership is untouched. The same ten people are shown in the same
         batch, so this cannot introduce a repeat, cannot change the cap, and
         cannot change who is eligible. Only the order within the page moves.

         ⚠️ Only the INCOMING batch, never `prev`. Shuffling the accumulated list
         would shift every index below the insertion point, so `currentIndex`
         would point at a different person mid-swipe and going back a card would
         show something that was never on screen.

         ⚠️ Once per fetch, not per render. Shuffling in a render path would
         reshuffle on every state change and cards would visibly jump.

         The impression log keeps the server's served order, not this visual one.
         That is deliberate: exposure VOLUME stays exact, and "which card did
         they see first" is not a question worth making the client report a
         position for. See the note on DeckImpression for the drift. */
      const newProfiles = shuffle(data.users || []);
      servedRef.current = Number.isFinite(data.served) ? data.served : servedCount + newProfiles.length;
      if (append) {
        /* 🛑 AN EMPTY PAGE ENDS THE FETCHING, regardless of what `hasMore` says.
         *
         * A response carrying no cards cannot advance anything, so asking again
         * would return no cards too — the request loop. If the server ever
         * reported "more available" alongside an empty page, this is what stops
         * the client acting on it.
         *
         * The server also refuses to set `hasMore` on an empty page, so this is a
         * second layer rather than the primary defence: if either side is ever
         * changed without the other, the deck still stops rather than spinning.
         *
         * ⚠️ `setDeckExhausted` MUST BE SET BEFORE THE `return`. This early exit
         * was originally written without it, which quietly undid a fix from
         * earlier in the session: `deckExhausted` gates the Refresh button on the
         * caught-up screen, so leaving it false put a Refresh button back on a
         * screen that had genuinely run out — a button that looks actionable and
         * does nothing, since the server only ever returns nothing again. Stopping
         * the request loop and hiding the dead button are the same fix; missing
         * one line here resurrected the bug the other one removed. */
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
      }
      else {
        /* A non-append request is a "start me a deck" request, but it can
           arrive when this viewer already HAS a live deck — StrictMode
           double-invokes this effect in development, and returning to Discover
           from Profile re-runs it too. The server cursor is mid-deck at that
           point, so the response legitimately holds only what is left AFTER the
           cards already on screen, which on a small pool is nothing.

           Replacing the list with an empty array would then blank a perfectly
           good deck and flash "You're all caught up" at someone who has four
           perfectly good cards. An empty response must never destroy a
           populated deck; the caught-up screen is for decks that were ALREADY
           empty. */
        if (newProfiles.length > 0) {
          setProfiles(newProfiles);
          setCurrentIndex(0);
          discoverStore.profiles = newProfiles;
          discoverStore.currentIndex = 0;
          discoverStore.hasMore = data.hasMore;
          saveDiscoverStore();
        }
      }

      /* ⚠️ UNCONDITIONAL, and deliberately outside the branches above.
       * `hasMore` and `deckExhausted` are a matched pair describing the END of
       * the deck, so they must be set the same way for every response — empty
       * page, full page, append or not. They used to be set inside the branch
       * bodies as well as here, so the branch values were immediately overwritten
       * by these: harmless, but it meant the state that actually took effect was
       * the duplicate rather than the one a reader would expect to be reading. */
      setHasMore(data.hasMore);
      setDeckExhausted(!!data.deckExhausted);

      /* Only surface the notice when this request actually re-decided the
         order. On the very first page load the deck was always new, so showing
         "showing newer profiles" then would be noise on every cold start. */
      if (data.rebuiltWindow && append) setRebuiltAt(Date.now());
      /* Auto-dismiss the notice. Without this the render-time `Date.now()` check
         never re-evaluates on its own, so the line would stay pinned forever —
         a timestamp comparison only changes the DOM when something causes a
         re-render, and nothing else would. */
      if (data.rebuiltWindow && append) {
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
    try { await run; } finally { deckFetchInFlight.current = null; }
    return run;
  }, []);


  /* 📍 Refresh the stored position and, if the server decides the move mattered,
     drop the saved session so the next deck request rebuilds around the new
     position. Both this and the auto-check below are one-shot reads: nothing is
     watched, and nothing here can break the deck if it fails. */
  const refreshLocation = useCallback(async () => {
    const res = await syncLocationIfPermitted();
    /* ⚠️ `toast` is an OBJECT with .success/.error/.info — not a bare function.
       Calling `toast(...)` throws "toast is not a function" on tap. */
    if (!res.ok) {
      if (res.reason === 'denied') setLocationDenied(true);
      toast.error(
        res.reason === 'denied' ? 'Location permission was denied. Enable it in browser settings.'
        : res.reason === 'insecure-context' ? 'Location only works on a secure connection.'
        : "Couldn't get a location reading. Try again, or check phone GPS settings.",
      );
      return;
    }
    if (!res.moved) { toast.info('Your location is already current.'); return; }

    /* The server has already discarded the session. Forget the cached deck too,
       or the client would keep rendering the old ordering until something
       happened to trigger a refetch. */
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

  /* 📍 REBUILD THE DECK WHEN THE ANCHOR LOCATION CHANGES.
   *
   * Called from LocationNotice once the server confirms the viewer moved. The
   * server has already discarded the saved session by then, so this only has to
   * drop the CLIENT's copy — `resetDiscoverStore()` — and pull a fresh page.
   * Without that, `initDiscoverStore` repaints the pre-move deck from
   * localStorage and returns early without ever asking the server, so the user
   * swipes the old city before the new one arrives. That is the bug this
   * function exists to close.
   *
   * The 250ms gate exists because a rebuild is not slow: measured deck fetches
   * run 44–280ms, around 110ms typical. A full-screen message shown for 110ms
   * reads as a glitch rather than as feedback. Fast rebuilds stay silent; only a
   * genuinely slow one earns the screen. */
  const rebuildDeckForLocation = useCallback(async () => {
    clearTimeout(rebuiltTimer.current);
    clearTimeout(rebuildOverlayTimer.current);
    /* Redundant on its own — `fetchProfiles(false)` clears the store too — but
       stated here so the reason this function exists is visible where it is
       decided rather than two frames away inside the fetcher. */
    resetDiscoverStore();
    setProfiles([]);
    setCurrentIndex(0);
    setHasMore(true);
    setDeckExhausted(false);
    servedRef.current = 0;
    rebuildOverlayTimer.current = setTimeout(() => setRebuildOverlay(true), 250);
    try {
      await fetchProfiles(false);
    } finally {
      /* The timer is cleared as well as the flag set false, otherwise the
         pending timeout fires afterwards and re-shows an overlay on a deck that
         has already finished rebuilding. */
      clearTimeout(rebuildOverlayTimer.current);
      setRebuildOverlay(false);
    }
  }, [fetchProfiles]);

  /* 📍 Hide the refresh-location button when the OS already said no — tapping
     it again would do exactly nothing, which reads as a bug. If the browser
     doesn't expose the permission API, leave the button as-is.

     ⚠️ ONLY `denied` HIDES THE BUTTON.
     `prompt` means the grant lapsed rather than being refused, and someone in
     that state is exactly who should be able to tap "refresh" — they chose yes
     once and would very likely choose yes again. Treating `prompt` as denied
     would leave them with no button and no explanation, having never declined
     anything.

     The mid-session `onchange` subscription lives with the automatic check
     below, which is the effect that owns location lifecycle on this screen;
     two subscriptions to the same PermissionStatus would double-fire. */
  useEffect(() => {
    if (!navigator?.permissions?.query) return;
    let alive = true;
    navigator.permissions.query({ name: 'geolocation' })
      .then((r) => {
        if (!alive) return;
        setLocationDenied(r.state === GEO_PERMISSION.DENIED);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  /* 📍 THE AUTOMATIC CHECK. Runs once per app open, silently.
     A one-shot permission prompt is all this ever is — see the rules at the top of
     utils/locationSync.js. No prompt appears here: if the user already granted
     location, the browser returns a cached or fresh reading without asking again,
     and if they did not, the read fails quietly and nothing changes.

The `moved` branch clears the cached deck and rebuilds. That is the case the
      whole feature exists for: someone who travelled while the app was closed
      would otherwise spend half an hour looking at a deck ordered around a place
      they are no longer at.

      ── WHY THE EPHEMERAL RELEASE HAPPENS HERE AND NOT ON THE FIRST FAILURE ──
      A lapsed one-time grant is released at the START of a visit, not the
      moment it lapses. Chrome expires "allow this time" after five minutes in a
      background tab, so reacting to the lapse would fire the location toast at
      someone who merely switched tabs for six minutes. At launch it means the
      user genuinely started a new visit without the permission they had before,
      which is exactly what "this time" was meant to cover. */
  useEffect(() => {
    let alive = true;

    /* 📍 A POSITION FROM AN EXPIRED ONE-TIME GRANT DOES NOT SURVIVE THE LAUNCH.
     *
     * Runs BEFORE the refresh, because the refresh may succeed with a fresh
     * reading and then this would have nothing to release. It only fires when the
     * browser reports `prompt` — a refusal reports `denied` and is left alone,
     * because refusing is a decision and this is an expiry. */
    (async () => {
      try {
        /* Only one refresh, and only after any release has settled. Two calls
           would ask the browser twice on every launch and race their own writes. */
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
        /* Never let location maintenance break the deck. */
      }
    })();

    return () => { alive = false; };
  }, []);

  /* 📍 CATCH A GRANT THAT EXPIRES MID-SESSION.
   *
   * Chrome's five-minute background rule means the permission can lapse while
   * the app is still open — the user switches tabs, comes back, and their stored
   * position is now uncovered. Nothing above would notice, because the refresh
   * already ran.
   *
   * The position is NOT released here. That would be the nagging case the launch
   * check exists to avoid: the user gets a toast for tabbing away. Recording it
   * as `needsRelease` is enough — the next launch releases it, and the notice
   * below re-evaluates on the next render because the server's `active` flag is
   * what mounts it. */
  useEffect(() => watchGeolocationPermission((state) => {
    /* A lapse is NOT a refusal, so it must not hide the refresh button — that is
       the one control someone who tapped "allow this time" can use to get their
       position back. Only `denied` disables the control. */
    setLocationDenied(state === GEO_PERMISSION.DENIED);
  }), []);

  /* Clear the rebuild-notice timer on unmount. Without this, navigating away
     mid-window leaves a live timeout that calls setState on a dead component.
     Harmless today, but a source of confusing warnings the moment this page is
     mounted twice — which the deck's own remount behaviour already does. */
  useEffect(() => () => {
    clearTimeout(rebuiltTimer.current);
    clearTimeout(rebuildOverlayTimer.current);
  }, []);

  /* ── DECK HYDRATION + REFRESH ──
     The cache exists so leaving the tab and coming back lands you on the SAME
     card, at the SAME index, with no spinner — that behaviour is load-bearing
     (the gate sends you to Profile and back).

     It was also serving that snapshot FOREVER: on a cache hit this returned
     before `fetchProfiles` ever ran, so a card you had edited stayed frozen at
     whatever it looked like when it was cached. Two accounts editing each other
     is the normal loop, so that read as "my save didn't work".

     So: paint the cache immediately, then reconcile with the server behind it.

     MERGE, not replace. `GET /discover` is randomised per request (a
     `randomSeed` range query around a fresh `Math.random()`), so replacing the
     list would reshuffle the deck and throw away the position we just restored.
     Patching by `_id` keeps order and index untouched while every card in the
     fresh batch becomes current. Cards the batch doesn't cover keep their
     cached copy rather than vanishing — a gap would shift everything below it. */
  const refreshMerged = useCallback(async () => {
    setMerging(true);
    try {
      const q = '/discover?limit=20';
      const data = await api.get(q);
      const fresh = data.users || [];
      if (fresh.length === 0) return;
      const byId = new Map(fresh.map((p) => [String(p._id), p]));
      setProfiles((prev) => {
        if (prev.length === 0) return prev;
        let changed = false;
        const next = prev.map((p) => {
          const f = byId.get(String(p._id));
          /* Keep `hybridScore`, which the deck computes per VIEWER. The merge
             response is viewer-specific too, so it does carry one — but the
             `profile-updated` broadcast cannot, and clobbering it with
             undefined would collapse every card to the bottom of the sort. */
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
      // Silent by design. This is a background reconciliation behind an
      // already-usable deck; failing it must not surface an error over cards
      // that are on screen and readable.
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

  /* ── LIVE EDITS ──
     `profile-updated` fires from the server whenever anyone saves a profile, so
     a card repaints in place the moment its owner edits it — no refetch, no
     index movement. Ids we aren't showing are ignored, which is the whole of
     the client-side half of the broadcast.
     Merged rather than replaced for the same reason as `refreshMerged`: the
     broadcast carries no viewer-relative score, so replacing the card outright
     would knock its `hybridScore` to undefined. */
  useEffect(() => {
    const onProfileUpdated = (card) => {
      if (!card?._id) return;
      setProfiles((prev) => {
        const idx = prev.findIndex((p) => String(p._id) === String(card._id));
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

    /* G9 — the inbound-align handling moved to Header.jsx, which is mounted on
       every tab, so the bell badge bumps instantly no matter where you are. The
       in-app toast and its heavy haptic were dropped here: the phone push
       already names the sender, and a toast per align was just noise while
       swiping. */

    return () => {
      socket.off('profile-updated', onProfileUpdated);
    };
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

    /* Prefetch at 6 remaining, not 4.
       The server now hands out a fixed, already-decided order, so the page
       boundary is predictable: the next page is always the next 10 ids in that
       order, not a fresh shuffle of whatever happens to be eligible. Waiting
       until 4 remain still stalls visibly on a full page of 10 — the user is
       looking at their last two cards while the request runs. Fetching at 6
       overlaps the wait with cards they are still swiping. */
    if (profiles.length - currentIndex <= 6 && hasMore && !deckExhausted && !fetchingMore) {
      fetchProfiles(true);
    }
  }, [currentIndex, profiles, hasMore, deckExhausted, fetchingMore, fetchProfiles]);

  /* ══════════════════════════════════════════════════════════════════════
     🚪 THE GATE — deck-wide, before any action reaches the network.

     One rule, no per-action exceptions: whatever the user tapped, they get the
     same toast and the same route to Profile. There is deliberately NO pending
     action and no replay — they finish, come back to the SAME card (the deck
     and index are restored from discoverStore), and choose what to do next.

     `pass` is deliberately NOT gated. It's a way to leave, not a way to
     interact — gating it would trap someone on a card they didn't choose.
     ══════════════════════════════════════════════════════════════════════ */
  const handleAction = useCallback(async (action, payload = {}) => {
    if (actionPendingRef.current) return;
    if (currentIndex >= profiles.length) return;

    const profile = profiles[currentIndex];
    const target = profile || {};

    if (action !== 'pass' && deckGated) {
      triggerHaptic('medium');
      // Close the popout FIRST. The toast renders at z-index 9999, just above
      // the popout overlay's 9998, so if the popout were left open the toast
      // would sit on top of a blurred scrim and read as "something appeared
      // behind the modal" — which is exactly what it looked like before.
      closeAllPopouts();

      const need = readLadder(config).interact;

      /* Re-read the score here rather than quoting the mount-time snapshot.
         This costs one round-trip on the tap that hits the gate, and buys two
         things the cached value couldn't give us:
           1. the number in the copy is one we actually fetched, so it can't be
              stale — the user may have finished onboarding in another tab, or
              the mount-time fetch may have died and recovered since;
           2. if it fails, we find out NOW instead of asserting "0%".
         The gate DECISION still uses the cached value, so an intercepted tap is
         never conditional on this succeeding; it only decides what we say.

         Resolved before handing to toast: `toast.info` stores `message` verbatim
         and ArchivalToast renders it as text, so a Promise would surface as
         "[object Promise]". */
      const fresh = await loadMyProfile();
      toast.info(
        fresh && Number.isFinite(fresh.profileScore)
          ? `Profile strength: ${fresh.profileScore}%. You need ${need}% to interact.`
          /* A genuine 0% and a dropped request must not read the same. With no
             number in hand we say nothing about one. */
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
          setAlignedProfile({ ...response.user, alignmentId: response.alignmentId });
          setShowAlignmentModal(true);
        }
      }
      else if (action === 'pass') {
        triggerHaptic('medium');
        await api.post(`/discover/pass/${profile._id}`);
        /* Bump the undo nonce so DeckActions opens its 5s window. Only on a
           real pass — liking or messaging someone shouldn't offer an undo. */
        setUndoNonce((n) => n + 1);
      }

      handleNextProfile('up', true);

    } catch (err) {
      /* Server-side gate (403 GATED) reached when the client didn't know we were
         locked — e.g. the score dropped mid-session, or our local copy was
         stale. Recover the same way as a normal tap: open the sheet and replay
         the action once it resolves. */
      if (err.code === 'GATED') {
        setPendingAction({ action: payload?.note ? 'letter' : action, payload });
        return;
      }
      console.error('Action failed:', err);
    } finally {
      actionPendingRef.current = false;
    }
  }, [currentIndex, profiles, handleNextProfile, deckGated]);

  /* Desktop: preload the next hero image so swipes feel instant. */
  useEffect(() => {
    if (!isDesktop) return;
    const next = profiles[currentIndex + 1]?.photos?.[0];
    if (!next) return;
    const img = new Image();
    img.decoding = 'async';
    img.src = next;
  }, [isDesktop, profiles, currentIndex]);

  /* Desktop: keyboard deck controls. Ignored while typing or in modals. */
  useEffect(() => {
    if (!isDesktop) return;
    const onKey = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
      if (showAlignmentModal) {
        if (e.key === 'Escape') { setShowAlignmentModal(false); setAlignedProfile(null); }
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (k === 'ArrowRight' || k === 'l' || k === 'L') { e.preventDefault(); triggerHaptic('heavy'); handleAction('align', {}); }
      else if (k === 'ArrowLeft' || k === 'p' || k === 'P') { e.preventDefault(); triggerHaptic('medium'); handleAction('pass'); }
      else if (k === 'ArrowDown' || k === 'b' || k === 'B') { e.preventDefault(); triggerHaptic('light'); handleNextProfile('down'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isDesktop, showAlignmentModal, handleAction, handleNextProfile]);

  /* 📍 THE REBUILD OVERLAY LIVES INSIDE THE RETURNED TREE, NOT ABOVE IT.
   *
   * It used to sit here, one line above this `if`. That is a bare JSX
   * expression statement: JavaScript builds the element and immediately discards
   * it. Nothing throws, the build is green, lint is green — and React never sees
   * the component at all, so the "Updating your feed" screen silently never
   * appeared.
   *
   * The trap is that "before the early return" sounds like it renders first. It
   * does not. Everything before an early `return` is dead code by definition;
   * the only two placements that actually render are INSIDE a returned branch
   * or in the final returned tree. Hence the two copies below. */
  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '12px', backgroundColor: t.desk }}>
        <ProfileCardSkeleton />
        <DiscoverRebuildOverlay show={rebuildOverlay} />
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '24px', backgroundColor: t.desk }}>
        <style>{DECK_CSS}</style>
        <div style={styles.stateCard}>
          <div style={{ ...styles.stateTile, background: t.coral }}>
            <AlertTriangle size={22} strokeWidth={2.6} color={t.ink} />
          </div>
          <h3 style={styles.stateTitle}>The deck hit a snag</h3>
          <p style={styles.stateBody}>{error}</p>
          <button onClick={() => fetchProfiles(false)} className="slam-btn" style={styles.slamBtn}>
            <RotateCw size={14} strokeWidth={3} /> Try again
          </button>
        </div>
      </div>
    );
  }

  if (!profiles || profiles.length === 0 || currentIndex >= profiles.length) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '24px', backgroundColor: t.desk }}>
        <style>{DECK_CSS}</style>
        <div style={styles.stateCard}>
          <div style={{ ...styles.stateTile, background: t.yellow }}>
            <Compass size={22} strokeWidth={2.6} color={t.ink} />
          </div>
          <h3 style={styles.stateTitle}>You're all caught up</h3>
          <p style={styles.stateBody}>
            {deckExhausted
              ? "You've seen everyone who fits right now. New people join all the time — check back later."
              : "You've reviewed everyone for now. Check back later — new people land all the time."}
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* No "Show everyone" button. It existed to escape a campus-narrowed
                deck; there is no narrowed deck to escape. */}
            {/* Refresh is only honest when there is something to re-fetch.
                Once deckExhausted is true the server has confirmed nobody
                eligible is left ANYWHERE, so tapping this would re-request the
                same exhausted pool and appear broken. Hiding it is the truthful
                state; showing it would be a button that lies about the system. */}
            {!deckExhausted && (
              <button onClick={() => fetchProfiles(false)} className="slam-btn" style={styles.slamBtn}>
                <RotateCw size={14} strokeWidth={3} /> Refresh
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.viewportRoot, ...(isDesktop ? styles.viewportRootDesktop : null) }}>
      <style>{DECK_CSS}</style>

      <ShadowbanBanner score={shadowbanScore} onLearnMore={() => setShowLearnMore(true)} />
      {showLearnMore && <LearnMoreSheet onClose={() => setShowLearnMore(false)} />}

      {/* 📍 CAMPUS-FALLBACK NOTICE.

          The feed ranks by distance from the viewer's own stored reading. When
          that reading is missing or stale the pipeline substitutes their COLLEGE
          coordinates silently, so without this the user is looking at a
          campus-ranked feed believing it is location-ranked.

          How it behaves now — it shows on entry and gets out of the way. It
          appears on every app open and every tab switch (throttled to 3 minutes
          within a session), collapses to two lines, and auto-hides after 5s.
          Expanding it holds until dismissed.

          The previous shape was permanently pinned and undismissable. That was
          deliberate — a banner people swipe away is how someone stops noticing
          their feed stopped changing — but a permanent bar over the feed is
          wallpaper, and wallpaper is ignored. Nothing was decided from it. Now
          the same information arrives with an expiry, which is the difference
          between a notice and furniture.

          Persistent ONLY when the browser has locked location: a denied
          permission is never re-prompted by the browser, so that copy is the
          only actionable instruction the user can get.

          The college name is read off `myUser`, so no extra request is needed
          to render it.

          ⚠️ MOUNTED ON THE SERVER'S `active`, NOT ON `locationSource`.
          `locationSource === 'gps'` only says a reading was stored at some
          point. A reading older than the 30-day TTL is ignored by the ranking
          pipeline and the deck falls back to the campus, so the one case where
          this notice is most needed was the one case it could not appear in —
          the UI said location was on while the feed was campus-ordered.
          `GET /users/location` already computes the honest answer
          (`active: hasCoords && isFreshLocation(user)`), so this reads it rather
          than re-deriving a TTL in the browser where it would drift. */}
      {myUser && locationRead && (
        <LocationNotice
          college={myUser.college}
          /* The warning and the confirmation are different messages for
             different states, and only one is ever correct at a time. */
          variant={locationRead.active ? 'active' : 'fallback'}
          onLocationChanged={async (moved) => {
            if (!moved) return;
            await rebuildDeckForLocation();
          }}
        />
      )}

      {/* Quiet notice that the order was re-decided mid-browse — a new session
          after being away, or the deck window running out and refilling.
          Auto-dismisses. Deliberately a LINE, not a button: no major dating app
          lets you re-roll the deck on demand, and a button here would appear to
          offer something the server cannot actually do differently. */}
      <AnimatePresence>
        {rebuiltAt > 0 && Date.now() - rebuiltAt < 4000 && (
          <motion.div
            key="rebuilt"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            role="status"
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 40,
              pointerEvents: 'none',
              padding: '6px 12px',
              borderRadius: 999,
              background: t.card,
              border: `1px solid ${t.line}`,
              color: t.ink2,
              fontFamily: t.fontBody,
              fontSize: 12,
              whiteSpace: 'nowrap',
            }}
          >
            Showing newer profiles
          </motion.div>
        )}
      </AnimatePresence>

      {/* The second copy of the rebuild overlay, mirroring the one in the
          `if (loading)` branch. It is `position: fixed`, so it covers the
          viewport identically from either nesting depth — this one is the
          safety net for a rebuild whose fetch resolved without `loading` ever
          visibly flipping. */}
      <DiscoverRebuildOverlay show={rebuildOverlay} />

      {merging && !loading && (
        <div aria-live="polite" style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 30, pointerEvents: 'none', padding: '4px 10px', background: t.card, border: `1px solid ${t.hair}`, borderRadius: 999, color: t.ink3, fontFamily: t.fontBody, fontSize: 11, whiteSpace: 'nowrap' }}>
          Updating…
        </div>
      )}

      <div style={{ ...styles.stageContainer, ...(isDesktop ? styles.stageContainerDesktopNoPad : null) }}>
        {/* Desktop: constrained deck column floating on the desk. Mobile: full-bleed. */}
        <div style={isDesktop ? styles.deckColumnDesktop : { position: 'relative', width: '100%', height: '100%' }}>
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
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex', flexDirection: 'column',
                }}
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

        {/* Deck-scoped actions — ONE instance, sibling of the card stack.
            Fixed to the viewport, so these stay level with the Header bell
            and never remount (or re-arm) as cards animate through. */}
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
        <div style={styles.desktopActionBar} role="toolbar" aria-label="Discovery actions">
          <button
            className="deck-action-btn"
            title="Previous profile (↓ or B)"
            aria-label="Previous profile"
            disabled={currentIndex <= 0}
            onClick={() => handleNextProfile('down')}
            style={{ ...styles.deckBtn, background: t.paper, color: t.ink }}
          >
            <Undo2 size={19} strokeWidth={2.8} />
          </button>
          <button
            className="deck-action-btn"
            title="Pass (← or P)"
            aria-label="Pass"
            onClick={() => handleAction('pass')}
            style={{ ...styles.deckBtn, background: t.card, color: t.ink }}
          >
            <X size={21} strokeWidth={3} />
          </button>
          {/* ✨ ALIGN — the one affirmative action. Replaced the flower and the
              telegram, which were two buttons for one gesture and forced a
              choice about emphasis before a choice about the person. */}
          <button
            className="deck-action-btn"
            title="Align (→ or L) — or click any photo or prompt"
            aria-label="Align"
            onClick={() => handleAction('align', {})}
            style={{ ...styles.deckBtn, background: t.yellow, color: t.ink }}
          >
            Align
          </button>
          <div aria-hidden="true" style={styles.deckHints}>
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
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(12,12,14,0.62)', zIndex: 99998 }}
              onClick={() => { setShowAlignmentModal(false); setAlignedProfile(null); }}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0, y: 16 }} transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: 340, backgroundColor: t.paper, border: `2px solid ${t.ink}`, borderRadius: 22, boxShadow: `8px 8px 0 ${t.ink}`, padding: '30px 24px 24px', textAlign: 'center', zIndex: 99999, overflow: 'hidden' }}
            >
              {/* candy confetti — straight, tiny, celebratory */}
              <span aria-hidden="true" style={{ position: 'absolute', top: 18, left: 20, width: 14, height: 14, borderRadius: 999, background: t.yellow, border: `1.5px solid ${t.ink}` }} />
              <span aria-hidden="true" style={{ position: 'absolute', top: 26, right: 24, width: 11, height: 11, borderRadius: 3, background: t.coral, border: `1.5px solid ${t.ink}` }} />
              <span aria-hidden="true" style={{ position: 'absolute', bottom: 78, left: 28, width: 10, height: 10, borderRadius: 3, background: t.green, border: `1.5px solid ${t.ink}` }} />
              <span aria-hidden="true" style={{ position: 'absolute', bottom: 88, right: 30, width: 13, height: 13, borderRadius: 999, background: t.pink, border: `1.5px solid ${t.ink}` }} />

              {/* the match badge — candy tile, pop-in */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', damping: 14, stiffness: 280 }}
                style={{ width: 92, height: 92, margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: t.yellow, border: `2px solid ${t.ink}`, borderRadius: 24, boxShadow: `5px 5px 0 ${t.ink}` }}
              >
                <Heart size={40} strokeWidth={2.4} color={t.ink} fill={t.ink} />
              </motion.div>

              <h2 style={{ fontFamily: t.fontHeavy, fontSize: 27, fontWeight: 400, color: t.ink, margin: '0 0 8px 0', letterSpacing: '-.01em', textTransform: 'uppercase' }}>
                Aligned<span style={{ color: t.coral }}>!</span>
              </h2>
              <p style={{ fontFamily: t.fontBody, fontSize: 14, fontWeight: 500, color: t.ink2, margin: '0 0 24px 0', lineHeight: 1.6 }}>
                You and {alignedProfile.name} found common ground. The chat is now open.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  className="slam-btn"
                  onClick={() => { triggerHaptic('heavy'); setShowAlignmentModal(false); if (onOpenChat && alignedProfile) { onOpenChat({ _id: alignedProfile.alignmentId, user: alignedProfile }); } setAlignedProfile(null); }}
                  style={{ width: '100%', padding: '15px', background: t.yellow, color: t.ink, border: `2px solid ${t.ink}`, borderRadius: 12, boxShadow: `4px 4px 0 ${t.ink}`, fontFamily: t.fontMono, fontSize: 12, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer' }}
                >
                  Open chat
                </button>
                <button
                  onClick={() => { setShowAlignmentModal(false); setAlignedProfile(null); }}
                  style={{ width: '100%', padding: '15px', background: 'transparent', color: t.ink, border: `2px solid ${t.ink}`, borderRadius: 12, fontFamily: t.fontMono, fontSize: 12, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer' }}
                >
                  Keep browsing
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* The gate is a TOAST, not a sheet — see handleAction. It renders at
          z-index 9999 (ArchivalToast), just above the popout overlay's 9998,
          and handleAction closes the popout first so it never appears behind a
          blurred scrim. */}
    </div>
  );
};

/* ── deck styles: borders, hard shadows, slam presses ── */
const DECK_CSS = `
  .slam-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    font-family: ${t.fontMono}; font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
    cursor: pointer; transition: transform .08s steps(2), box-shadow .08s steps(2), background .08s steps(2);
    -webkit-tap-highlight-color: transparent; }
  .slam-btn:active { transform: translate(4px, 4px) !important; box-shadow: 0 0 0 ${t.ink} !important; }
  .deck-action-btn { transition: transform .08s steps(2), box-shadow .08s steps(2); will-change: transform; }
  .deck-action-btn:active { transform: translate(4px, 4px) !important; box-shadow: 0 0 0 ${t.ink} !important; }
  .deck-action-btn:disabled { opacity: .35; cursor: default; transform: none !important; box-shadow: none !important; }
  @media (hover: hover) {
    .deck-action-btn:hover:not(:disabled) { transform: translate(-1px, -1px);
      box-shadow: 5px 5px 0 ${t.ink}; }
    .slam-btn:hover { transform: translate(-1px, -1px); box-shadow: 5px 5px 0 ${t.ink}; }
  }

  kbd.deck-kbd { font-family: ${t.fontMono}; font-size: 10px; font-weight: 700;
    background: ${t.paper}; border: 1.5px solid ${t.ink}; border-radius: 5px; padding: 2px 6px; color: ${t.ink2}; }
  @media (prefers-reduced-motion: reduce) {
    .slam-btn, .deck-action-btn { transition: none; }
  }
`;

const styles = {
  viewportRoot: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', backgroundColor: t.desk, position: 'relative', overflow: 'hidden', userSelect: 'none', WebkitUserSelect: 'none' },
  viewportRootDesktop: { alignItems: 'center' },
  stageContainer: { flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', position: 'relative', zIndex: 2,
    /* Bottom padding reserves the strip the global Align bar occupies. Without
       it the bar is absolutely positioned at the viewport's bottom edge and
       lands ON the card — covering the lower photo and, on a short card, the
       bio. Desktop overrides this and carries its own bar. */
    padding: '0 0 62px' },
  stageContainerDesktop: { width: '100%', maxWidth: 560, padding: '20px 20px 12px', margin: '0 auto', },
  /* The mobile Align bar is hidden on desktop, so the reserved strip is not. */
  stageContainerDesktopNoPad: { width: '100%', maxWidth: 560, padding: '20px 20px 12px', margin: '0 auto' },
  deckColumnDesktop: {
    position: 'relative', width: '100%', height: '100%', minHeight: 0,
    backgroundColor: t.desk, border: `2px solid ${t.ink}`, borderRadius: 22,
    overflow: 'hidden',
  },
  desktopActionBar: {
    position: 'relative', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 12, padding: '12px 20px 18px', width: '100%', maxWidth: 560, margin: '0 auto',
  },
  deckBtn: {
    width: 54, height: 54, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', border: `2px solid ${t.ink}`, boxShadow: `4px 4px 0 ${t.ink}`,
  },
  deckHints: {
    display: 'flex', alignItems: 'center', gap: 10, marginLeft: 8,
    fontFamily: t.fontMono, fontSize: 10, color: t.ink3, whiteSpace: 'nowrap',
  },
  /* error / empty state card */
  stateCard: {
    width: '100%', maxWidth: 330, backgroundColor: t.paper,
    border: `2px solid ${t.ink}`, borderRadius: 20, boxShadow: `8px 8px 0 ${t.ink}`,
    padding: '30px 24px 26px', textAlign: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  stateTile: {
    width: 56, height: 56, borderRadius: 16, border: `2px solid ${t.ink}`,
    boxShadow: `4px 4px 0 ${t.ink}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  stateTitle: {
    fontFamily: t.fontHeavy, fontSize: 21, fontWeight: 400, color: t.ink,
    letterSpacing: '-.01em', textTransform: 'uppercase', margin: '0 0 8px 0',
  },
  stateBody: {
    fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 500, lineHeight: 1.6,
    maxWidth: 260, marginBottom: 22, color: t.ink2,
  },
  slamBtn: {
    padding: '13px 24px', background: t.yellow, color: t.ink,
    border: `2px solid ${t.ink}`, borderRadius: 12, boxShadow: `4px 4px 0 ${t.ink}`,
  },
};

export default Discover;
```

### ./client/src/pages/Matches.jsx

```
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { toast } from '../utils/toast';
import { useAuth } from '../utils/AuthContext';
import socket from '../utils/socket';
import { SkeletonBox } from '../components/Skeleton';
import { Heart, MoreVertical, Search, X } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { DECK_CONTENT_TOP } from '../utils/deckChrome';

/* ── Locked tokens — neubrutalism, same family as ProfileCard / NavBar / Discover ── */
const t = {
  desk: '#131313',
  paper: '#FFF9EC',
  card: '#FFFFFF',
  ink: '#191919',
  ink2: '#5F5B52',
  ink3: '#A39E92',
  hair: '#EBE5D6',
  yellow: '#FFD43D',
  coral: '#FF7A59',
  green: '#5BD98A',
  pink: '#FFA3C6',
  red: '#E5484D',
  fontHeavy: "'Archivo Black', 'Arial Black', sans-serif",
  fontBody: "'Inter', -apple-system, 'Segoe UI', sans-serif",
  fontMono: "'Space Mono', 'Courier New', monospace",
};

const MATCHES_CSS = `
  .match-card { will-change: transform;
    transition: transform .08s steps(2), box-shadow .08s steps(2), background .08s steps(2);
    contain: layout style; }
  .match-card:active { transform: translate(3px, 3px) !important; box-shadow: 0 0 0 #191919 !important; }

  .match-menu-btn { display: flex; align-items: center; gap: 8px; width: 100%;
    padding: 11px 12px; background: none; border: none; cursor: pointer; text-align: left;
    font-family: ${t.fontMono}; font-size: 12px; font-weight: 700; letter-spacing: .1em;
    text-transform: uppercase; color: ${t.red}; border-radius: 8px; transition: none; }
  .match-menu-btn:active { background: ${t.red}; color: #fff; }

  .match-search input::placeholder { color: ${t.ink3}; opacity: 1; }
  .match-search:focus-within { border-color: ${t.ink} !important; box-shadow: 3px 3px 0 ${t.ink}; }

  @media (hover: hover) and (pointer: fine) {
    .match-card:hover { transform: translate(-1px, -1px);
      box-shadow: 6px 6px 0 #191919; }
    .match-menu-btn:hover { background: rgba(229,72,77,.08); }
    .match-clear:hover { background: ${t.hair}; }
  }

  .match-card:focus-visible, .match-menu-btn:focus-visible, .match-clear:focus-visible {
    outline: 3px solid ${t.yellow}; outline-offset: 2px; }

  @media (prefers-reduced-motion: reduce) {
    .match-card { transition: none !important; transform: none !important; }
  }
`;

const Matches = ({ onOpenChat }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isFocused, setIsFocused] = useState(false);

  const { user } = useAuth();
  const myId = user?._id;

  const { data, isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: () => api.get('/alignments'),
  });

  const matches = useMemo(() => data?.matches || [], [data]);

  // WhatsApp-style real-time updates: bump the match to the top and refresh its preview
  useEffect(() => {
    const onNew = (msg) => {
      queryClient.setQueryData(['matches'], (old) => {
        if (!old?.matches) return old;
        const list = [...old.matches];
        const idx = list.findIndex((m) => m._id === msg.alignmentId);
        if (idx === -1) return old;
        const m = list[idx];
        const updated = {
          ...m,
          lastMessage: {
            text: msg.text,
            senderId: msg.senderId,
            createdAt: msg.createdAt,
            readAt: msg.readAt ?? null,
            type: msg.type,
            image: msg.image,
          },
          yourTurn: msg.senderId !== myId,
        };
        list.splice(idx, 1);
        list.unshift(updated);
        return { ...old, matches: list };
      });
    };
    socket.on('new-message', onNew);
    return () => socket.off('new-message', onNew);
  }, [queryClient, myId]);

  // Real-time unmatch: remove the alignment from cache when the other user severs the connection
  useEffect(() => {
    const onUnmatch = ({ alignmentId }) => {
      queryClient.setQueryData(['matches'], (old) => ({
        ...(old || {}),
        matches: (old?.matches || []).filter((m) => m._id !== alignmentId),
      }));
    };
    socket.on('unmatch-notification', onUnmatch);
    return () => socket.off('unmatch-notification', onUnmatch);
  }, [queryClient]);

  const handleUnmatch = useCallback(async (alignmentId) => {
    setOpenMenuId(null);
    if (!window.confirm('Are you sure you want to unmatch? This cannot be undone.')) return;
    try {
      await api.delete(`/alignments/${alignmentId}`);
      queryClient.setQueryData(['matches'], (old) => ({
        ...(old || {}),
        matches: (old?.matches || []).filter((m) => m._id !== alignmentId),
      }));
    } catch (err) {
      if (!err?.toasted) toast.error('Could not unmatch. Try again.');
    }
  }, [queryClient]);

  const fmtTime = useCallback((ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 172800) return 'Yesterday';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }, []);

  const timeAgo = useCallback((ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 3600) return `${Math.floor(Math.max(diff, 1) / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }, []);

  // Memoized filter to avoid recalculating string matching during high-frequency socket events
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return matches;
    return matches.filter((m) => m.user?.name?.toLowerCase().includes(query));
  }, [matches, search]);

  if (isLoading) {
    return (
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: t.desk, padding: `calc(${DECK_CONTENT_TOP} + 8px) 14px 16px` }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              backgroundColor: t.paper, border: `2px solid ${t.ink}`,
              borderRadius: 16, boxShadow: `5px 5px 0 ${t.ink}`, padding: 16,
            }}>
              <SkeletonBox width={56} height={56} radius={12} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <SkeletonBox width={120} height={14} />
                <SkeletonBox width={180} height={11} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16, padding: 32, backgroundColor: t.desk,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, backgroundColor: t.coral,
          border: `2px solid ${t.ink}`, boxShadow: `4px 4px 0 ${t.ink}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4,
        }}>
          <Heart size={24} strokeWidth={2.6} color={t.ink} />
        </div>
        <p style={{ fontFamily: t.fontHeavy, fontSize: 21, color: t.paper, textAlign: 'center', margin: 0, letterSpacing: '-.01em', textTransform: 'uppercase' }}>
          No letters yet
        </p>
        <p style={{ fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 500, color: t.ink3, textAlign: 'center', maxWidth: 280, margin: 0, lineHeight: 1.6 }}>
          Start exploring and leave a flower to begin your story.
        </p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: t.desk, padding: `calc(${DECK_CONTENT_TOP} + 8px) 14px 16px`, position: 'relative' }}>
      <style>{MATCHES_CSS}</style>

      <div style={{ position: 'relative' }}>
        {/* Search — chunky box, ink border, shadow on focus. The tab heading now
            comes from the floating Header row, so no in-page title here. */}
        <div
          className="match-search"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 14px',
            marginBottom: 6,
            backgroundColor: t.paper,
            border: `2px solid ${t.ink}`,
            borderRadius: 12,
            boxShadow: isFocused ? `3px 3px 0 ${t.ink}` : 'none',
            transition: 'box-shadow .08s steps(2)',
          }}
        >
          <Search size={15} strokeWidth={2.6} color={isFocused ? t.ink : t.ink3} style={{ transition: 'color 0.15s ease', flexShrink: 0 }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search letters..."
            aria-label="Search letters"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px 0',
              backgroundColor: 'transparent',
              border: 'none',
              fontFamily: t.fontBody,
              fontSize: 13.5,
              fontWeight: 500,
              color: t.ink,
              outline: 'none',
            }}
          />
          {search && (
            <button
              type="button"
              className="match-clear"
              onClick={() => { triggerHaptic('light'); setSearch(''); }}
              aria-label="Clear search"
              style={{ background: 'none', border: 'none', color: t.ink2, cursor: 'pointer', display: 'flex', padding: 6, margin: -6, borderRadius: 6, flexShrink: 0 }}
            >
              <X size={14} strokeWidth={2.6} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map((match) => {
            const user = match.user;
            if (!user) return null;

            const lastMessage = match.lastMessage;
            const unread =
              match.yourTurn ||
              (lastMessage && lastMessage.senderId && lastMessage.senderId !== myId && !lastMessage.readAt);
            const isOpen = openMenuId === match._id;

            const lastIsMedia = lastMessage && (lastMessage.type === 'image' || lastMessage.type === 'audio');

            return (
              <div
                key={match._id}
                className="match-card"
                role="button"
                tabIndex={0}
                onClick={() => { triggerHaptic('light'); onOpenChat(match); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenChat(match);
                  }
                }}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  backgroundColor: unread ? t.card : t.paper,
                  border: `2px solid ${t.ink}`,
                  borderRadius: 16,
                  boxShadow: unread ? `5px 5px 0 ${t.ink}` : `4px 4px 0 ${t.ink}`,
                  padding: '14px 16px',
                  cursor: 'pointer',
                }}
              >
                {/* Avatar — square-ish tile, ink border; unread gets the yellow ring */}
                <img
                  src={user.photos?.[0] || 'https://placehold.co/80/fff3dc/191919?text=%C2%B7'}
                  alt={user.name}
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: 56, height: 56, borderRadius: 12, objectFit: 'cover',
                    border: `2px solid ${t.ink}`, backgroundColor: t.hair, flexShrink: 0,
                    outline: unread ? `3px solid ${t.yellow}` : 'none', outlineOffset: 1,
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontFamily: t.fontBody, fontSize: 15, fontWeight: unread ? 800 : 600, color: t.ink, margin: 0 }}>
                      {user.name}{user.age ? <span style={{ fontWeight: 500, color: t.ink3 }}>, {user.age}</span> : null}
                    </p>
                    {unread && (
                      <span
                        aria-label="Unread message"
                        style={{
                          width: 10, height: 10, borderRadius: '50%',
                          backgroundColor: t.coral, border: `1.5px solid ${t.ink}`,
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                  <p style={{ fontFamily: t.fontBody, fontSize: 12.5, color: unread ? t.ink : t.ink2, margin: '4px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: unread ? 700 : 500 }}>
                    {lastMessage
                      ? lastIsMedia
                        ? (lastMessage.type === 'image' ? '📷 Sent a photograph' : '🎙 Sent a voice note')
                        : lastMessage.text
                      : 'Open chat'}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                  <span style={{
                    fontFamily: t.fontMono, fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em',
                    color: unread ? t.ink : t.ink3,
                    background: unread ? t.yellow : 'transparent',
                    border: unread ? `1.5px solid ${t.ink}` : 'none',
                    borderRadius: 5, padding: unread ? '2px 6px' : 0,
                    whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums',
                  }}>
                    {lastMessage ? fmtTime(lastMessage.createdAt) : `Aligned ${timeAgo(match.createdAt)}`}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('light');
                      setOpenMenuId(isOpen ? null : match._id);
                    }}
                    style={{
                      background: isOpen ? t.ink : 'transparent',
                      color: isOpen ? t.paper : t.ink3,
                      border: `1.5px solid ${isOpen ? t.ink : t.hair}`,
                      cursor: 'pointer', padding: 3, display: 'flex', alignItems: 'center',
                      borderRadius: 7,
                    }}
                    aria-label="More options"
                    aria-expanded={isOpen}
                    title="More options"
                  >
                    <MoreVertical size={15} strokeWidth={2.4} />
                  </button>
                </div>

                {/* Contextual menu — chunky card, slam language */}
                <AnimatePresence>
                  {isOpen && (
                    <>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(null);
                        }}
                        style={{ position: 'fixed', inset: 0, zIndex: 90, cursor: 'default' }}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: -6 }}
                        transition={{ duration: 0.13, ease: 'easeOut' }}
                        style={{
                          position: 'absolute', top: 50, right: 16, zIndex: 100, overflow: 'hidden',
                          minWidth: 150, padding: 5,
                          backgroundColor: t.paper, border: `2px solid ${t.ink}`,
                          borderRadius: 12, boxShadow: `5px 5px 0 ${t.ink}`,
                        }}
                      >
                        <button
                          type="button"
                          className="match-menu-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnmatch(match._id);
                          }}
                        >
                          Unmatch
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Matches;
```

