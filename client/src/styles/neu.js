/* ============================================================
   MATCHALIZE: THE NEO-BRUTALIST TOKEN LAYER — single source of truth
   ============================================================
   Every screen pulls color/font/shadow values from here. Do NOT
   define local token objects in components — import this module.
   Values are the converged canon of the old per-file `const t/T/C/F`
   blocks (Discover + ProfileCard agreed on all of them).

   Shadows are a 3-step scale, always ink:
     shadow.sm  3px — small chips, tags, inputs
     shadow.md  5px — default button/card slam
     shadow.lg  8px — hero cards, modal sheets
   ============================================================ */

const neu = {
  /* COLOR — the candy box */
  desk: '#131313', // the app's night: dark desk behind cards
  paper: '#FFF9EC', // warm cream — the base paper
  card: '#FFFFFF', // raised white card
  ink: '#191919', // text + every border + every shadow
  ink2: '#5F5B52', // secondary text
  ink3: '#A39E92', // muted text
  hair: '#EBE5D6', // hairline borders on white cards

  yellow: '#FFD43D', // primary action
  yellowDeep: '#FFC91F', // yellow hover/pressed
  coral: '#FF7A59', // secondary accent
  green: '#5BD98A', // success / accept
  pink: '#FFA3C6', // decorative tile
  red: '#E5484D', // destructive

  /* TYPE — four voices, no more */
  fontHeavy: "'Archivo Black', 'Arial Black', sans-serif", // display: titles, wordmark, nav labels
  fontBody: "'Inter', -apple-system, 'Segoe UI', sans-serif", // body copy
  fontMono: "'Space Mono', 'Courier New', monospace", // labels: uppercase, letterspaced, stamps
  fontHand: "'Caveat', 'Segoe Script', cursive", // handwritten annotations

  /* SLAM SHADOWS — always ink, three sizes */
  shadow: {
    sm: '3px 3px 0 #191919',
    md: '5px 5px 0 #191919',
    lg: '8px 8px 0 #191919',
  },

  /* BORDERS + RADII */
  border: {
    sm: '2px solid #191919',
    md: '3px solid #191919',
  },
  radius: {
    sm: '10px',
    md: '14px',
    lg: '20px',
    pill: '999px',
  },

  /* TEXTURE — film grain overlay */
  grain:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E",

  /* Z-INDEX — layering scale */
  z: {
    header: 500,
    nav: 10,
    drawer: 1000,
    modal: 1100,
    toast: 9999,
    overlay: 10000,
  },

  /* PLACEHOLDER — inline SVG fallbacks */
  placeholder: {
    avatar:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%23ede7db'/%3E%3Cg fill='none' stroke='%23c9bda6' stroke-width='3'%3E%3Ccircle cx='60' cy='48' r='17'/%3E%3Cpath d='M28 104c0-18 14-32 32-32s32 14 32 32'/%3E%3C/g%3E%3C/svg%3E",
    image:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect width='400' height='500' fill='%23ede7db'/%3E%3Cg fill='none' stroke='%23c9bda6' stroke-width='3'%3E%3Ccircle cx='200' cy='195' r='50'/%3E%3Cpath d='M112 385c0-49 39-88 88-88s88 39 88 88'/%3E%3C/g%3E%3C/svg%3E",
    hero:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='870' viewBox='0 0 600 870'%3E%3Crect width='600' height='870' fill='%23e8e4d9'/%3E%3Cg fill='none' stroke='%23c9bda6' stroke-width='4'%3E%3Ccircle cx='300' cy='340' r='82'/%3E%3Cpath d='M158 660c0-78 63-142 142-142s142 64 142 142'/%3E%3C/g%3E%3Ctext x='300' y='740' text-anchor='middle' font-family='Georgia,serif' font-size='26' fill='%23a89b85'%3ENo Portrait%3C/text%3E%3C/svg%3E",
  },

  /* MOTION — the slam press, shared recipe */
  slamTransition: 'transform .08s steps(2), box-shadow .08s steps(2)',
};

export default neu;
export const color = neu;
