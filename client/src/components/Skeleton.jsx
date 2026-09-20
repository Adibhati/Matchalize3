import React from 'react';

/* Locked skeleton fill — the shimmer surface of the whole app */
const SKELETON_FILL = '#f4f1ea';

export const SkeletonBox = ({ width, height, radius = 4 }) => (
  <div
    className="archival-skeleton"
    aria-hidden="true"
    style={{
      width,
      height,
      borderRadius: radius,
      backgroundColor: SKELETON_FILL,
      position: 'relative',
      overflow: 'hidden',
      flexShrink: 0,
      contain: 'paint layout',
    }}
  />
);

export default SkeletonBox;