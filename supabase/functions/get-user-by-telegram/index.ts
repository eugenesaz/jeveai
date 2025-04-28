
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

    // Get telegram name from URL parameters
    const url = new URL(req.url);
    const telegramName = url.searchParams.get('telegram');

    if (!telegramName) {
      return new Response(
        JSON.stringify({ error: "telegram parameter is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`Looking up user ID for telegram name: ${telegramName}`);

    // Use SQL to make the comparison case-insensitive with LOWER() function
    // This will convert both the stored telegram name and input to lowercase before comparing
    const { data: userId, error } = await supabaseClient.rpc(
      'get_user_id_by_telegram_case_insensitive',
      { telegram_name: telegramName.trim() }
    );

    if (error) {
      console.error('Error fetching user ID:', error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to fetch user ID", 
          details: error,
          note: "Make sure you've created the required RPC function" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ 
          error: "User not found",
          domain: "jeveai.lovable.app" 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Sanitize the userId to ensure it's a clean UUID without tabs or spaces
    const sanitizedUserId = userId.toString().trim().replace(/[^\w-]/g, '');

    return new Response(
      JSON.stringify({ 
        userId: sanitizedUserId,
        domain: "jeveai.lovable.app"
      }),
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
