export const theme = {
  color: {
    bg: '#f4f1ea',
    paper: '#fdfbf7',
    surface: '#ffffff',
    surfaceAlt: '#f4f1ea',
    surfaceDim: '#e0d8c8',

    ink: '#1a1a1a',
    inkSoft: '#4a4a4a',
    inkMuted: '#8c8275',

    border: '#e0d8c8',
    borderDark: '#d4c5a9',

    accent: '#8b4513',
    accentSoft: 'rgba(139, 69, 19, 0.18)',
    accentFaint: 'rgba(139, 69, 19, 0.05)',

    crimson: '#8b1a1a',
    crimsonSoft: 'rgba(139, 26, 26, 0.08)',

    success: '#2e7d32',
    warning: '#b8860b',
    telegramTint: 'rgba(212, 175, 55, 0.08)',

    shadowWarm: 'rgba(139, 69, 19, 0.12)',
    shadowDark: 'rgba(26, 26, 26, 0.20)',

    neuDark: '#dedad2',
    neuLight: '#ffffff',
  },

  font: {
    display: "'Playfair Display', Georgia, serif",
    heading: "'Playfair Display', Georgia, serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    typewriter: "'Special Elite', 'Courier New', monospace",
  },

  texture: {
    grain:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E",
  },

  radius: {
    sm: '8px',
    md: '12px',
    lg: '24px',
    pill: '999px',
  },

  placeholder: {
    avatar:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%23ede7db'/%3E%3Cg fill='none' stroke='%23c9bda6' stroke-width='3'%3E%3Ccircle cx='60' cy='48' r='17'/%3E%3Cpath d='M28 104c0-18 14-32 32-32s32 14 32 32'/%3E%3C/g%3E%3C/svg%3E",
    image:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect width='400' height='500' fill='%23ede7db'/%3E%3Cg fill='none' stroke='%23c9bda6' stroke-width='3'%3E%3Ccircle cx='200' cy='195' r='50'/%3E%3Cpath d='M112 385c0-49 39-88 88-88s88 39 88 88'/%3E%3C/g%3E%3C/svg%3E",
    hero:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='870' viewBox='0 0 600 870'%3E%3Crect width='600' height='870' fill='%23e8e4d9'/%3E%3Cg fill='none' stroke='%23c9bda6' stroke-width='4'%3E%3Ccircle cx='300' cy='340' r='82'/%3E%3Cpath d='M158 660c0-78 63-142 142-142s142 64 142 142'/%3E%3C/g%3E%3Ctext x='300' y='740' text-anchor='middle' font-family='Georgia,serif' font-size='26' fill='%23a89b85'%3ENo Portrait%3C/text%3E%3C/svg%3E",
  },

  z: {
    header: 500,
    nav: 10,
    drawer: 1000,
    modal: 1100,
    toast: 9999,
    overlay: 10000,
  },
};

export default theme;