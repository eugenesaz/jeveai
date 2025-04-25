
-- Create a function to handle enrollment creation with conflict handling
CREATE OR REPLACE FUNCTION create_enrollment(
  p_user_id UUID, 
  p_course_id UUID, 
  p_is_paid BOOLEAN, 
  p_begin_date TIMESTAMP WITH TIME ZONE, 
  p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_enrollment_id UUID;
BEGIN
  -- Insert the new enrollment
  INSERT INTO enrollments (user_id, course_id, is_paid, begin_date, end_date)
  VALUES (p_user_id, p_course_id, p_is_paid, p_begin_date, p_end_date)
  RETURNING id INTO v_enrollment_id;
  
  RETURN v_enrollment_id;
EXCEPTION
  WHEN unique_violation THEN
    -- Handle any unique constraint violation
    RAISE NOTICE 'Enrollment already exists for this user and course';
    RETURN NULL;
END;
$$;
