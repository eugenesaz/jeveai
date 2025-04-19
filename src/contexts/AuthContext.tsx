
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, Profile } from '@/types/supabase';

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
      async (event, currentSession) => {
        console.log('Auth state changed:', event, currentSession?.user?.id);
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          try {
            // Fetch user's role from metadata or database
            const { data, error } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', currentSession.user.id)
              .single();
              
            console.log('Profile data for role:', data, error);
            
            if (!error && data) {
              setUserRole(data.role as UserRole);
            } else {
              console.log('Could not fetch role, error:', error);
            }
          } catch (err) {
            console.error('Error fetching user role:', err);
          }
        } else {
          setUserRole(null);
        }
        
        setIsLoading(false);
      }
    );

    // Initial session check
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        console.log('Initial session check:', data.session?.user?.id);
        
        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        if (data.session?.user) {
          // Fetch user's role
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.session.user.id)
            .single();
            
          console.log('Initial profile data:', profileData, error);
          
          if (!error && profileData) {
            setUserRole(profileData.role as UserRole);
          } else {
            console.log('Could not fetch initial role, error:', error);
          }
        }
      } catch (err) {
        console.error('Error during initial auth check:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, role: UserRole) => {
    try {
      console.log('Signing up with:', email, 'as', role);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
          },
        },
      });

      console.log('Signup response:', data?.user?.id, error);

      if (!error && data.user) {
        // Create profile in the database
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          email: email,
          role: role,
        });
        
        console.log('Profile creation result:', profileError ? `Error: ${profileError.message}` : 'Success');

        if (!profileError) {
          setUserRole(role);
        }
      }

      return { error };
    } catch (error) {
      console.error('Signup error:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Signing in with:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('Signin response:', data?.user?.id, error);
      
      return { error };
    } catch (error) {
      console.error('Signin error:', error);
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    console.log('Attempting Google sign in');
    await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
  };

  const signOut = async () => {
    console.log('Signing out');
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
