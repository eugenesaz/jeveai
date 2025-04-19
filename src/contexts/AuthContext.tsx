
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, Profile } from '@/types/supabase';
import { toast } from '@/components/ui/use-toast';

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

  // Helper function to create profile if not exists
  const ensureProfileExists = async (userId: string, email: string | undefined) => {
    try {
      // First check if profile exists
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error || !data) {
        console.log('Profile not found, creating profile for user:', userId);
        
        // Default to 'influencer' role if not specified
        const defaultRole: UserRole = 'influencer';
        
        // Create profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: email || '',
            role: defaultRole,
          });
        
        if (insertError) {
          console.error('Error creating profile:', insertError);
          return null;
        }
        
        // Return the created role
        return defaultRole;
      }
      
      return data.role as UserRole;
    } catch (err) {
      console.error('Error in ensureProfileExists:', err);
      return null;
    }
  };

  useEffect(() => {
    // Set up the session listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        console.log('Auth state changed:', _event, currentSession?.user?.id);
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          // Use setTimeout to prevent potential deadlocks with Supabase auth
          setTimeout(async () => {
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
                
                // Try to create profile if it doesn't exist
                const role = await ensureProfileExists(
                  currentSession.user.id, 
                  currentSession.user.email
                );
                
                if (role) {
                  setUserRole(role);
                } else {
                  // Default to influencer if all else fails
                  setUserRole('influencer');
                }
              }
            } catch (err) {
              console.error('Error fetching user role:', err);
              // Default to influencer if all else fails
              setUserRole('influencer');
            }
          }, 0);
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
            
            // Try to create profile if it doesn't exist
            const role = await ensureProfileExists(
              data.session.user.id, 
              data.session.user.email
            );
            
            if (role) {
              setUserRole(role);
            } else {
              // Default to influencer if all else fails
              setUserRole('influencer');
            }
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
      
      if (!error && data.user) {
        // Manually set user and session without waiting for onAuthStateChange
        setUser(data.user);
        setSession(data.session);
        
        // Fetch user's role after successful sign in
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
          
        console.log('Profile data after login:', profileData, profileError);
        
        if (!profileError && profileData) {
          setUserRole(profileData.role as UserRole);
        } else {
          // Try to create profile if it doesn't exist
          const role = await ensureProfileExists(data.user.id, data.user.email);
          if (role) {
            setUserRole(role);
          } else {
            // Default to influencer if all else fails
            setUserRole('influencer');
            toast({
              title: "Note",
              description: "Using default role as influencer",
              variant: "default",
            });
          }
        }
      }
      
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
    setUser(null);
    setSession(null);
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
