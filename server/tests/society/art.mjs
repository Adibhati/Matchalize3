// Deterministic SVG persona art -> data URIs. No external requests, ever.

function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

const PALETTES = [
  ['#2b1a4e', '#582b8f', '#e8a6ff'],
  ['#0e2a47', '#1f5f8f', '#9fd6ff'],
  ['#3a1d0d', '#8f4a1f', '#ffc89f'],
  ['#1d3a0d', '#4f8f1f', '#c4ff9f'],
  ['#420d1d', '#8f1f47', '#ff9fc2'],
  ['#0d2e2e', '#1f6f6f', '#9fffff'],
  ['#2e2e0d', '#6f6f1f', '#ffff9f'],
  ['#3a0d24', '#8f1f5e', '#ff9fe0'],
];

function ip(f) {
  return Math.floor(f() * 100000) % 100;
}

export function personaImage(seed, variant = 'portrait') {
  const rnd = xmur3(String(seed));
  const pal = PALETTES[ip(rnd) % PALETTES.length];
  const [dark, mid, light] = pal;
  const dims =
    variant === 'land' ? { w: 1280, h: 720 } : variant === 'square' ? { w: 600, h: 600 } : { w: 600, h: 800 };
  const { w, h } = dims;
  const cx = ip(rnd) % w;
  const cy = ip(rnd) % h;
  const pattern = ip(rnd) % 4;
  const rings = (ip(rnd) % 6) + 3;
  const initials = String(seed)
    .split(/[^A-Za-z]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

  let deco = '';
  if (pattern === 0) {
    for (let i = 0; i < rings; i++) {
      deco += `<circle cx="${cx}" cy="${cy}" r="${90 + i * 54}" fill="none" stroke="${light}" stroke-opacity="${0.14 + ip(rnd) / 300}" stroke-width="${6 + (ip(rnd) % 10)}"/>`;
    }
  } else if (pattern === 1) {
    const step = 60;
    for (let x = -h; x < w + h; x += step) {
      deco += `<line x1="${x}" y1="0" x2="${x + h}" y2="${h}" stroke="${light}" stroke-opacity="0.12" stroke-width="${4 + (ip(rnd) % 12)}"/>`;
    }
  } else if (pattern === 2) {
    for (let i = 0; i < 40; i++) {
      deco += `<circle cx="${ip(rnd) % w}" cy="${ip(rnd) % h}" r="${2 + (ip(rnd) % 9)}" fill="${light}" fill-opacity="0.25"/>`;
    }
  } else {
    for (let i = 0; i < 12; i++) {
      const bx = ip(rnd) % w;
      const by = ip(rnd) % h;
      deco += `<rect x="${bx}" y="${by}" width="${120 + (ip(rnd) % 220)}" height="${160 + (ip(rnd) % 260)}" rx="90" transform="rotate(${ip(rnd) % 360} ${bx} ${by})" fill="${light}" fill-opacity="0.10"/>`;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${dark}"/>
      <stop offset="1" stop-color="${mid}"/>
    </linearGradient>
    <radialGradient id="v">
      <stop offset="68%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.55)"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${w * 0.85}" ry="${h * 0.85}" fill="${light}" fill-opacity="0.07"/>
  ${deco}
  <text x="${w / 2}" y="${h / 2}" text-anchor="middle" dominant-baseline="central"
    font-family="Georgia, serif" font-weight="700" font-size="${Math.round(h / 3)}"
    fill="${light}" fill-opacity="0.85" letter-spacing="4">${initials || '*'}</text>
  <rect width="${w}" height="${h}" fill="url(#v)"/>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}