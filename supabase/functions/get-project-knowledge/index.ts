
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
      .single();

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

    // Try a direct query for all fields to diagnose if there's an issue with RLS
    console.log(`Testing direct RLS access with Service Role for project_knowledge...`);
    try {
      // Use the authorization headers from the request if available for debugging
      const authHeader = req.headers.get('Authorization');
      console.log(`Authorization header present: ${!!authHeader}`);
      
      // Debug: Log the query we're about to execute
      console.log(`Executing query: SELECT * FROM project_knowledge WHERE project_id = '${projectId}' ORDER BY created_at ASC`);

      // Extra test: Use a raw query to bypass potential RLS issues (for diagnostic purposes)
      const { data: rawData, error: rawError } = await supabaseClient.rpc(
        'get_project_knowledge_direct',
        { p_project_id: projectId }
      );
      
      if (rawError) {
        console.error('RPC Error:', rawError);
      } else {
        console.log(`RPC query returned ${rawData?.length || 0} rows`);
        if (rawData && rawData.length > 0) {
          console.log(`Sample from RPC: ${JSON.stringify(rawData[0])}`);
        }
      }
    } catch (rpcError) {
      console.error('Error testing RPC function:', rpcError);
    }

    // Get project knowledge with direct query to see all returned fields for debugging
    const { data: debugData, error: debugError } = await supabaseClient
      .from('project_knowledge')
      .select('*')
      .eq('project_id', projectId);
      
    // Log raw data for debugging
    console.log(`Debug query returned ${debugData?.length || 0} rows, error: ${debugError ? JSON.stringify(debugError) : 'none'}`);
    if (debugData && debugData.length > 0) {
      console.log(`First row sample:`, JSON.stringify(debugData[0]));
    } else {
      console.log('No debug data found, checking if there are any entries in the project_knowledge table at all');
      
      // Check if there are any entries in the table (diagnostic only)
      const { count, error: countError } = await supabaseClient
        .from('project_knowledge')
        .select('*', { count: 'exact', head: true });
        
      console.log(`Total count in project_knowledge table: ${count}, error: ${countError ? JSON.stringify(countError) : 'none'}`);
    }
    
    // Get project knowledge for actual use (sorted ascending)
    const { data: knowledgeData, error } = await supabaseClient
      .from('project_knowledge')
      .select('id, content, created_at, document_url')
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

    console.log(`Retrieved ${knowledgeData?.length || 0} knowledge entries for project ${projectId}`);

    // Format as { [id]: content }
    const obj: Record<string, string> = {};
    (knowledgeData || []).forEach((item: any) => {
      if (item && item.id && typeof item.content === 'string') {
        obj[item.id] = item.content;
        // Log each entry to help debug
        console.log(`Added knowledge entry: ${item.id}, content length: ${item.content.length}`);
      } else {
        console.log(`Skipped invalid knowledge entry:`, JSON.stringify(item));
      }
    });

    // Check if we have any results
    const resultCount = Object.keys(obj).length;
    console.log(`Returning ${resultCount} knowledge entries as an object`);

    return new Response(
      JSON.stringify({ 
        knowledge: obj,
        meta: {
          count: resultCount,
          projectId: projectId,
          rawCount: knowledgeData?.length || 0
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
