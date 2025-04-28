
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
    const { data: shareData, error: shareError } = await supabase
      .from('project_shares')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .eq('status', 'accepted') // Only check accepted shares
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

// Function to get all pending invitations for a user by email
export async function getPendingInvitations(userEmail: string) {
  if (!userEmail) return [];

  try {
    console.log("Fetching pending invitations for email:", userEmail);
    const { data, error } = await supabase
      .from('project_shares')
      .select(`
        id,
        role,
        status,
        invited_email,
        project:project_id (
          id,
          name,
          url_name,
          status,
          landing_image,
          user_id,
          created_at,
          color_scheme,
          telegram_bot
        ),
        inviter_id
      `)
      .eq('invited_email', userEmail.toLowerCase())
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching pending invitations:', error);
      return [];
    }

    console.log("Fetched pending invitations:", data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Error in getPendingInvitations:', error);
    return [];
  }
}

// Function to accept a pending invitation
export async function acceptInvitation(invitationId: string, userId: string) {
  if (!invitationId || !userId) return { success: false, error: 'Missing required parameters' };

  try {
    const { error } = await supabase
      .from('project_shares')
      .update({ 
        status: 'accepted',
        user_id: userId, // Ensure the correct user ID is set
        updated_at: new Date().toISOString()
      })
      .eq('id', invitationId);

    if (error) {
      console.error('Error accepting invitation:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in acceptInvitation:', error);
    return { success: false, error: error.message };
  }
}

// Function to decline a pending invitation
export async function declineInvitation(invitationId: string) {
  if (!invitationId) return { success: false, error: 'Missing invitation ID' };

  try {
    const { error } = await supabase
      .from('project_shares')
      .update({ 
        status: 'declined',
        updated_at: new Date().toISOString()
      })
      .eq('id', invitationId);

    if (error) {
      console.error('Error declining invitation:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in declineInvitation:', error);
    return { success: false, error: error.message };
  }
}
