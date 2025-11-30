// nlp_demo/emotionMap.js

// Import the shared constants so we stay synced with the team
const { EMOTION_TAGS } = require('../shared/constants');

/**
 * Raw keyword->tag mapping.
 * Keys here are **lowercase** and may be single words or phrases.
 */
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
    "congratulations": EMOTION_TAGS.HAPPY,
    "wonderful": EMOTION_TAGS.HAPPY,
    "sweet": EMOTION_TAGS.HAPPY,
    "glad": EMOTION_TAGS.HAPPY,
    "joyful": EMOTION_TAGS.HAPPY,
    "cheerful": EMOTION_TAGS.HAPPY,
    "delighted": EMOTION_TAGS.HAPPY,
    "thrilled": EMOTION_TAGS.HAPPY,
    "Awesome": EMOTION_TAGS.HAPPY,
    "Surprised": EMOTION_TAGS.HAPPY,
    "Delightful": EMOTION_TAGS.HAPPY,

    // STRESSED (1)
    "stressed": EMOTION_TAGS.STRESSED,
    "overwhelmed": EMOTION_TAGS.STRESSED,
    "pressure": EMOTION_TAGS.STRESSED,
    "busy": EMOTION_TAGS.STRESSED,
    "deadline": EMOTION_TAGS.STRESSED,
    "anxious": EMOTION_TAGS.STRESSED,
    "panic": EMOTION_TAGS.STRESSED,
    "nerves": EMOTION_TAGS.STRESSED,
    "overloaded": EMOTION_TAGS.STRESSED,

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
    "closeness": EMOTION_TAGS.NEED_AFFECTION,
    "comfort": EMOTION_TAGS.NEED_AFFECTION,
    "warmth": EMOTION_TAGS.NEED_AFFECTION,

    // NEGLECTED (5)
    "ignored": EMOTION_TAGS.NEGLECTED,
    "forgot": EMOTION_TAGS.NEGLECTED,
    "unseen": EMOTION_TAGS.NEGLECTED,
    "neglect": EMOTION_TAGS.NEGLECTED,
    "priority": EMOTION_TAGS.NEGLECTED,
    "overlooked": EMOTION_TAGS.NEGLECTED,
    "forgotten": EMOTION_TAGS.NEGLECTED,
    "unnoticed": EMOTION_TAGS.NEGLECTED,
    "left out": EMOTION_TAGS.NEGLECTED
};

/** Escape regex special chars for safe regex building */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Main Function: Analyze Text
 * Returns the numeric ID (0-6) for the ZK Circuit.
 */
function getEmotionID(inputText) {
    if (!inputText) return EMOTION_TAGS.NEUTRAL;

    // 1. Clean the text (lowercase, remove punctuation except spaces)
    const cleanedText = inputText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    // 2. Try phrase / whole-word matching across the entire text
    for (let key of Object.keys(KEYWORD_DATABASE)) {
        const pattern = new RegExp('\\b' + escapeRegExp(key) + '\\b', 'i'); // 'i' keeps it safe if we missed a lowercase
        if (pattern.test(cleanedText)) {
            return KEYWORD_DATABASE[key];
        }
    }

    // 3. Fallback: If no keywords found, return Neutral
    return EMOTION_TAGS.NEUTRAL;
}

// Export for the Frontend to use
module.exports = { getEmotionID };
