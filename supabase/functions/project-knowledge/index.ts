
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Handle GET request (read knowledge)
    if (req.method === "GET") {
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

      // Get project knowledge
      const { data: knowledgeData, error } = await supabaseClient
        .from('project_knowledge')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching project knowledge:', error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch project knowledge" }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      return new Response(
        JSON.stringify({ knowledge: knowledgeData || [] }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Handle POST request (create knowledge)
    if (req.method === "POST") {
      const { projectId, content } = await req.json();
      
      if (!projectId || !content) {
        return new Response(
          JSON.stringify({ error: "projectId and content are required" }),
          { 
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      // Verify project exists
      const { data: projectData, error: projectError } = await supabaseClient
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .single();

      if (projectError || !projectData) {
        return new Response(
          JSON.stringify({ error: "Project not found" }),
          { 
            status: 404, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      // Create knowledge entry
      const { data: newKnowledge, error } = await supabaseClient
        .from('project_knowledge')
        .insert({
          project_id: projectId,
          content: content,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating project knowledge:', error);
        return new Response(
          JSON.stringify({ error: "Failed to create project knowledge" }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          message: "Knowledge created successfully", 
          knowledge: newKnowledge 
        }),
        { 
          status: 201, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // If not GET or POST
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { 
        status: 405, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (err) {
    console.error('Error processing request:', err);
    
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
