import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { setPersistence, browserLocalPersistence } from 'firebase/auth';

// --- PASTE YOUR CONFIG FROM FIREBASE CONSOLE BELOW ---
// (Make sure to keep your actual keys here!)
const firebaseConfig = {
  apiKey: "AIzaSyCcAlw7Iu4V-I-sUFbTbxn1Aa7Su5V4oDc",
  authDomain: "moodachu-1c272.firebaseapp.com",
  projectId: "moodachu-1c272",
  storageBucket: "moodachu-1c272.firebasestorage.app",
  messagingSenderId: "546983321184",
  appId: "1:546983321184:web:176fcb546d98ac919c2d05",
  measurementId: "G-NFB0E449WC"
};
// ----------------------------------------------------

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile 
};

// Ensure local persistence for the auth session
setPersistence(auth, browserLocalPersistence).catch((err) => {
  // It's okay to ignore but log for debug
  console.warn('[firebase] setPersistence failed', err.message);
});