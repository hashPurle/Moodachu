import { create } from 'zustand';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut,
  // NEW: Import Email functions
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from '../utils/firebase';
import { PET_STATES } from '../utils/constants';

export const useAppStore = create((set, get) => ({
  user: null,
  isLoggingIn: false,
  error: null, // To store login errors
  
  // Mock Data
  relationships: [
    { id: '1', partnerName: 'Alice', petName: 'Shadow', petState: 0, status: 'active' },
    { id: '2', partnerName: 'Bob', petName: 'Ghost', petState: 0, status: 'pending' },
  ],

  // --- ACTIONS ---

  // 1. Google Login
  loginWithGoogle: async () => {
    set({ isLoggingIn: true, error: null });
    try {
      const result = await signInWithPopup(auth, googleProvider);
      set({ user: result.user, isLoggingIn: false });
      return true;
    } catch (error) {
      set({ isLoggingIn: false, error: error.message });
      return false;
    }
  },

  // 2. Email Sign Up
  signupWithEmail: async (email, password, name) => {
    set({ isLoggingIn: true, error: null });
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // Update the user's display name
      await updateProfile(result.user, { displayName: name });
      set({ user: result.user, isLoggingIn: false });
      return true;
    } catch (error) {
      set({ isLoggingIn: false, error: error.message });
      return false;
    }
  },

  // 3. Email Login
  loginWithEmail: async (email, password) => {
    set({ isLoggingIn: true, error: null });
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      set({ user: result.user, isLoggingIn: false });
      return true;
    } catch (error) {
      set({ isLoggingIn: false, error: error.message });
      return false;
    }
  },

  logout: async () => {
    await signOut(auth);
    set({ user: null });
  },

  // ... (Keep your existing addRequest, interactWithPet, etc. logic here) ...
  addRequest: (partnerName, petName) => 
    set((state) => ({
      relationships: [...state.relationships, { id: Math.random().toString(), partnerName, petName, petState: 0, status: 'pending' }]
    })),

  acceptRequest: (id) =>
    set((state) => ({
      relationships: state.relationships.map(r => r.id === id ? { ...r, status: 'active' } : r)
    })),

  simulatePartnerInteraction: (id) =>
    set((state) => ({
      relationships: state.relationships.map(r => r.id === id ? { ...r, petState: Math.floor(Math.random() * 5) } : r)
    })),
  
  // Set explicit mood (useful when parsing messages or reacting to events)
  setMood: (id, mood) =>
    set((state) => ({
      relationships: state.relationships.map(r => r.id === id ? { ...r, petState: mood } : r)
    })),

  interactWithPet: (id, type) => {
    const currentPet = get().relationships.find(r => r.id === id);
    if (!currentPet) return;
    const originalState = currentPet.petState;
    set((state) => ({
      relationships: state.relationships.map(r => r.id === id ? { ...r, petState: 1 } : r)
    }));
    setTimeout(() => {
        set((state) => ({
            relationships: state.relationships.map(r => r.id === id ? { ...r, petState: originalState } : r)
          }));
    }, 2500);
  }
}));