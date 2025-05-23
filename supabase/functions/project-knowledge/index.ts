
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    
    console.log(`Initializing Supabase client with URL: ${supabaseUrl.substring(0, 10)}... and key length: ${supabaseKey.length}`);
    
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

      console.log(`Fetching knowledge for project ID: ${projectId}`);

      // Debug: Check if project exists first
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

      console.log(`Project with ID ${projectId} found (${projectData.name}), proceeding to fetch knowledge`);

      // Use explicit table alias to avoid ambiguous column references
      const { data: knowledgeData, error } = await supabaseClient
        .from('project_knowledge_vector')
        .select('id, content, metadata, created_at')
        .filter('metadata->>projectId', 'eq', projectId)
        .order('created_at', { ascending: false });

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

      console.log(`Retrieved ${knowledgeData?.length || 0} knowledge entries for project ${projectId}`);
      
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
      const { projectId, content, documentUrl } = await req.json();
      
      console.log(`Creating knowledge for project ID: ${projectId}, has content: ${!!content}, has documentUrl: ${!!documentUrl}`);
      
      if (!projectId || (!content && !documentUrl)) {
        return new Response(
          JSON.stringify({ error: "projectId and either content or documentUrl are required" }),
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
        .maybeSingle();

      if (projectError || !projectData) {
        console.error('Error verifying project exists:', projectError);
        return new Response(
          JSON.stringify({ error: "Project not found", details: projectError }),
          { 
            status: 404, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      // Create knowledge entry with proper metadata
      const knowledgeEntry = {
        content: content || '',
        metadata: { 
          projectId: projectId, 
          source: documentUrl ? 'document' : 'manual'
        }
      };
      
      if (documentUrl) {
        knowledgeEntry.metadata.documentUrl = documentUrl;
      }
      
      console.log('Creating knowledge entry with data:', JSON.stringify(knowledgeEntry));
      
      const { data: newKnowledge, error } = await supabaseClient
        .from('project_knowledge_vector')
        .insert(knowledgeEntry)
        .select()
        .single();

      if (error) {
        console.error('Error creating project knowledge:', error);
        return new Response(
          JSON.stringify({ error: "Failed to create project knowledge", details: error }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      console.log('Successfully created knowledge entry:', newKnowledge?.id);

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
      JSON.stringify({ 
        error: "Internal Server Error", 
        details: err.message,
        stack: err.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
