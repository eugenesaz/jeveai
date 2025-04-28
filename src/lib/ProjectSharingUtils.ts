import { supabase } from '@/integrations/supabase/client';
import { ProjectRole, ProjectShare } from '@/types/supabase';

/**
 * Share a project with a user by email
 */
export const shareProject = async (
  projectId: string,
  email: string, 
  role: ProjectRole
): Promise<{ success: boolean; message: string; shareId?: string }> => {
  try {
    // Check if project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', projectId)
      .single();
    
    if (projectError) {
      console.error('Error fetching project:', projectError);
      return { success: false, message: 'Failed to find project' };
    }
    
    // Check if user exists
    const { data: userProfiles, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .limit(1);
    
    if (userError) {
      console.error('Error finding user:', userError);
      return { success: false, message: 'Error checking user' };
    }
    
    let userId = userProfiles && userProfiles.length > 0 ? userProfiles[0].id : null;
    
    // If no user found, we'll use a placeholder ID and invite them by email
    if (!userId) {
      userId = '00000000-0000-0000-0000-000000000000'; // Placeholder for pending invites
    }
    
    // Check if already shared with this user
    const { data: existingShares, error: shareError } = await supabase
      .from('project_shares')
      .select('*')
      .eq('project_id', projectId)
      .eq('invited_email', email.toLowerCase());
    
    if (shareError) {
      console.error('Error checking existing shares:', shareError);
      return { success: false, message: 'Failed to check existing shares' };
    }
    
    // Update instead if already shared
    if (existingShares && existingShares.length > 0) {
      const { error: updateError } = await supabase
        .from('project_shares')
        .update({
          role,
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingShares[0].id);
      
      if (updateError) {
        console.error('Error updating share:', updateError);
        return { success: false, message: 'Failed to update share' };
      }
      
      return { 
        success: true, 
        message: 'Share updated successfully', 
        shareId: existingShares[0].id 
      };
    }
    
    // Create new share
    const { data: newShare, error: insertError } = await supabase
      .from('project_shares')
      .insert({
        project_id: projectId,
        user_id: userId,
        role,
        invited_email: email.toLowerCase(),
        status: 'pending'
      })
      .select('id')
      .single();
    
    if (insertError) {
      console.error('Error creating share:', insertError);
      return { success: false, message: 'Failed to create share' };
    }
    
    return {
      success: true,
      message: 'Project shared successfully',
      shareId: newShare.id
    };
    
  } catch (error) {
    console.error('Error sharing project:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
};

/**
 * Accept a project share invitation
 */
export const acceptProjectInvitation = async (
  shareId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const { error } = await supabase
      .from('project_shares')
      .update({
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', shareId);
    
    if (error) {
      console.error('Error accepting invitation:', error);
      return { success: false, message: 'Failed to accept invitation' };
    }
    
    return { success: true, message: 'Invitation accepted successfully' };
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
};

/**
 * Get a user's role for a given project
 */
export const getUserProjectRole = async (
  userId: string,
  projectId: string
): Promise<ProjectRole | null> => {
  try {
    // First check if user is the owner
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .single();
    
    if (projectError) {
      console.error('Error checking project ownership:', projectError);
      return null;
    }
    
    // If user is the owner, they have full permissions
    if (project && project.user_id === userId) {
      return 'owner';
    }
    
    // Check if user has a shared role
    const { data: share, error: shareError } = await supabase
      .from('project_shares')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .eq('status', 'accepted')
      .single();
    
    if (shareError && shareError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking project role:', shareError);
      return null;
    }
    
    return share ? share.role as ProjectRole : null;
  } catch (error) {
    console.error('Error getting user project role:', error);
    return null;
  }
};

/**
 * Check if a user can perform a specific action based on their role
 */
export const canUserPerformAction = async (
  userId: string,
  projectId: string,
  requiredRoles: ProjectRole[]
): Promise<boolean> => {
  const userRole = await getUserProjectRole(userId, projectId);
  
  if (!userRole) return false;
  
  // Owner can do everything
  if (userRole === 'owner') return true;
  
  // Otherwise, check if the user's role is in the list of required roles
  return requiredRoles.includes(userRole);
};
