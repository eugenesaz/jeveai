
-- Drop the existing unique constraint if it exists
ALTER TABLE IF EXISTS enrollments
  DROP CONSTRAINT IF EXISTS enrollments_user_id_course_id_key;

-- Add a new constraint that allows multiple enrollments for the same course and user
-- but ensures that other columns make the row unique
ALTER TABLE enrollments
  ADD CONSTRAINT enrollments_user_course_begin_date_key
  UNIQUE (user_id, course_id, begin_date);
