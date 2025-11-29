import React, { useEffect, useRef } from 'react';
import { PET_STATES } from '../utils/constants';

const moodToClass = {
  [PET_STATES.NEUTRAL]: 'mood-neutral',
  [PET_STATES.DANCE]: 'mood-happy',
  [PET_STATES.SLEEPY]: 'mood-sleepy',
  [PET_STATES.STORM]: 'mood-storm',
  [PET_STATES.GROW]: 'mood-grow',
};

export default function MoodBackground({ petState = PET_STATES.NEUTRAL }) {
  const moodClass = moodToClass[petState] || moodToClass[PET_STATES.NEUTRAL];

  const ref = useRef();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      el.style.setProperty('--mx', x.toFixed(4));
      el.style.setProperty('--my', y.toFixed(4));
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div ref={ref} className={`absolute inset-0 ${moodClass} z-0 pointer-events-none`} aria-hidden>
      {/* Decorative/Animated layers are purely presentational */}
      <div className="mood-overlay" />

      {/* Clouds (storm/happy variants) */}
      <div className="clouds" aria-hidden>
        <div className="cloud c1" />
        <div className="cloud c2" />
        <div className="cloud c3" />
      </div>

      {/* Rain (storm only) */}
      <div className="rain" aria-hidden />

      {/* Lightning (storm only) */}
      <div className="lightning" aria-hidden />

      {/* Stars (sleepy only) */}
      <div className="stars" aria-hidden>
        {[...Array(40)].map((_, i) => <div key={i} className="star" />)}
      </div>

      {/* Happy hearts & confetti */}
      <div className="hearts" aria-hidden>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="heart" style={{ left: `${5 + Math.random() * 90}%`, animationDelay: `${Math.random() * 3}s` }} />
        ))}
      </div>
      <div className="confetti" aria-hidden>
        {[...Array(16)].map((_, i) => (
          <div key={i} className="confetti-piece" style={{ left: `${Math.random() * 100}%`, transform: `rotate(${Math.random() * 360}deg)`, animationDelay: `${Math.random() * 1.8}s` }} />
        ))}
      </div>

      {/* Grow sprouts */}
      <div className="sprouts" aria-hidden>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="sprout" style={{ left: `${10 + i * 14}%`, animationDelay: `${Math.random() * 1.2}s` }}>
            <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden>
              <path d="M12 22V10" stroke="#29c17e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M12 10C13.5 8 16 7 18 8C19 8.6 19.6 9.7 19 11C18 13 16 14 14 15C12 16 11 17 12 18" stroke="#67d49b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
        ))}
      </div>

      {/* Sleepy moon & Zzz */}
      <div className="moon" aria-hidden>
        <div className="crescent" />
        <div className="zzz" aria-hidden>
          <span>z</span><span>z</span><span>z</span>
        </div>
      </div>

      {/* Soft sun/aurora for happy/grow */}
      <div className="glow" aria-hidden />
      {/* Grain / noise overlay */}
      <div className="noise" aria-hidden />
      {/* Subtle vignette for depth */}
      <div className="vignette" aria-hidden />
    </div>
  );
}
