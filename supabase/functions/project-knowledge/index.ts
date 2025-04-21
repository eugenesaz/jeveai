
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
        .single();

      if (projectError || !projectData) {
        console.error('Error checking if project exists:', projectError);
        return new Response(
          JSON.stringify({ error: "Project not found or error verifying project", details: projectError }),
          { 
            status: projectError ? 500 : 404, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      console.log(`Project with ID ${projectId} found (${projectData.name}), proceeding to fetch knowledge`);

      // Try to get project knowledge with the RPC function first
      try {
        const { data: rpcData, error: rpcError } = await supabaseClient.rpc(
          'get_project_knowledge_direct',
          { p_project_id: projectId }
        );
        
        if (rpcError) {
          console.error('RPC Error:', rpcError);
        } else {
          console.log(`RPC query returned ${rpcData?.length || 0} rows`);
        }
      } catch (rpcError) {
        console.error('Error testing RPC function:', rpcError);
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
          JSON.stringify({ error: "Failed to fetch project knowledge", details: error }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      console.log(`Retrieved ${knowledgeData?.length || 0} knowledge entries for project ${projectId}`);
      if (knowledgeData && knowledgeData.length > 0) {
        console.log(`Sample first entry: ${JSON.stringify(knowledgeData[0])}`);
      } else {
        // Check if there are any entries in the table (diagnostic only)
        const { count, error: countError } = await supabaseClient
          .from('project_knowledge')
          .select('*', { count: 'exact', head: true });
          
        console.log(`Total count in project_knowledge table: ${count}, error: ${countError ? JSON.stringify(countError) : 'none'}`);
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
        .single();

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

      // Create knowledge entry
      const knowledgeEntry = {
        project_id: projectId,
        content: content || '',
      };
      
      if (documentUrl) {
        knowledgeEntry.document_url = documentUrl;
      }
      
      console.log('Creating knowledge entry with data:', JSON.stringify(knowledgeEntry));
      
      const { data: newKnowledge, error } = await supabaseClient
        .from('project_knowledge')
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
