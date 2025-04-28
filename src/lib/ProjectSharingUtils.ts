
import { supabase } from '@/integrations/supabase/client';
import { ProjectRole } from '@/types/supabase';

// Function to check if a user can perform an action on a project based on their role
export async function canUserPerformAction(
  userId: string,
  projectId: string,
  allowedRoles: ProjectRole[]
): Promise<boolean> {
  try {
    if (!userId || !projectId) {
      console.log('Missing userId or projectId');
      return false;
    }

    // Check if user is the project owner
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('Error checking project ownership:', projectError);
      return false;
    }

    // Project owners can do anything
    if (projectData && projectData.user_id === userId) {
      console.log('User is project owner, granting access');
      return true;
    }

    // Check if user has any of the allowed roles
    console.log(`Checking if project ${projectId} is shared with user ${userId}`);
    
    // Direct query for project shares
    const { data: shareData, error: shareError } = await supabase
      .from('project_shares')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .eq('status', 'accepted')
      .maybeSingle();

    if (shareError) {
      console.error('Error checking share permissions:', shareError);
      return false;
    }

    if (shareData && allowedRoles.includes(shareData.role as ProjectRole)) {
      console.log(`User has role ${shareData.role}, which is included in allowed roles:`, allowedRoles);
      return true;
    }
    
    console.log(`User role ${shareData?.role} not in allowed roles or no share found`);
    return false;
  } catch (error) {
    console.error('Error checking user project permissions:', error);
    return false;
  }
}
