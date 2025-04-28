
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

    if (projectError) {
      console.error('Error checking project ownership:', projectError);
      throw projectError;
    }

    // Project owners can do anything
    if (projectData && projectData.user_id === userId) {
      console.log('User is project owner, granting access');
      return true;
    }

    // Check if user has any of the allowed roles using RPC function to avoid recursion
    console.log(`Checking if project ${projectId} is shared with user ${userId}`);
    const { data: isShared, error: sharedError } = await supabase
      .rpc('check_project_shared_with_user', { 
        project_id: projectId, 
        user_id: userId
      });
    
    if (sharedError) {
      console.error('Error checking project shared status:', sharedError);
      throw sharedError;
    }
    
    if (isShared) {
      console.log('Project is shared with user, checking role permissions');
      // If shared, check the specific role
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
          console.log('No matching share found despite check_project_shared_with_user returning true');
          return false;
        }
        console.error('Error checking share permissions:', shareError);
        throw shareError;
      }

      if (shareData && allowedRoles.includes(shareData.role as ProjectRole)) {
        console.log(`User has role ${shareData.role}, which is included in allowed roles:`, allowedRoles);
        return true;
      }
      
      console.log(`User role ${shareData?.role} not in allowed roles:`, allowedRoles);
    } else {
      console.log('Project is not shared with user');
    }

    return false;
  } catch (error) {
    console.error('Error checking user project permissions:', error);
    return false;
  }
}
