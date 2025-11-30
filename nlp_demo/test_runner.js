// nlp_demo/test_runner.js
const { getEmotionID } = require('./emotionMap');

const testCases = [
    "I am so happy today!",
    "Work is making me stressed.",
    "I feel totally exhausted...",
    "I want more space from you.",
    "I miss you so much",
    "I feel ignored lately",
    "I ate a sandwich", // Should be Neutral
];

console.log("--- STARTING NLP TEST ---");

testCases.forEach(text => {
    const id = getEmotionID(text);
    console.log(`Input: "${text}" --> ID: ${id}`);
});

console.log("--- TEST COMPLETE ---");