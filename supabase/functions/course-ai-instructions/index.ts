
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Allow both GET and POST requests
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed", allowed: ["GET", "POST"] }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    let courseId;

    if (req.method === "GET") {
      const url = new URL(req.url);
      courseId = url.searchParams.get("courseId");
    } else if (req.method === "POST") {
      // Extract courseId from POST request body
      try {
        const body = await req.json();
        courseId = body.courseId;
      } catch (err) {
        console.error("Error parsing request body:", err);
        return new Response(
          JSON.stringify({ error: "Invalid JSON body" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (!courseId) {
      return new Response(
        JSON.stringify({ error: "courseId parameter is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        }
      }
    );

    // Fetch AI instructions for course
    const { data, error } = await supabaseClient
      .from("courses")
      .select("ai_instructions, name")
      .eq("id", courseId)
      .single();

    if (error || !data) {
      console.error("Error fetching ai_instructions:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch AI instructions" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        course_name: data.name,
        ai_instructions: data.ai_instructions ?? "No AI instructions found for this course."
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error processing request:", err);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
