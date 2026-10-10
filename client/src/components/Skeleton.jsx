// client/src/components/Skeleton.jsx
import React from 'react';
import neu from '../styles/neu';

/* ── Locked skeleton system — matches the neubrutalism theme ──
   Fill = the cream hairline tone (visible on both the dark desk and cream sheets).
   Shimmer = a single ink-tinted sweep, GPU-composited (background-position only). */

const SKELETON_CSS = `
  .sk-box { position: relative; overflow: hidden; flex-shrink: 0;
    background-color: ${neu.hair};
    contain: paint; }
  .sk-box::after { content: ''; position: absolute; inset: 0;
    background-image: linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%);
    background-size: 200% 100%; background-repeat: no-repeat;
    animation: sk-sweep 1.6s linear infinite; }
  @keyframes sk-sweep { from { background-position: 200% 0; } to { background-position: -200% 0; } }

  /* on dark surfaces the cream block already pops — keep it, just dim the sweep */
  .sk-dark .sk-box::after { background-image: linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%); }

  @media (prefers-reduced-motion: reduce) {
    .sk-box::after { animation: none; }
  }
`;

/* Inject once per page — the ::after keyframes can't be inlined per-element */
let cssInjected = false;
const ensureCss = () => {
  if (cssInjected || typeof document === 'undefined') return;
  const tag = document.createElement('style');
  tag.textContent = SKELETON_CSS;
  document.head.appendChild(tag);
  cssInjected = true;
};

export const SkeletonBox = ({ width, height, radius = 4, dark = false }) => {
  ensureCss();

  return (
    <div
      className={`sk-box${dark ? ' sk-dark' : ''}`}
      aria-hidden="true"
      style={{
        width,
        height,
        borderRadius: radius,
      }}
    />
  );
};

export default SkeletonBox;