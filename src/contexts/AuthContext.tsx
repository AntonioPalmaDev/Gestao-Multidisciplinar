import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, Profile } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, nome: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  isAdmin: boolean;
  isPsicologo: boolean;
  isAssistenteSocial: boolean;
  isPedagogo: boolean;
  isGestor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  const loadUserData = async (userId: string) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const [{ data: profileData }, { data: roleData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle(),
      ]);
      if (profileData) setProfile(profileData as Profile);
      if (roleData) setRole(roleData.role as AppRole);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Initial load
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadUserData(session.user.id);
      }
      if (mounted) setLoading(false);
    };

    init();

    // Listen for auth changes (login/logout) after init
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to avoid Supabase SDK deadlock
          setTimeout(() => {
            if (mounted) {
              setLoading(true);
              loadUserData(session.user.id).then(() => {
                if (mounted) setLoading(false);
              });
            }
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshUserData = async () => {
    if (user) {
      fetchingRef.current = false; // allow re-fetch
      await loadUserData(user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, nome: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { nome },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRole(null);
  };


  const value: AuthContextType = {
    user,
    session,
    profile,
    role,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUserData,
    isAdmin: role === 'admin',
    isPsicologo: role === 'psicologo',
    isAssistenteSocial: role === 'assistente_social',
    isPedagogo: role === 'pedagogo',
    isGestor: role === 'gestor',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
