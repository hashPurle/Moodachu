// nlp_demo/emotionMap.js

// Import the shared constants so we stay synced with the team
const { EMOTION_TAGS } = require('../shared/constants');

// The "Keyword Dictionary"
// Maps specific words to the ZK-friendly Emotion IDs
const KEYWORD_DATABASE = {
    // HAPPY (0)
    "happy": EMOTION_TAGS.HAPPY,
    "excited": EMOTION_TAGS.HAPPY,
    "great": EMOTION_TAGS.HAPPY,
    "love": EMOTION_TAGS.HAPPY,
    "joy": EMOTION_TAGS.HAPPY,
    "amazing": EMOTION_TAGS.HAPPY,
    "good": EMOTION_TAGS.HAPPY,
    "pleasure": EMOTION_TAGS.HAPPY,
    "grateful": EMOTION_TAGS.HAPPY,
    "amazing": EMOTION_TAGS.HAPPY,
    "congratulations": EMOTION_TAGS.HAPPY,
    "wonderful": EMOTION_TAGS.HAPPY,
    "Sweet": EMOTION_TAGS.HAPPY,
    "Glad": EMOTION_TAGS.HAPPY,
    "Joyful": EMOTION_TAGS.HAPPY,
    "Cheerful": EMOTION_TAGS.HAPPY,
    "Delighted": EMOTION_TAGS.HAPPY,
    "Thrilled": EMOTION_TAGS.HAPPY,

    // STRESSED (1)
    "stressed": EMOTION_TAGS.STRESSED,
    "overwhelmed": EMOTION_TAGS.STRESSED,
    "pressure": EMOTION_TAGS.STRESSED,
    "busy": EMOTION_TAGS.STRESSED,
    "deadline": EMOTION_TAGS.STRESSED,
    "anxious": EMOTION_TAGS.STRESSED,
    "panic": EMOTION_TAGS.STRESSED,
    "Stressed": EMOTION_TAGS.STRESSED,
    "Nerves": EMOTION_TAGS.STRESSED,
    "Overloaded": EMOTION_TAGS.STRESSED,

    // TIRED (2)
    "tired": EMOTION_TAGS.TIRED,
    "exhausted": EMOTION_TAGS.TIRED,
    "sleep": EMOTION_TAGS.TIRED,
    "drained": EMOTION_TAGS.TIRED,
    "burnout": EMOTION_TAGS.TIRED,
    "weak": EMOTION_TAGS.TIRED,
    "low": EMOTION_TAGS.TIRED,

    // NEED_SPACE (3)
    "space": EMOTION_TAGS.NEED_SPACE,
    "alone": EMOTION_TAGS.NEED_SPACE,
    "distance": EMOTION_TAGS.NEED_SPACE,
    "quiet": EMOTION_TAGS.NEED_SPACE,
    "leave me": EMOTION_TAGS.NEED_SPACE,
    "suffocated": EMOTION_TAGS.NEED_SPACE,

    // NEED_AFFECTION (4)
    "hug": EMOTION_TAGS.NEED_AFFECTION,
    "hold": EMOTION_TAGS.NEED_AFFECTION,
    "cuddle": EMOTION_TAGS.NEED_AFFECTION,
    "miss": EMOTION_TAGS.NEED_AFFECTION,
    "lonely": EMOTION_TAGS.NEED_AFFECTION,
    "affection": EMOTION_TAGS.NEED_AFFECTION,
    "attention": EMOTION_TAGS.NEED_AFFECTION,
    "Closeness": EMOTION_TAGS.NEED_AFFECTION,
    "Comofort": EMOTION_TAGS.NEED_AFFECTION,
    "Warmth": EMOTION_TAGS.NEED_AFFECTION,

    // NEGLECTED (5)
    "ignored": EMOTION_TAGS.NEGLECTED,
    "forgot": EMOTION_TAGS.NEGLECTED,
    "unseen": EMOTION_TAGS.NEGLECTED,
    "neglect": EMOTION_TAGS.NEGLECTED,
    "priority": EMOTION_TAGS.NEGLECTED,
    "Overlooked": EMOTION_TAGS.NEGLECTED,
    "Forgotten": EMOTION_TAGS.NEGLECTED,
    "unnoticed": EMOTION_TAGS.NEGLECTED,
    "Left out": EMOTION_TAGS.NEGLECTED
};

/**
 * Main Function: Analyze Text
 * Returns the numeric ID (0-6) for the ZK Circuit.
 */
function getEmotionID(inputText) {
    if (!inputText) return EMOTION_TAGS.NEUTRAL;

    // 1. Clean the text (lowercase, remove punctuation)
    const cleanedText = inputText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    const words = cleanedText.split(/\s+/);

    // 2. Scan for keywords
    // We check every word the user typed to see if it matches our database
    for (let word of words) {
        if (KEYWORD_DATABASE.hasOwnProperty(word)) {
            return KEYWORD_DATABASE[word];
        }
    }

    // 3. Fallback: If no keywords found, return Neutral (6)
    return EMOTION_TAGS.NEUTRAL;
}

// Export for the Frontend to use
module.exports = { getEmotionID };