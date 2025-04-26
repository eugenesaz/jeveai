
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
  
  const urlParams = new URLSearchParams(window.location.search);
  const errorParam = urlParams.get('error');
  const errorDescription = urlParams.get('error_description');
  
  if (errorParam || errorDescription) {
    console.error('Auth error detected:', errorParam, errorDescription);
    return { 
      hasError: true, 
      errorMessage: errorDescription || errorParam || 'Authentication error' 
    };
  }
  
  return { hasError: false, errorMessage: null };
};

// Helper function to clear URL parameters after checking for errors
export const clearAuthUrlParams = () => {
  if (typeof window === 'undefined') return;
  
  const url = new URL(window.location.href);
  if (url.search) {
    window.history.replaceState({}, document.title, url.pathname);
  }
};
