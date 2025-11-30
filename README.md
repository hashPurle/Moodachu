@'
# 📘 Moodachu — It Feels What You Don’t Say

## 🐾 What is Moodachu?
Moodachu is a private emotional mediator for couples, wrapped as a shared digital pet.
You update your emotion privately, and the pet evolves based on the combined emotional state.

No fights.
No awkward talks.
No reading each other’s texts.

---

## 💔 The Problem
People often hide their real feelings to avoid conflict.
This leads to misunderstandings and emotional distance.

Existing couple apps analyze your messages → zero privacy.

---

## 💡 The Solution
Moodachu allows partners to share their feelings privately.
A Zero-Knowledge Proof (ZK) verifies the emotion without revealing the actual message.
A smart contract updates the shared pet with the combined emotional state.

Only the pet’s mood is visible — nothing else.

---

## 🔒 Why Zero-Knowledge (ZK)?
ZK lets us prove your emotional state without anyone seeing it:

- We don’t read your text
- Your partner doesn’t see it
- The blockchain doesn’t see it

ZK = Privacy with trust.

---

## 🔗 Why Blockchain / Midnight?
Midnight Compact smart contracts handle:

1. Verifying ZK-proofs
2. Updating the shared pet
3. Maintaining privacy

Both partners trust the same pet state — no manipulation.

---

## 🧠 How Moodachu Works
1. You select how you feel (privately)
2. NLP maps your feeling to one of 5 moods
3. ZK circuit generates a proof
4. Smart contract verifies it
5. Pet updates (Stormy, Sleepy, Dance, Grow, Neutral)

---

## 🏗 Tech Stack
- Frontend: Next.js + Framer Motion
- ZK: Circom + Groth16
- Blockchain: Midnight Compact

---

## 🚀 How to Run

```bash
npm install
npm run dev