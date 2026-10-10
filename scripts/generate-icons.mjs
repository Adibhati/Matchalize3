import zlib from 'node:zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const BRAND = [249, 115, 22]; // #f97316
const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

const inHeart = (x, y) => {
  const a = x * x + y * y - 1;
  return a * a * a - x * x * y * y * y <= 0;
};

const buildPng = (size, mode) => {
  const raw = Buffer.alloc(size * (size * 4 + 1)); // 1 filter byte per row
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const nx = (x / size) * 2.4 - 1.2;
      const ny = (y / size) * 2.4 - 1.2;
      const inside = inHeart(nx, ny * 0.9);
      const corner = Math.hypot(x - (size - 1) / 2, y - (size - 1) / 2) > (size / 2) * 0.92;
      const px = mode === 'icon' ? (inside ? WHITE : BRAND) : (inside ? BRAND : BLACK);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      if (corner && mode !== 'badge') {
        raw[o] = raw[o + 1] = raw[o + 2] = 0;
        raw[o + 3] = 0;
      } else {
        raw[o] = px[0];
        raw[o + 1] = px[1];
        raw[o + 2] = px[2];
        raw[o + 3] = 255;
      }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

const iconsDir = join(process.cwd(), 'client', 'public', 'icons');
mkdirSync(iconsDir, { recursive: true });

const specs = [
  { name: 'icon-192.png', size: 192, mode: 'icon' },
  { name: 'icon-512.png', size: 512, mode: 'icon' },
  { name: 'badge-72.png', size: 72, mode: 'badge' },
];

for (const { name, size, mode } of specs) {
  writeFileSync(join(iconsDir, name), buildPng(size, mode));
  console.log(`✓ Generated ${name} (${size}x${size})`);
}