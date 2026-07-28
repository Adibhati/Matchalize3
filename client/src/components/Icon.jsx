import React, { forwardRef, memo } from 'react';

const Icon = forwardRef(({ 
  path, 
  size = 20, 
  color = 'currentColor', 
  strokeWidth = 1.8, 
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
      ...style 
    }}
    {...props}
  >
    {path}
  </svg>
));

// Display name required when using forwardRef + memo
Icon.displayName = 'Icon';

export default memo(Icon);