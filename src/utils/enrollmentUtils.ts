
import { supabase } from "@/integrations/supabase/client";

/**
 * Gets an enrollment by user and course id without referencing begin_date
 */
export async function getEnrollmentByUserAndCourse(userId: string, courseId: string) {
  if (!userId || !courseId) return null;
  
  const { data, error } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();
    
  if (error || !data) return null;
  return data;
}

/**
 * Gets all enrollments for a user without referencing begin_date
 */
export async function getUserEnrollments(userId: string) {
  if (!userId) return [];
  
  const { data, error } = await supabase
    .from('enrollments')
    .select('id, course_id')
    .eq('user_id', userId);
    
  if (error || !data) return [];
  return data;
}
