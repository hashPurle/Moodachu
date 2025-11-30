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
import { fetchUserByUsername } from '../utils/moodachuApi';
import { PET_STATES } from '../utils/constants';

export const useAppStore = create((set, get) => ({
  user: null,
    lastEmailPreview: null,
  isLoggingIn: false,
  error: null, // To store login errors
  
  // Mock Data
  relationships: [],

  // --- ACTIONS ---

  // 1. Google Login
  loginWithGoogle: async () => {
    set({ isLoggingIn: true, error: null });
    try {
      // Ensure previous session is signed out to force account chooser and avoid reusing a prior session
      try { await signOut(auth); } catch (err) { /* ignore */ }
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const fallbackName = fbUser.displayName || fbUser.email?.split('@')[0];
      const trimmed = { uid: fbUser.uid, displayName: fallbackName, email: fbUser.email?.trim().toLowerCase(), photoURL: fbUser.photoURL };
      console.debug('[loginWithGoogle] signed-in', trimmed);
      set({ user: trimmed, isLoggingIn: false });
      // Ensure server-side username mapping
      try {
        const reg = await fetch('http://localhost:3000/users', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: trimmed.uid, requestedUsername: trimmed.displayName, displayName: trimmed.displayName, email: trimmed.email })
        });
        if (reg.ok) {
          const j = await reg.json(); if (j && j.user && j.user.username) set({ user: { ...trimmed, username: j.user.username } });
        }
      } catch (err) {
        console.warn('[loginWithGoogle] server register failed', err.message);
      }
      return true;
    } catch (error) {
      set({ isLoggingIn: false, error: error.message });
      return false;
    }
  },

  // 2. Email Sign Up
  signupWithEmail: async (email, password, name, requestedUsername) => {
    set({ isLoggingIn: true, error: null });
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // Update the user's display name
      await updateProfile(result.user, { displayName: name });
      // Trim and set the user object
      const fbUser = result.user;
      const fallbackName = fbUser.displayName || name || fbUser.email?.split('@')[0];
      const trimmed = { uid: fbUser.uid, displayName: fallbackName, email: fbUser.email?.trim().toLowerCase(), photoURL: fbUser.photoURL };
      console.debug('[signupWithEmail] created user', trimmed);
      set({ user: trimmed, isLoggingIn: false });
      // Register user on server with requestedUsername if provided
      try {
        const reg = await fetch('http://localhost:3000/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: fbUser.uid, requestedUsername, displayName: trimmed.displayName, email: trimmed.email })
        });
        if (reg.ok) {
          const j = await reg.json();
          if (j && j.user && j.user.username) set({ user: { ...trimmed, username: j.user.username } });
        }
      } catch (err) {
        console.warn('[signupWithEmail] server register failed', err.message);
      }
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
      const fbUser = result.user;
      const fallbackName = fbUser.displayName || fbUser.email?.split('@')[0];
      const trimmed = { uid: fbUser.uid, displayName: fallbackName, email: fbUser.email?.trim().toLowerCase(), photoURL: fbUser.photoURL };
      console.debug('[loginWithEmail] signed-in', trimmed);
      set({ user: trimmed, isLoggingIn: false });
      try {
        const reg = await fetch('http://localhost:3000/users', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: trimmed.uid, requestedUsername: trimmed.displayName, displayName: trimmed.displayName, email: trimmed.email })
        });
        if (reg.ok) {
          const j = await reg.json(); if (j && j.user && j.user.username) set({ user: { ...trimmed, username: j.user.username } });
        }
      } catch (err) {
        console.warn('[loginWithEmail] server register failed', err.message);
      }
      return true;
    } catch (error) {
      set({ isLoggingIn: false, error: error.message });
      return false;
    }
  },

  logout: async () => {
    await signOut(auth);
    console.debug('[logout] clearing user');
    set({ user: null });
  },

  // ... (Keep your existing addRequest, interactWithPet, etc. logic here) ...
  addRequest: (partnerName, partnerUsername, petName) => {
    const id = Math.random().toString();
    const normalizedUsername = partnerUsername ? partnerUsername.trim().toLowerCase() : partnerUsername;
    set((state) => ({
      relationships: [...state.relationships, { id, partnerName, partnerUsername: normalizedUsername, petName, petState: 0, status: 'pending', shared: false }]
    }));
    // Create server invite (persisted), and send notification via server
    (async () => {
      // server-side validation: ensure target username exists before sending
      try {
        const ucheck = await fetchUserByUsername(normalizedUsername);
        if (!ucheck || !ucheck.ok) {
          // mark local relationship as error with message
          set((state) => ({ relationships: state.relationships.map(r => r.id === id ? { ...r, status: 'error', error: ucheck && ucheck.error ? ucheck.error : 'username not found' } : r) }));
          return id;
        }
      } catch (err) {
        console.warn('[addRequest] username pre-check failed', err.message);
        set((state) => ({ relationships: state.relationships.map(r => r.id === id ? { ...r, status: 'error', error: 'network error' } : r) }));
        return id;
      }
      // Ensure current user has a username mapping on the server
      if (!get().user?.username && get().user?.uid) {
        try {
          const reg = await fetch('http://localhost:3000/users', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: get().user.uid, requestedUsername: get().user.displayName, displayName: get().user.displayName, email: get().user.email })
          });
          if (reg.ok) {
            const jr = await reg.json(); if (jr && jr.user && jr.user.username) set((s) => ({ user: { ...s.user, username: jr.user.username } }));
          }
        } catch (err) {
          console.warn('[addRequest] ensure user registration failed', err.message);
        }
      }
      try {
        const res = await fetch('http://localhost:3000/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toUsername: normalizedUsername, fromUid: get().user?.uid, fromUsername: get().user?.username || get().user?.displayName || '', fromDisplayName: get().user?.displayName || '', petName, partnerName })
        });
        const j = await res.json();
        if (!res.ok) {
          console.warn('[addRequest] invite create failed server response', j);
          // mark relationship as error
          set((state) => ({ relationships: state.relationships.map(r => r.id === id ? { ...r, status: 'error', error: j.error || 'invite failed' } : r) }));
          return;
        }
        console.debug('[addRequest] invite created', j);
        // attach server invite id to the local relationship (find by local id)
        if (j && j.id) {
          set((state) => ({ relationships: state.relationships.map(r => r.id === id ? { ...r, serverInviteId: j.id } : r) }));
        }
        if (j && j.preview) {
          set({ lastEmailPreview: j.preview });
        }
      } catch (err) {
        console.warn('[addRequest] invite create failed', err.message);
      }
    })();
    // No email is sent for invite requests; UX uses in-app invites by username.
    return id;
  },

  // Fetch pairs for current user from the server and update relationships (only accepted pairs)
  fetchPairs: async () => {
    const user = get().user;
    if (!user || !user.username) return;
    try {
      const res = await fetch(`http://localhost:3000/pairs?username=${encodeURIComponent(user.username)}`);
      if (!res.ok) return;
      const j = await res.json();
      const pairs = j && j.pairs ? j.pairs : [];
      // convert server pairs to local relationships (status active)
      set((state) => ({
        relationships: [
          ...state.relationships.filter(r => r.status !== 'active'),
          ...pairs.map(p => ({ id: p.id, partnerName: p.partnerDisplayName, partnerUsername: p.partnerUsername, petName: p.petName, petState: p.petState || 0, status: 'active', shared: true }))
        ]
      }));
      console.debug('[fetchPairs] loaded pairs', pairs.length);
    } catch (err) {
      console.warn('[fetchPairs] failed', err.message);
    }
  },

  // Add an invite that's been created on the server for the current user
  addInviteLocal: (invite) =>
    set((state) => {
      // ignore if we already have a relationship for this server invite id
      const normalizedInviteTo = invite.toUsername ? invite.toUsername.trim().toLowerCase() : invite.toUsername;
      if (state.relationships.some(r => r.serverInviteId === invite.id)) return { relationships: state.relationships };
      const newRel = { id: `invite-${invite.id}`, partnerName: invite.fromDisplayName || invite.fromUsername || invite.fromName, partnerUsername: invite.fromUsername, petName: invite.petName, petState: 0, status: 'pending', shared: false, serverInviteId: invite.id };
      return { relationships: [...state.relationships, newRel] };
    }),
  // A simple notifier to simulate sending emails/notifications
  notifyPartner: async (email, message) => {
    console.debug('[notifyPartner] sending email:', email, 'message:', message);
    try {
      const res = await fetch('http://localhost:3000/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: email, subject: 'Moodachu Notification', text: message })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'send-email failed');
      console.debug('[notifyPartner] sent', j);
      if (j && j.preview) {
        set({ lastEmailPreview: j.preview });
      }
      return true;
    } catch (err) {
      console.warn('[notifyPartner] failed', err.message);
      // fallback to simulated success so the UX doesn't block
      return false;
    }
  },
  clearLastEmailPreview: () => set({ lastEmailPreview: null }),

  acceptRequest: async (id) => {
    // Set the request active locally
    set((state) => ({
      relationships: state.relationships.map(r => r.id === id ? { ...r, status: 'active', shared: true } : r)
    }));
    // find the relationship and determine if it came from a server invite
    const rel = get().relationships.find(r => r.id === id);
    if (rel && rel.serverInviteId) {
      try {
        const res = await fetch(`http://localhost:3000/invitations/${rel.serverInviteId}/accept`, { method: 'POST' });
          const j = await res.json();
          console.debug('[acceptRequest] server response', { ok: res.ok, body: j });
          if (!res.ok || !j.success) {
            // Show error to user
            set((state) => ({ relationships: state.relationships.map(r => r.id === id ? { ...r, status: 'error', error: j.error || 'accept failed' } : r) }));
            return;
          }
          if (j && j.pairId) {
          // update local id to the pairId returned by server and set status active
          const partnerUsername = (j.pair && j.pair.participants && Array.isArray(j.pair.participants)) ? j.pair.participants.find(p => p !== get().user?.username) : rel.partnerUsername;
          // remove the pending invite locally
          set((state) => ({ relationships: state.relationships.filter(r => r.serverInviteId !== rel.serverInviteId) }));
          // ensure we fetch latest pairs to get consistent data (pairs will be added by fetchPairs)
          await get().fetchPairs();
          // Notify partner that their invite was accepted
          if (rel.partnerEmail) await get().notifyPartner(rel.partnerEmail, `Your connection request for "${rel.petName}" has been accepted.`);
        }
      } catch (err) {
        console.warn('[acceptRequest] server accept failed', err.message);
      }
    } else {
      // fallback notify partner if we have a partner email
      if (rel && rel.partnerEmail) {
        await get().notifyPartner(rel.partnerEmail, `Your connection request for "${rel.petName}" has been accepted.`);
      }
    }
  },

  simulatePartnerInteraction: (id) =>
    set((state) => ({
      relationships: state.relationships.map(r => r.id === id ? { ...r, petState: Math.floor(Math.random() * 5) } : r)
    })),
  
  // Set explicit mood (useful when parsing messages or reacting to events)
  setMood: (id, mood) =>
    set((state) => {
      const updated = state.relationships.map(r => r.id === id ? { ...r, petState: mood } : r);
      // If this relationship is shared, simulate sending the state to partner's email
      const rel = state.relationships.find(r => r.id === id);
      if (rel && rel.shared && rel.partnerEmail) {
        // fire-and-forget notification in background
        get().notifyPartner(rel.partnerEmail, `Pet "${rel.petName}" moved to state ${mood}.` );
      }
      return { relationships: updated };
    }),

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