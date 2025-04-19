
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'influencer' | 'customer' | 'admin';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  userRole: UserRole | null;
  isLoading: boolean;
  signUp: (email: string, password: string, role: UserRole) => Promise<{ error: any | null }>;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setRole: (role: UserRole) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up the session listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        if (session?.user) {
          // Fetch user's role from metadata or database
          supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()
            .then(({ data, error }) => {
              if (!error && data) {
                setUserRole(data.role as UserRole);
              }
            });
        }
      }
    );

    // Initial session check
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      
      if (data.session?.user) {
        // Fetch user's role
        supabase
          .from('profiles')
          .select('role')
          .eq('id', data.session.user.id)
          .single()
          .then(({ data, error }) => {
            if (!error && data) {
              setUserRole(data.role as UserRole);
            }
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, role: UserRole) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
          },
        },
      });

      if (!error && data.user) {
        // Create profile in the database
        await supabase.from('profiles').insert({
          id: data.user.id,
          email: email,
          role: role,
        });

        setUserRole(role);
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
  };

  const setRole = (role: UserRole) => {
    setUserRole(role);
  };

  const value = {
    session,
    user,
    userRole,
    isLoading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    setRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
