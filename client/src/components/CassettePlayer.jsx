import React, { useRef, useState } from 'react';

const CassettePlayer = ({ audioUrl }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio && audio.duration) {
      setCurrentTime(audio.currentTime);
      setProgress(audio.currentTime / audio.duration);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div
      style={{
        backgroundColor: '#fffcf5',
        border: '1.5px solid #d4af37',
        borderRadius: '12px',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        width: '260px',
        boxShadow: '0 4px 10px rgba(212, 175, 55, 0.12)',
        boxSizing: 'border-box',
      }}
    >
      {/* Twin Spinning Tape Reels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
        {[0, 1].map((idx) => (
          <div
            key={idx}
            className={`cassette-spool ${isPlaying ? 'playing' : ''}`}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#2a221e',
              border: '2px solid #d4af37',
              position: 'relative',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: '10px', width: '2px', height: '20px', backgroundColor: '#d4af37' }} />
            <div style={{ position: 'absolute', top: '10px', left: 0, width: '20px', height: '2px', backgroundColor: '#d4af37' }} />
          </div>
        ))}
      </div>

      {/* Player Controls & Progress */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            type="button"
            onClick={togglePlay}
            style={{
              backgroundColor: '#8b1a1a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(139, 26, 26, 0.2)',
            }}
          >
            {isPlaying ? '❚❚' : '▶'}
          </button>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#8b4513', letterSpacing: '0.5px' }}>
            CASSETTE
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: '10px', height: '4px', backgroundColor: '#e0d8c8', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: '#8b1a1a', transition: 'width 0.1s linear' }} />
        </div>

        {/* Timestamp */}
        <div style={{ marginTop: '4px', fontSize: '10px', color: '#8c8275', textAlign: 'right', fontFamily: 'monospace' }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        style={{ display: 'none' }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => setDuration(e.target.duration || 0)}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
};

export default CassettePlayer;
