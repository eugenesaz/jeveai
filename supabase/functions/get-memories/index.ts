
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
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Get userId from URL parameters
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId parameter is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Get all memories for the user
    const { data: memories, error } = await supabaseClient
      .from('memories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching memories:', error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch memories" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    return new Response(
      JSON.stringify({ memories: memories || [] }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
