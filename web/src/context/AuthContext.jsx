import React, { createContext, useEffect, useMemo, useState } from 'react';
import { getMyProfile, getSession, onAuthStateChange, signOut } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const activeSession = await getSession();
        if (!mounted) return;
        setSession(activeSession);
        if (activeSession?.user) {
          const myProfile = await getMyProfile();
          if (!mounted) return;
          setProfile(myProfile);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const { data } = onAuthStateChange(async (newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        const myProfile = await getMyProfile().catch(() => null);
        setProfile(myProfile);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isAuthenticated: Boolean(session?.user),
      isOrganizer: profile?.role === 'organizer',
      isVolunteer: !profile?.role || profile?.role === 'volunteer',
      loading,
      refreshProfile: async () => {
        const myProfile = await getMyProfile();
        setProfile(myProfile);
        return myProfile;
      },
      logout: signOut,
    }),
    [loading, profile, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
