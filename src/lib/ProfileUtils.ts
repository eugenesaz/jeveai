
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
    if (!userId) {
      console.error('Cannot create profile without userId');
      return false;
    }

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

    // Try using direct insert with explicit values
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email || '',
        role: role,
        telegram: telegramHandle ? telegramHandle.trim() : null, // Ensure telegram handle is trimmed
        created_at: new Date().toISOString()
      });
      
    if (insertError) {
      console.error('Error creating profile through direct insert:', insertError);
      
      // If explicit insert fails, try again with different approach
      try {
        console.log('Attempting alternative profile creation approach');
        
        // Use upsert which may have different RLS behavior
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email: email || '',
            role: role,
            telegram: telegramHandle ? telegramHandle.trim() : null // Ensure telegram handle is trimmed
          }, { onConflict: 'id' });
          
        if (upsertError) {
          console.error('Upsert approach also failed:', upsertError);
          return false;
        }
        
        return true;
      } catch (fallbackError) {
        console.error('All profile creation attempts failed:', fallbackError);
        return false;
      }
    }
    
    console.log('Profile created successfully for user:', userId);
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
