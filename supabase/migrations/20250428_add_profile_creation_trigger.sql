
-- Create a function to automatically create a profile when a new user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    new.id,
    LOWER(new.email),
    'influencer'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$;

-- Create a trigger to call the function when a user is created
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
CREATE TRIGGER create_profile_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Create needed RLS policies for project_shares
DROP POLICY IF EXISTS "Users can see invitations addressed to their email" ON public.project_shares;
CREATE POLICY "Users can see invitations addressed to their email" 
ON public.project_shares
FOR SELECT 
USING (
  lower(auth.email()) = lower(invited_email) OR 
  auth.uid() = user_id OR 
  auth.uid() IN (
    SELECT user_id 
    FROM public.projects 
    WHERE id = project_shares.project_id
  )
);

-- Add explicit RLS to allow invitees to update their own shares
CREATE POLICY "Invitees can update their shares" 
ON public.project_shares
FOR UPDATE
USING (
  lower(auth.email()) = lower(invited_email) OR 
  auth.uid() = user_id
);
