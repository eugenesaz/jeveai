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

    // Use the database function to check project access with roles
    const { data, error } = await supabase.rpc(
      'check_project_access',
      {
        p_user_id: userId,
        p_project_id: projectId,
        p_roles: allowedRoles.map(role => role.toString())
      }
    );

    if (error) {
      console.error('Error checking project permissions:', error);
      return false;
    }

    return data || false;
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
    
    // Fetch inviter emails for each invitation
    const invitationsWithEmails = await Promise.all((data || []).map(async (invitation) => {
      let inviterEmail = null;
      
      if (invitation.inviter_id) {
        const { data: inviterData, error: inviterError } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', invitation.inviter_id)
          .maybeSingle();
        
        if (!inviterError && inviterData) {
          inviterEmail = inviterData.email;
        }
      }
      
      return {
        ...invitation,
        inviterEmail
      };
    }));
    
    return invitationsWithEmails;
  } catch (error) {
    console.error('Error in getPendingInvitations:', error);
    return [];
  }
}

// Function to accept a pending invitation
export async function acceptInvitation(invitationId: string, userId: string) {
  if (!invitationId || !userId) return { success: false, error: 'Missing required parameters' };

  try {
    console.log(`Accepting invitation ${invitationId} for user ${userId}`);
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
    console.log(`Declining invitation ${invitationId}`);
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

// Function to get project details by ID
export async function getProjectById(projectId: string) {
  if (!projectId) return null;
  
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching project:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getProjectById:', error);
    return null;
  }
}

// Process invitation by ID - used when handling invitation links
export async function processInvitationById(inviteId: string, userId: string) {
  if (!inviteId || !userId) {
    return { success: false, error: 'Missing invitation ID or user ID' };
  }
  
  try {
    // First get the invitation to verify it exists and is still pending
    const { data: invitation, error: fetchError } = await supabase
      .from('project_shares')
      .select('*')
      .eq('id', inviteId)
      .eq('status', 'pending')
      .maybeSingle();
    
    if (fetchError || !invitation) {
      const errorMsg = fetchError ? fetchError.message : 'Invitation not found or already processed';
      console.error('Error fetching invitation:', errorMsg);
      return { success: false, error: errorMsg };
    }
    
    // Accept the invitation
    const { error: updateError } = await supabase
      .from('project_shares')
      .update({ 
        status: 'accepted', 
        user_id: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', inviteId);
    
    if (updateError) {
      console.error('Error accepting invitation:', updateError);
      return { success: false, error: updateError.message };
    }
    
    return { 
      success: true, 
      projectId: invitation.project_id,
      role: invitation.role
    };
  } catch (error: any) {
    console.error('Error in processInvitationById:', error);
    return { success: false, error: error.message };
  }
}
