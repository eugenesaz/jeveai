
-- This function bypasses RLS and gets project knowledge directly
CREATE OR REPLACE FUNCTION public.get_project_knowledge_direct(p_project_id UUID)
RETURNS SETOF project_knowledge
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM public.project_knowledge 
    WHERE project_id = p_project_id
    ORDER BY created_at ASC;
$$;

-- Grant execution permissions on the function
GRANT EXECUTE ON FUNCTION public.get_project_knowledge_direct TO anon, authenticated, service_role;
