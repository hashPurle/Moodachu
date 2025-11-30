import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { auth } from './utils/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { useAppStore } from './store/useAppStore'

function Root() {
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      console.debug('[auth] onAuthStateChanged called', fbUser?.email, fbUser?.displayName);
      if (fbUser) {
        // set a trimmed user object in the store to avoid serialization/mutable object issues
        const fallbackName = fbUser.displayName || fbUser.email?.split('@')[0];
        const trimmed = { uid: fbUser.uid, displayName: fallbackName, email: fbUser.email?.trim().toLowerCase(), photoURL: fbUser.photoURL };
        console.debug('[auth] setting store user', trimmed);
        useAppStore.setState({ user: trimmed });
        // fetch or register server username mapping
        (async () => {
          try {
            const res = await fetch(`http://localhost:3000/users/${trimmed.uid}`);
            if (res.ok) {
              const json = await res.json();
              if (json && json.user && json.user.username) {
                useAppStore.setState({ user: { ...trimmed, username: json.user.username } });
              }
            } else {
              // register user on server to create username mapping
              const reg = await fetch('http://localhost:3000/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: trimmed.uid, displayName: trimmed.displayName, email: trimmed.email })
              });
              if (reg.ok) {
                const j = await reg.json();
                if (j && j.user && j.user.username) {
                  useAppStore.setState({ user: { ...trimmed, username: j.user.username } });
                }
              }
            }
          } catch (err) {
            console.warn('[main] fetch/register user failed', err.message);
          }
        })();
      } else {
        console.debug('[auth] clearing store user');
        useAppStore.setState({ user: null });
      }
    });
    return () => unsub();
  }, []);
  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
)
