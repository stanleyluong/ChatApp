import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { useEffect } from 'react';
import { auth } from '../firebase';

// Only show One Tap if user is not signed in
export function GoogleOneTap({ isSignedIn }: { isSignedIn: boolean }) {
  useEffect(() => {
    if (isSignedIn) return;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('Google Client ID is not set in .env');
      return;
    }
    if (!window.google || !window.google.accounts || !window.google.accounts.id) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response: any) => {
        const credential = GoogleAuthProvider.credential(response.credential);
        try {
          await signInWithCredential(auth, credential);
        } catch (err) {
          console.error('Firebase sign-in error:', err);
        }
      },
      auto_select: false,
      cancel_on_tap_outside: false,
    });

    window.google.accounts.id.prompt();
  }, [isSignedIn]);

  return null;
} 