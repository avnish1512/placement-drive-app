/**
 * register.tsx — DISABLED
 *
 * Student self-registration is no longer supported.
 * All student accounts are pre-created by the admin in Firebase.
 * Students log in via unified-login.tsx using credentials from LOGIN_CREDENTIALS.md.
 *
 * If a student logs in for the FIRST TIME without a completed profile,
 * they are redirected to /profile-setup (Step 2 fields only).
 *
 * This file is kept to satisfy the Expo Router file-based routing
 * (it's declared in _layout.tsx). It immediately redirects to login.
 */
import { useEffect } from 'react';
import { router } from 'expo-router';

export default function RegisterScreen() {
  useEffect(() => {
    // No self-registration — redirect to login immediately
    router.replace('/unified-login' as any);
  }, []);

  return null;
}
