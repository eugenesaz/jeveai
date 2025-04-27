
import { supabase } from '@/integrations/supabase/client';

export const adminLogin = async (username: string, password: string) => {
  if (username !== 'Wizard' || password !== 'Wizardry@579') {
    return { error: { message: 'Invalid credentials' } };
  }

  console.log('Admin login attempt with correct credentials');

  // Use a special admin account
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@paradise.com',
    password: 'Paradise@Admin123',
  });

  console.log('Admin login response:', data?.user?.id, error);

  if (error) return { error };

  // Set the role to admin
  if (data.user) {
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      email: data.user.email,
      role: 'admin',
    });
    
    console.log('Admin profile update result:', profileError ? `Error: ${profileError.message}` : 'Success');
  }

  return { data, error: null };
};

export const isGoogleUser = (user: any): boolean => {
  return user?.app_metadata?.provider === 'google';
};

// Helper function to check if there are authentication errors in the URL
export const checkAuthUrlErrors = (): { hasError: boolean, errorMessage: string | null } => {
  if (typeof window === 'undefined') return { hasError: false, errorMessage: null };
  
  // Check query parameters for errors
  const urlParams = new URLSearchParams(window.location.search);
  const errorParam = urlParams.get('error');
  const errorDescription = urlParams.get('error_description');
  
  // Check hash fragment for errors (some OAuth providers use hash)
  const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
  const errorHash = hashParams.get('error');
  const errorDescriptionHash = hashParams.get('error_description');
  
  const finalError = errorParam || errorHash;
  const finalErrorDescription = errorDescription || errorDescriptionHash;
  
  if (finalError || finalErrorDescription) {
    console.error('Auth error detected:', finalError, finalErrorDescription);
    return { 
      hasError: true, 
      errorMessage: finalErrorDescription || finalError || 'Authentication error' 
    };
  }
  
  return { hasError: false, errorMessage: null };
};

// Helper function to clear URL parameters after checking for errors
export const clearAuthUrlParams = () => {
  if (typeof window === 'undefined') return;
  
  // Clear query parameters and hash
  const url = new URL(window.location.href);
  if (url.search || url.hash) {
    window.history.replaceState({}, document.title, url.pathname);
  }
};

// Handle authentication responses with tokens in the URL hash
export const handleAuthResponse = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  const hash = window.location.hash;
  if (hash && (hash.includes('access_token') || hash.includes('error'))) {
    console.log('Detected auth response in URL hash, processing...');
    try {
      // Extract the session from the URL
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error processing auth response:', error);
        return false;
      }
      
      if (data?.session) {
        console.log('Successfully processed auth response, session established');
        // Clear the URL after it's processed
        setTimeout(() => {
          clearAuthUrlParams();
        }, 100);
        return true;
      }
    } catch (error) {
      console.error('Error handling auth response:', error);
    }
  }
  return false;
};

// Get the proper redirect URL based on environment
export const getRedirectUrl = (): string => {
  if (typeof window === 'undefined') return '';
  
  // Always use the current origin to ensure proper redirect back
  const currentOrigin = window.location.origin;
  console.log('Current origin for redirect:', currentOrigin);
  
  return currentOrigin;
};

// Fix Supabase auth URLs in config if needed
export const checkAndFixSupabaseConfig = async (): Promise<void> => {
  try {
    console.log('Checking if redirect URL configuration is correct');
    
    // For debug purposes only
    const currentUrl = typeof window !== 'undefined' ? window.location.href : 'no-window';
    console.log('Current URL:', currentUrl);
    console.log('Current origin:', typeof window !== 'undefined' ? window.location.origin : 'no-window');
  } catch (error) {
    console.error('Error checking Supabase config:', error);
  }
};
