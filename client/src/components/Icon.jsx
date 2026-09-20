import React, { forwardRef, memo } from 'react';

/* ============================================================
   THE ONE ICON PRIMITIVE — Lucide path data only.
   Locked scale: 10 / 12 / 14 / 16 / 18 (never arbitrary sizes).
   Stroke: 2 standard, 1.75 for large display icons.
   Color comes from the caller (ink scale / accent / crimson).
============================================================ */

const Icon = forwardRef(({
  path,
  size = 16,
  color = 'currentColor',
  strokeWidth = 2,
  fill = 'none',
  className = '',
  style = {},
  ...props
}, ref) => (
  <svg
    ref={ref}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true" // Defers screen-reader announcements to parent buttons
    className={className}
    style={{
      display: 'block',
      flexShrink: 0, // Prevents SVG squishing in tight flex layouts
      ...style,
    }}
    {...props}
  >
    {path}
  </svg>
));

// Display name required when using forwardRef + memo
Icon.displayName = 'Icon';

/* The legal size steps — import where icons are placed */
Icon.SIZES = { xs: 10, sm: 12, md: 14, lg: 16, xl: 18 };

export default memo(Icon);