
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  // Only allow GET requests
  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { 
        status: 405, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    console.log(`Initializing Supabase client with URL: ${supabaseUrl.substring(0, 10)}... and key length: ${supabaseKey.length}`);
    console.log(`Using SERVICE_ROLE_KEY instead of ANON_KEY to bypass RLS`);
    
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get project ID from the URL
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');
    
    if (!projectId) {
      return new Response(
        JSON.stringify({ error: "projectId parameter is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`Fetching knowledge for project ID: ${projectId}`);

    // Debug: Check if project exists first and log project data
    const { data: projectData, error: projectError } = await supabaseClient
      .from('projects')
      .select('id, name')
      .eq('id', projectId)
      .maybeSingle();

    if (projectError) {
      console.error('Error checking if project exists:', projectError);
      return new Response(
        JSON.stringify({ error: "Failed to verify project", details: projectError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    if (!projectData) {
      console.log(`Project with ID ${projectId} not found`);
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`Found project: ${projectData.name} (${projectData.id})`);

    // Get all knowledge entries for the project
    console.log(`Fetching knowledge entries for project ID: ${projectId}`);

    const { data: knowledgeData, error } = await supabaseClient
      .from('project_knowledge')
      .select('content')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching project knowledge:', error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch project knowledge", details: error }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`Returned ${knowledgeData?.length || 0} knowledge entries for project`);

    // Concatenate all content into a single string
    const combinedContent = knowledgeData 
      ? knowledgeData.map(entry => entry.content).join('\n\n')
      : '';

    return new Response(
      JSON.stringify({
        knowledge: combinedContent,
        meta: {
          projectId: projectId
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
