
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
