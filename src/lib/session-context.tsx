'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { SessionUser } from '@/lib/workos-auth';

interface SessionContextValue {
  data: { user: SessionUser } | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  update: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue>({
  data: null,
  status: 'loading',
  update: async () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<{ user: SessionUser } | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();

      if (data.user) {
        setSession({ user: data.user });
        setStatus('authenticated');
      } else {
        setSession(null);
        setStatus('unauthenticated');
      }
    } catch (error) {
      console.error('Failed to fetch session:', error);
      setSession(null);
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const update = useCallback(async () => {
    await fetchSession();
  }, [fetchSession]);

  return (
    <SessionContext.Provider value={{ data: session, status, update }}>
      {children}
    </SessionContext.Provider>
  );
}

// Hook to use session (compatible with NextAuth's useSession)
export function useSession() {
  const context = useContext(SessionContext);
  
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }

  return context;
}

// Convenience function to sign out
export async function signOut(options?: { callbackUrl?: string }) {
  try {
    await fetch('/api/auth/signout', { method: 'POST' });
    window.location.href = options?.callbackUrl || '/login';
  } catch (error) {
    console.error('Sign out error:', error);
    window.location.href = '/login';
  }
}
