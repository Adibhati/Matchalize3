import React, { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Lock, Mail } from 'lucide-react';
import neu from '../styles/neu';

/* The shared neo-brutalist canon (src/styles/neu.js). This screen used
   to read from theme.js (--surface-alt, --crim-08, --crimson, texture.grain),
   which is the legacy parchment palette: a suspended user landing here out of the
   neubrutalist Auth flow saw two design languages in one view. It stands alone,
   exactly like Auth does before login, but now from the shared canon. */
const T = neu;

/* as- prefix, one injected sheet — same pattern as Header's hd-, Auth's au-. */
const SUSPENDED_CSS = `
  .as-root {
    --paper: ${T.paper}; --card: ${T.card}; --ink: ${T.ink};
    --ink2: ${T.ink2}; --ink3: ${T.ink3};
    --yellow: ${T.yellow}; --coral: ${T.coral}; --desk: ${T.desk}; --bw: 2px;
    --heavy: ${T.fontHeavy}; --body: ${T.fontBody}; --mono: ${T.fontMono};

    min-height: 100vh; min-height: 100dvh; width: 100%;
    display: flex; padding: max(24px, env(safe-area-inset-top)) 16px
      max(24px, env(safe-area-inset-bottom));
    background: var(--desk); box-sizing: border-box; position: relative;
    overflow-x: hidden;
  }
  .as-root * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
  .as-root ::selection { background: var(--yellow); color: var(--ink); }

  /* margin:auto, not justify-content:center — same reason as .au-fit. */
  .as-fit { margin: auto; width: 100%; max-width: 380px;
    display: flex; flex-direction: column; align-items: center; gap: 18px; }

  /* the deck's sheet object — identical to .pc-sheet / .au-panel */
  .as-panel { width: 100%; background: var(--paper);
    border: var(--bw) solid var(--ink); border-radius: 22px;
    box-shadow: 8px 8px 0 var(--ink); padding: 30px 24px 26px;
    display: flex; flex-direction: column; align-items: center; gap: 18px;
    text-align: center; }

  /* Lock tile — a bordered rounded square, not the old thin-stroke circle.
     The candy-box family marks things with squares and 2px ink borders. */
  .as-lock { width: 76px; height: 76px; border-radius: 18px;
    background: var(--coral); border: var(--bw) solid var(--ink);
    box-shadow: 4px 4px 0 var(--ink);
    display: flex; align-items: center; justify-content: center; }

  /* marker-highlight headline — the .pc-name / .au-headline recipe */
  .as-headline { font-family: var(--heavy); font-weight: 400;
    font-size: clamp(21px, 6vw, 27px); line-height: 1.12; letter-spacing: -.01em;
    color: var(--ink); margin: 0; width: fit-content; max-width: 100%;
    padding: 0 6px 3px 0;
    background-image: linear-gradient(180deg, transparent 58%, var(--yellow) 58%);
    -webkit-box-decoration-break: clone; box-decoration-break: clone; }

  .as-copy { font-family: var(--body); font-size: 13.5px; font-weight: 500;
    color: var(--ink2); margin: 0; line-height: 1.6; }
  .as-date { font-family: var(--mono); font-size: 10.5px; font-weight: 700;
    letter-spacing: .1em; text-transform: uppercase; color: var(--ink3); margin: 0; }

  /* yellow CTA — slams like every other tile */
  .as-cta { display: flex; align-items: center; justify-content: center; gap: 10px;
    width: 100%; height: 54px; margin-top: 4px;
    background: var(--yellow); color: var(--ink); text-decoration: none;
    border: var(--bw) solid var(--ink); border-radius: 14px;
    box-shadow: 5px 5px 0 var(--ink); cursor: pointer;
    font-family: var(--mono); font-size: 12px; font-weight: 700;
    letter-spacing: .16em; text-transform: uppercase;
    transition: transform .08s steps(2), box-shadow .08s steps(2),
      background .08s steps(2), color .08s steps(2); }
  .as-cta:active { transform: translate(5px, 5px); box-shadow: 0 0 0 var(--ink);
    background: var(--ink); color: var(--yellow); }

  /* bottomSlot wrapper. The button Auth passes in is styled from here rather
     than by .au-ghost — Auth returns this screen before it ever injects
     AUTH_CSS, so any au-* class would be undefined at that point. */
  .as-slot { display: flex; justify-content: center; }
  .as-slot button { padding: 11px 18px; cursor: pointer;
    border: var(--bw) solid var(--ink); border-radius: 999px;
    background: var(--card); color: var(--ink2);
    box-shadow: 3px 3px 0 var(--ink);
    font-family: var(--mono); font-size: 10px; font-weight: 700;
    letter-spacing: .14em; text-transform: uppercase;
    transition: transform .08s steps(2), box-shadow .08s steps(2),
      background .08s steps(2), color .08s steps(2); }
  .as-slot button:active { transform: translate(3px, 3px);
    box-shadow: 0 0 0 var(--ink); background: var(--ink); color: var(--paper); }

  @media (hover: hover) and (pointer: fine) {
    .as-cta:hover { transform: translate(-1px, -1px); box-shadow: 6px 6px 0 var(--ink); }
    .as-cta:active { transform: translate(5px, 5px); box-shadow: 0 0 0 var(--ink);
      background: var(--ink); color: var(--yellow); }
    .as-slot button:hover { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 var(--ink); }
    .as-slot button:active { transform: translate(3px, 3px);
      box-shadow: 0 0 0 var(--ink); background: var(--ink); color: var(--paper); }
  }
  @media (prefers-reduced-motion: reduce) {
    .as-cta, .as-slot button { transition: none; }
  }
`;

const APPEAL_MAILTO =
  'mailto:support@matchalize.com?subject=Account Suspension Appeal&body=' +
  'Hi Matchalize Support,%0D%0A%0D%0AI would like to appeal my account suspension.' +
  '%0D%0A%0D%0AThank you.';

const AccountSuspendedScreen = ({ reason: _reason, suspendedAt, bottomSlot }) => {
  const reduceMotion = useReducedMotion();

  // Block back button — every press pushes them back to /auth (which shows this screen)
  useEffect(() => {
    const block = () => window.history.pushState(null, '', window.location.href);
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', block);
    return () => window.removeEventListener('popstate', block);
  }, []);

  const formattedDate = suspendedAt
    ? new Date(suspendedAt).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  return (
    <div className="as-root">
      <style>{SUSPENDED_CSS}</style>

      <div className="as-fit">
        <motion.div
          className="as-panel"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="as-lock" aria-hidden="true">
            <Lock size={30} color={T.ink} strokeWidth={2.2} />
          </div>

          <h1 className="as-headline">Account suspended.</h1>

          <p className="as-copy">
            Your account has been restricted for violating our community
            guidelines. During this time you cannot log in, send messages, or use
            Matchalize.
          </p>

          {formattedDate && (
            <p className="as-date">Suspended on {formattedDate}</p>
          )}

          <a className="as-cta" href={APPEAL_MAILTO}>
            <Mail size={16} strokeWidth={2.4} />
            Contact support
          </a>
        </motion.div>

        {bottomSlot && <div className="as-slot">{bottomSlot}</div>}
      </div>
    </div>
  );
};

export default AccountSuspendedScreen;