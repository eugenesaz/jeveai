import { supabase } from '@/integrations/supabase/client';
import { ProjectRole } from '@/types/supabase';

/**
 * Check if a user has specific permissions on a project
 * @param projectId The project ID to check permissions for
 * @param requiredRoles Array of roles that have permission
 * @returns Promise<boolean> True if user has permission, false otherwise
 */
export async function checkProjectPermission(
  projectId: string, 
  requiredRoles: ProjectRole[]
): Promise<boolean> {
  try {
    // First check if user owns the project (direct query is faster)
    const { data: ownedProject, error: ownedError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .maybeSingle();
      
    if (ownedProject) {
      return true;
    }

    // If not owner, check using the DB function we created
    // Explicitly include the "accepted" status check in the function call
    const { data, error } = await supabase.rpc(
      'check_project_access',
      { 
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_project_id: projectId,
        p_roles: requiredRoles.map(role => role.toString())
      }
    );
    
    if (error) {
      console.error('Error checking project permissions:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Exception checking project permissions:', error);
    return false;
  }
}

/**
 * Check if user can edit courses for a project
 */
export async function canEditCourses(projectId: string): Promise<boolean> {
  return checkProjectPermission(projectId, ['owner', 'contributor']);
}

/**
 * Check if user can view courses for a project
 */
export async function canViewCourses(projectId: string): Promise<boolean> {
  return checkProjectPermission(projectId, ['owner', 'contributor', 'read_only', 'knowledge_manager']);
}

/**
 * Check if user can access conversations for a course
 * First determines the project ID from the course, then checks permissions
 * Also verifies the user has an active subscription to the course
 */
export async function canAccessConversations(courseId: string): Promise<boolean> {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return false;
    
    // Get the project ID from the course
    const { data: course, error } = await supabase
      .from('courses')
      .select('project_id')
      .eq('id', courseId)
      .single();
    
    if (error || !course) {
      console.error('Error fetching course:', error);
      return false;
    }
    
    // Check if the user has project permissions
    const hasProjectPermission = await checkProjectPermission(
      course.project_id, 
      ['owner', 'contributor', 'read_only', 'knowledge_manager']
    );
    
    // If they have project permissions, they can view conversations
    if (hasProjectPermission) return true;
    
    // Otherwise, check if they have an active subscription to this course
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        id,
        subscriptions(
          id,
          begin_date,
          end_date,
          is_paid
        )
      `)
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single();
      
    if (enrollmentError || !enrollment) return false;
    
    // Check if any subscription is active
    const now = new Date();
    const hasActiveSubscription = enrollment.subscriptions?.some(sub => {
      return sub.is_paid && (!sub.end_date || new Date(sub.end_date) > now);
    });
    
    return !!hasActiveSubscription;
  } catch (error) {
    console.error('Exception checking conversation access:', error);
    return false;
  }
}
