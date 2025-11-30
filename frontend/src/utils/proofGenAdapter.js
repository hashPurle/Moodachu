// frontend/src/utils/proofGenAdapter.js
// Simple adapter that attempts to use a real browser prover if available (served from /zk),
// otherwise returns a mocked proof object for demo/testing.
import { PET_STATES } from './constants';
import { EMOTION_TAGS } from '../../../shared/constants.js';

// Map emotion id -> pet state (same mapping as in PetRoom)
const mapEmotionToPetState = (emotionId) => {
  switch (emotionId) {
    case EMOTION_TAGS.HAPPY: return PET_STATES.DANCE;
    case EMOTION_TAGS.STRESSED: return PET_STATES.STORM;
    case EMOTION_TAGS.TIRED: return PET_STATES.SLEEPY;
    case EMOTION_TAGS.NEED_SPACE: return PET_STATES.SLEEPY;
    case EMOTION_TAGS.NEED_AFFECTION: return PET_STATES.GROW;
    case EMOTION_TAGS.NEGLECTED: return PET_STATES.STORM;
    default: return PET_STATES.NEUTRAL;
  }
};

export async function generateProof({ emotionId, pairId, userId }) {
  const claimedState = mapEmotionToPetState(emotionId);

  // Try to call a browser-side ZK prover if available under /zk/moodachu_prover.browser.js
  try {
    // In dev setups where the ZK prover is served via the frontend public folder,
    // this dynamic import may succeed. If not, fallback to mock.
    if (typeof window !== 'undefined' && window.generateMoodachuProofBrowser) {
      // if a globally registered function is available (optional), use that
      const result = await window.generateMoodachuProofBrowser({ emotionId, pairId, userId });
      return { ...result, claimedState, mock: false };
    }

    // Try dynamic import if environment supports it
    const possiblePaths = [
      '/zk/moodachu_prover.browser.js',
      '/moodachu_prover.browser.js',
    ];
    for (const p of possiblePaths) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const module = await import(p);
        if (module && typeof module.generateMoodachuProofBrowser === 'function') {
          const r = await module.generateMoodachuProofBrowser({ emotionId, pairId, userId });
          return { ...r, claimedState, mock: false };
        }
      } catch (e) {
        // ignore and try next
      }
    }
  } catch (err) {
    // Continue to fallback
  }

  // Default mock proof
  const mockProof = { a: [], b: [], c: [] };
  const publicSignals = [claimedState];
  return { proof: mockProof, publicSignals, claimedState, mock: true };
}

export function makeMockProofForTest(claimedState) {
  return { proof: { a: [claimedState], b: [], c: []}, publicSignals: [claimedState] };
}

export default { generateProof };
