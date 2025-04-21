
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

    // First try: Direct SQL query to bypass RLS entirely
    try {
      console.log(`Executing direct SQL query for project knowledge...`);
      const { data, error } = await supabaseClient.from('project_knowledge')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Direct SQL query error:', error);
      } else {
        console.log(`Direct SQL query returned ${data?.length || 0} rows`);
        if (data && data.length > 0) {
          console.log(`First row sample: ${JSON.stringify(data[0])}`);
        }
      }
    } catch (directError) {
      console.error('Exception during direct SQL query:', directError);
    }

    // Second try: Manual SQL query approach
    try {
      console.log(`Trying raw SQL query approach...`);
      const { data, error } = await supabaseClient.rpc(
        'get_project_knowledge_direct',
        { p_project_id: projectId }
      );
      
      if (error) {
        console.error('RPC Error details:', JSON.stringify(error));
        
        // If the function doesn't exist, try a direct SELECT
        console.log('Fallback to direct parameterized query...');
        const { data: fallbackData, error: fallbackError } = await supabaseClient
          .from('project_knowledge')
          .select('id, content, created_at, document_url')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true });
          
        if (fallbackError) {
          console.error('Fallback query error:', fallbackError);
        } else {
          console.log(`Fallback query returned ${fallbackData?.length || 0} rows`);
          
          // Format as { [id]: content }
          const obj: Record<string, string> = {};
          (fallbackData || []).forEach((item: any) => {
            if (item && item.id && typeof item.content === 'string') {
              obj[item.id] = item.content;
              console.log(`Added knowledge entry: ${item.id}, content length: ${item.content.length}`);
            } else {
              console.log(`Skipped invalid knowledge entry:`, JSON.stringify(item));
            }
          });
          
          const resultCount = Object.keys(obj).length;
          console.log(`Returning ${resultCount} knowledge entries as an object from fallback query`);
          
          return new Response(
            JSON.stringify({ 
              knowledge: obj,
              meta: {
                count: resultCount,
                projectId: projectId,
                rawCount: fallbackData?.length || 0,
                method: "fallback_direct_query"
              }
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            }
          );
        }
      } else {
        console.log(`RPC query returned ${data?.length || 0} rows`);
        
        // Format as { [id]: content }
        const obj: Record<string, string> = {};
        (data || []).forEach((item: any) => {
          if (item && item.id && typeof item.content === 'string') {
            obj[item.id] = item.content;
            console.log(`Added knowledge entry from RPC: ${item.id}, content length: ${item.content.length}`);
          } else {
            console.log(`Skipped invalid knowledge entry from RPC:`, JSON.stringify(item));
          }
        });
        
        const resultCount = Object.keys(obj).length;
        console.log(`Returning ${resultCount} knowledge entries as an object from RPC`);
        
        return new Response(
          JSON.stringify({ 
            knowledge: obj,
            meta: {
              count: resultCount,
              projectId: projectId,
              rawCount: data?.length || 0,
              method: "rpc_function"
            }
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
    } catch (rpcError) {
      console.error('Exception during RPC function call:', rpcError);
    }
    
    // Final fallback: Get project knowledge with direct query
    console.log(`Using final fallback method...`);
    const { data: knowledgeData, error } = await supabaseClient
      .from('project_knowledge')
      .select('id, content, created_at, document_url')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error in final fallback query:', error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch project knowledge", details: error }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`Final fallback query retrieved ${knowledgeData?.length || 0} knowledge entries`);

    // Format as { [id]: content }
    const obj: Record<string, string> = {};
    (knowledgeData || []).forEach((item: any) => {
      if (item && item.id && typeof item.content === 'string') {
        obj[item.id] = item.content;
        console.log(`Added knowledge entry: ${item.id}, content length: ${item.content.length}`);
      } else {
        console.log(`Skipped invalid knowledge entry:`, JSON.stringify(item));
      }
    });

    // Check if we have any results
    const resultCount = Object.keys(obj).length;
    console.log(`Returning ${resultCount} knowledge entries from final fallback`);

    return new Response(
      JSON.stringify({ 
        knowledge: obj,
        meta: {
          count: resultCount,
          projectId: projectId,
          rawCount: knowledgeData?.length || 0,
          method: "final_fallback"
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
