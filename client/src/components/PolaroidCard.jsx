import React, { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { theme as design } from '../utils/theme';

/**
 * PolaroidCard — chat image bubble.
 * Props: src, caption, tilt, onExpand
 */
const PolaroidCard = ({ src, caption, tilt = '0deg', onExpand }) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const resolvedSrc = failed ? design.placeholder.image : src;

  return (
    <motion.figure
      initial={{ opacity: 0, y: 8, rotate: 0 }}
      animate={{ opacity: 1, y: 0, rotate: tilt }}
      transition={{ type: 'spring', damping: 24, stiffness: 320 }}
      onClick={onExpand}
      style={{
        margin: 0,
        padding: caption ? '7px 7px 0 7px' : '7px 7px 20px 7px',
        width: '240px',
        backgroundColor: '#ffffff',
        border: '1px solid rgba(0,0,0,0.06)',
        borderRadius: 3,
        boxShadow: '0 10px 24px rgba(88,63,30,0.2)',
        cursor: onExpand ? 'zoom-in' : 'default',
        transformOrigin: 'center center',
        willChange: 'transform',
        boxSizing: 'border-box',
        contain: 'layout paint',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          overflow: 'hidden',
          backgroundColor: '#f4f1ea',
          borderRadius: 2,
        }}
      >
        <img
          src={resolvedSrc}
          alt={caption || 'Shared photograph'}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setFailed(true);
            setLoaded(true);
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.4s ease-out',
          }}
        />
      </div>

      {caption ? (
        <figcaption
          style={{
            padding: '8px 2px 14px',
            fontFamily: "'Special Elite', 'Courier New', monospace",
            fontSize: '12.5px',
            lineHeight: 1.5,
            color: '#4a4a4a',
            textAlign: 'center',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
        >
          {caption}
        </figcaption>
      ) : null}
    </motion.figure>
  );
};

export default memo(PolaroidCard);