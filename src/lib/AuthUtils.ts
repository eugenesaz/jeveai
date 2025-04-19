
import { supabase } from '@/integrations/supabase/client';

export const adminLogin = async (username: string, password: string) => {
  if (username !== 'Wizard' || password !== 'Wizardry@579') {
    return { error: { message: 'Invalid credentials' } };
  }

  // Use a special admin account
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@paradise.com',
    password: 'Paradise@Admin123',
  });

  if (error) return { error };

  // Set the role to admin
  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      email: data.user.email,
      role: 'admin',
    });
  }

  return { data, error: null };
};
