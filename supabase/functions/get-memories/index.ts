
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log("Creating Supabase client with service role key");
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    // Get userId from URL parameters
    const url = new URL(req.url);
    const rawUserId = url.searchParams.get('userId');

    if (!rawUserId) {
      return new Response(
        JSON.stringify({ error: "userId parameter is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Sanitize the userId by removing any whitespace or non-alphanumeric characters
    // except for hyphens which are valid in UUIDs
    const userId = rawUserId.trim().replace(/[^\w-]/g, '');
    
    console.log(`Fetching memories for user: ${userId}`);

    // Get all memories for the user and order by created_at descending (newest first)
    const { data: memories, error } = await supabaseClient
      .from('memories')
      .select('memory, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching memories:', error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch memories", details: error }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`Retrieved ${memories?.length || 0} memories`);

    // Format the response to be n8n-friendly with just memory and created_at
    const formattedMemories = memories?.map(memory => ({
      memory: memory.memory,
      created_at: memory.created_at
    })) || [];

    // Return just the array of memories for easier n8n processing
    return new Response(
      JSON.stringify(formattedMemories),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
