/**
 * Deck chrome — geometry shared by everything that pins itself to the top of
 * the viewport on the Deck: the Header's floating row and the deck actions.
 *
 * These numbers were previously hand-copied between Header.jsx and
 * ProfileCard.jsx with only a comment keeping them honest, which is how the ×
 * and the bell drifted apart. Keep one source of truth.
 */

/** Distance from the viewport top, respecting the notch. */
export const DECK_TOP = 'max(12px, env(safe-area-inset-top, 0px))';

/** Distance from the viewport's left/right edges. */
export const DECK_EDGE = '12px';

/** Square size of a top-row control. Shared by the bell, the gear and the ×. */
export const DECK_BTN = 42;

/** Matches Header.jsx's floating row so the × and the bell share a baseline. */
export const deckRowStyle = {
  position: 'fixed',
  top: DECK_TOP,
  left: DECK_EDGE,
  right: DECK_EDGE,
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  alignItems: 'center',
  pointerEvents: 'none',
};

/**
 * Where page content must start on the non-Deck tabs so it clears the floating
 * row instead of sliding underneath it. Derived from the two constants above
 * rather than hard-coded, so moving the row can never re-introduce the overlap:
 * row top + control height + a little breathing room.
 */
export const DECK_CONTENT_TOP = `calc(${DECK_TOP} + ${DECK_BTN}px + 14px)`;
