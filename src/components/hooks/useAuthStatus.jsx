import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useAuthStatus() {
  const [authState, setAuthState] = useState('checking');
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (mounted) {
          setUser(currentUser);
          setAuthState('signed_in');
        }
      } catch (error) {
        if (mounted) {
          setUser(null);
          setAuthState('signed_out');
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const refreshAuth = async () => {
    setAuthState('checking');
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setAuthState('signed_in');
    } catch (error) {
      setUser(null);
      setAuthState('signed_out');
    }
  };

  const signIn = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  return { authState, user, refreshAuth, signIn };
}