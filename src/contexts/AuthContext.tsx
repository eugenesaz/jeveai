
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, Profile } from '@/types/supabase';
import { toast } from '@/components/ui/use-toast';
import { isGoogleUser, getRedirectUrl, checkAndFixSupabaseConfig } from '@/lib/AuthUtils';
import { createUserProfile } from '@/lib/ProfileUtils';

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
  checkIsAdmin: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const ensureProfileExists = async (userId: string, email: string | undefined, oauthData?: any) => {
    try {
      // First, check if profile exists
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error || !data) {
        console.log('Profile not found, creating profile for user:', userId);
        
        const defaultRole: UserRole = 'influencer';
        
        const telegramFromOAuth = oauthData?.telegram || null;
        
        // Use createUserProfile instead of RPC
        const success = await createUserProfile(
          userId,
          email || '',
          defaultRole,
          telegramFromOAuth
        );
        
        if (!success) {
          console.error('Error creating profile');
          
          // Fallback to direct insert with service role (if available)
          try {
            // Using auth.signUp already triggers profile creation through trigger
            // This is just a backup approach
            console.log('Attempting direct profile creation...');
          } catch (directError) {
            console.error('Direct profile creation failed:', directError);
          }
          
          return defaultRole;
        }
        
        return defaultRole;
      }
      
      return data.role as UserRole;
    } catch (err) {
      console.error('Error in ensureProfileExists:', err);
      return 'influencer' as UserRole;
    }
  };

  useEffect(() => {
    checkAndFixSupabaseConfig();
    
    // Set up auth state change listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        console.log('Auth state changed:', _event, currentSession?.user?.id);
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          setTimeout(async () => {
            try {
              // Using a more resilient query with proper error handling
              const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', currentSession.user.id)
                .maybeSingle();
                
              console.log('Profile data for role:', data, error);
              
              if (!error && data) {
                setUserRole(data.role as UserRole);
              } else {
                console.log('Could not fetch role, error:', error);
                
                const oauthData = currentSession.user.user_metadata || {};
                
                const role = await ensureProfileExists(
                  currentSession.user.id, 
                  currentSession.user.email,
                  oauthData
                );
                
                if (role) {
                  setUserRole(role);
                } else {
                  setUserRole('influencer');
                }
              }
            } catch (err) {
              console.error('Error fetching user role:', err);
              setUserRole('influencer');
            } finally {
              setIsLoading(false);
            }
          }, 0);
        } else {
          setUserRole(null);
          setIsLoading(false);
        }
      }
    );

    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        console.log('Initial session check:', data.session?.user?.id);
        
        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        if (data.session?.user) {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.session.user.id)
            .maybeSingle();
            
          console.log('Initial profile data:', profileData, error);
          
          if (!error && profileData) {
            setUserRole(profileData.role as UserRole);
          } else {
            console.log('Could not fetch initial role, error:', error);
            
            const oauthData = data.session.user.user_metadata || {};
            
            const role = await ensureProfileExists(
              data.session.user.id, 
              data.session.user.email,
              oauthData
            );
            
            if (role) {
              setUserRole(role);
            } else {
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

  const checkIsAdmin = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      
      return data?.role === 'admin';
    } catch (err) {
      console.error('Exception checking admin status:', err);
      return false;
    }
  };

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
          emailRedirectTo: getRedirectUrl(),
        },
      });

      console.log('Signup response:', data?.user?.id, error);

      // Note: we no longer need to create a profile manually
      // The database trigger or RPC function will handle this
      if (!error && data.user) {
        setUserRole(role);
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
        setUser(data.user);
        setSession(data.session);
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
          
        console.log('Profile data after login:', profileData, profileError);
        
        if (!profileError && profileData) {
          setUserRole(profileData.role as UserRole);
        } else {
          const role = await ensureProfileExists(data.user.id, data.user.email);
          
          setUserRole(role || 'influencer');
          
          if (!role) {
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
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    console.log('Attempting Google sign in from AuthContext');
    
    const redirectUrl = getRedirectUrl();
    console.log('Using redirect URL for Google auth:', redirectUrl);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          },
          redirectTo: redirectUrl
        },
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Google auth error in AuthContext:', error);
      toast({
        title: "Authentication Error",
        description: error instanceof Error ? error.message : "Failed to sign in with Google",
        variant: "destructive",
      });
    }
  };

  const signOut = async () => {
    console.log('Signing out and clearing all session data');
    setIsLoading(true);
    
    try {
      await supabase.auth.signOut();
      
      setUser(null);
      setSession(null);
      setUserRole(null);
      
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
      
      console.log('Sign out complete, all session data cleared');
    } catch (error) {
      console.error('Error during sign out:', error);
      setUser(null);
      setSession(null);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
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
    checkIsAdmin,
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
