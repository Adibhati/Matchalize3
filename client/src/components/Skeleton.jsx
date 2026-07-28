import React from 'react';
import { theme } from '../utils/theme';

export const SkeletonBox = ({ width, height, radius = theme.radius?.sm || '4px' }) => (
  <div 
    className="archival-skeleton"
    aria-hidden="true"
    style={{
      width, 
      height, 
      borderRadius: radius,
      backgroundColor: theme.color?.surfaceAlt || '#f4f1ea',
      position: 'relative',
      overflow: 'hidden',
      flexShrink: 0,
      contain: 'paint layout',
      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.03)',
    }}
  />
);

export default SkeletonBox;
