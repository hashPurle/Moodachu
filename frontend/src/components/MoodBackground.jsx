import React from 'react';
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

  return (
    <div className={`absolute inset-0 ${moodClass} -z-30 pointer-events-none`} aria-hidden>
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

      {/* Soft sun/aurora for happy/grow */}
      <div className="glow" aria-hidden />
    </div>
  );
}
