
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

    // Check if project exists first
    const { data: projectData, error: projectError } = await supabaseClient
      .from('projects')
      .select('id')
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

    // Get project knowledge sorted ascending
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
        console.log(`Skipped invalid knowledge entry:`, item);
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
