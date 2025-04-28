
import { supabase } from '@/integrations/supabase/client';
import { ProjectRole } from '@/types/supabase';

// Function to check if a user can perform an action on a project based on their role
export async function canUserPerformAction(
  userId: string,
  projectId: string,
  allowedRoles: ProjectRole[]
): Promise<boolean> {
  try {
    // Check if user is the project owner
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .single();

    if (projectError) throw projectError;

    // Project owners can do anything
    if (projectData && projectData.user_id === userId) {
      return true;
    }

    // Check if user has any of the allowed roles
    const { data: shareData, error: shareError } = await supabase
      .from('project_shares')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .eq('status', 'accepted')
      .single();

    if (shareError) {
      if (shareError.code === 'PGRST116') {
        // No matching row found, user doesn't have access
        return false;
      }
      throw shareError;
    }

    if (shareData && allowedRoles.includes(shareData.role as ProjectRole)) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking user project permissions:', error);
    return false;
  }
}
