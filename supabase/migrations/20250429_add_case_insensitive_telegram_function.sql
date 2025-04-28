
-- Create a function to get user ID by telegram name case-insensitively
CREATE OR REPLACE FUNCTION public.get_user_id_by_telegram_case_insensitive(telegram_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_id uuid;
BEGIN
    -- Find the user ID where telegram matches the input in a case-insensitive way
    SELECT p.id INTO user_id
    FROM profiles p
    WHERE LOWER(p.telegram) = LOWER(telegram_name);
    
    RETURN user_id;
END;
$$;

-- Grant execute permission to all users (including anon)
GRANT EXECUTE ON FUNCTION public.get_user_id_by_telegram_case_insensitive(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_telegram_case_insensitive(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_telegram_case_insensitive(text) TO service_role;
