import React, { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import neu from '../styles/neu';

/* The shared neo-brutalist canon (src/styles/neu.js) */
const t = neu;

const FALLBACK_IMG = 'https://placehold.co/480x480/fff3dc/191919?text=%C2%B7';

/**
 * PolaroidCard — chat image bubble.
 * Props: src, caption, tilt, onExpand
 */
const PolaroidCard = ({ src, caption, tilt = '0deg', onExpand }) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const resolvedSrc = failed ? FALLBACK_IMG : src;

  return (
    <motion.figure
      initial={{ opacity: 0, y: 8, rotate: 0 }}
      animate={{ opacity: 1, y: 0, rotate: tilt }}
      transition={{ type: 'spring', damping: 24, stiffness: 320 }}
      onClick={onExpand}
      style={{
        margin: 0,
        padding: caption ? '7px 7px 0 7px' : '7px 7px 7px 7px',
        width: '240px',
        backgroundColor: t.card,
        border: `2px solid ${t.ink}`,
        borderRadius: 6,
        boxShadow: `5px 5px 0 ${t.ink}`,
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
          backgroundColor: t.hair,
          borderRadius: 3,
          border: `1.5px solid ${t.ink}`,
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
            padding: '9px 4px 12px',
            fontFamily: t.fontMono,
            fontSize: '10.5px',
            fontWeight: 700,
            letterSpacing: '.04em',
            lineHeight: 1.5,
            color: t.ink2,
            textAlign: 'center',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
        >
          {caption}
        </figcaption>
      ) : (
        <div
          aria-hidden="true"
          style={{ display: 'flex', justifyContent: 'center', padding: '9px 0 10px' }}
        >
          <Camera size={13} strokeWidth={2.4} color={t.ink3} />
        </div>
      )}
    </motion.figure>
  );
};

export default memo(PolaroidCard);