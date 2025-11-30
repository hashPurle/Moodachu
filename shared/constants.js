// shared/constants.js

// 1. Private Emotion Tags (Inputs from Member 4 -> ZK Circuit)
// These match the circuit logic exactly. DO NOT CHANGE.
const EMOTION_TAGS = {
    HAPPY: 0,
    STRESSED: 1,
    TIRED: 2,
    NEED_SPACE: 3,
    NEED_AFFECTION: 4,
    NEGLECTED: 5,
    NEUTRAL: 6
};

// 2. Public Pet States (Output from ZK Circuit -> Smart Contract)
const PET_STATES = {
    NEUTRAL: 0,     // Default
    DANCE: 1,       // Both Happy
    SLEEPY: 2,      // One Low
    STORM: 3,       // Both Stressed (Conflict Mode)
    GROW: 4         // Mutual Growth
};

// 3. Interaction Types (Direct User Actions for the Pet)
const INTERACTION_TYPES = {
    STROKE: 100,
    FEED: 101
};

// Export for use in Frontend and NLP modules
export { EMOTION_TAGS, PET_STATES, INTERACTION_TYPES };

// Backwards compatible CommonJS export
if (typeof module !== 'undefined') {
    module.exports = { EMOTION_TAGS, PET_STATES, INTERACTION_TYPES };
}