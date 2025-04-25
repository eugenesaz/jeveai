
import { supabase } from "@/integrations/supabase/client";

/**
 * Gets an enrollment by user and course id
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
 * Gets all enrollments for a user
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

/**
 * Creates a new enrollment if it doesn't exist yet, or returns the existing one
 */
export async function getOrCreateEnrollment(userId: string, courseId: string) {
  if (!userId || !courseId) return null;
  
  // First check for existing enrollment
  const existingEnrollment = await getEnrollmentByUserAndCourse(userId, courseId);
  if (existingEnrollment) return existingEnrollment;
  
  // Create a new enrollment with only the required fields
  const { data, error } = await supabase
    .from('enrollments')
    .insert({
      user_id: userId,
      course_id: courseId
    })
    .select('id')
    .single();
    
  if (error) {
    console.error('Error creating enrollment:', error);
    return null;
  }
  
  return data;
}
