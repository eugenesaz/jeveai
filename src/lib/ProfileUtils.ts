
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/supabase';

/**
 * Creates a user profile safely, handling RLS restrictions
 */
export const createUserProfile = async (
  userId: string,
  email: string | null,
  role: UserRole = 'influencer',
  telegramHandle: string | null = null
): Promise<boolean> => {
  try {
    // First check if profile already exists to avoid duplicates
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking for existing profile:', checkError);
      return false;
    }
    
    // If profile exists, don't try to create it again
    if (existingProfile) {
      console.log('Profile already exists for user', userId);
      return true;
    }

    // Try using direct insert (works if user is authenticated and RLS allows it)
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email || '',
        role: role,
        telegram: telegramHandle,
      });
      
    if (insertError) {
      console.error('Error creating profile through direct insert:', insertError);
      
      // If the insert fails due to RLS, try using server-side solution
      // In a real app, this would be a Supabase Edge Function or trigger
      console.log('Direct insert failed, profile should be created through auth hooks');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in createUserProfile:', error);
    return false;
  }
};

/**
 * Updates a user's role
 */
export const updateUserRole = async (
  userId: string,
  role: UserRole
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);
      
    if (error) {
      console.error('Error updating user role:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateUserRole:', error);
    return false;
  }
};
