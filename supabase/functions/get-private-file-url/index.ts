
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
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with user's JWT for authorization checks
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // For admin operations (retrieving user info from token, generating signed URLs)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the user from their JWT token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error("Authentication error:", userError);
      return new Response(
        JSON.stringify({ error: "Authentication failed", details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the request body
    const { filePath } = await req.json();
    if (!filePath) {
      return new Response(
        JSON.stringify({ error: "Missing filePath parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract courseId from filePath (expected format: projectId/courseId/userId/filename)
    const pathParts = filePath.split('/');
    if (pathParts.length < 4) {
      return new Response(
        JSON.stringify({ error: "Invalid file path format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const projectId = pathParts[0];
    const courseId = pathParts[1];
    
    // Authorization check: Verify user has access to the course
    // Check if the user is enrolled in this course
    // Or if the user owns the project containing the course
    // Or if the user has been granted access via project_shares table

    // First check if user is enrolled
    const { data: enrollmentData, error: enrollmentError } = await supabaseClient
      .from("enrollments")
      .select("id")
      .eq("course_id", courseId)
      .eq("user_id", user.id)
      .limit(1);
      
    // If not enrolled, check if user owns the project or has been granted access
    let hasAccess = enrollmentData && enrollmentData.length > 0;
    
    if (!hasAccess) {
      // Check if user owns the project
      const { data: projectData, error: projectError } = await supabaseClient
        .from("projects")
        .select("id")
        .eq("id", projectId)
        .eq("user_id", user.id)
        .limit(1);
        
      hasAccess = projectData && projectData.length > 0;
      
      // If not the project owner, check project_shares
      if (!hasAccess) {
        const { data: sharesData, error: sharesError } = await supabaseClient
          .from("project_shares")
          .select("id")
          .eq("project_id", projectId)
          .eq("user_id", user.id)
          .eq("status", "accepted")
          .limit(1);
          
        hasAccess = sharesData && sharesData.length > 0;
      }
    }
    
    if (!hasAccess) {
      console.error("Access denied to course:", courseId);
      return new Response(
        JSON.stringify({ error: "Access denied", details: "You do not have permission to access this file" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a signed URL with short expiration (15 minutes)
    const expiresIn = 60 * 15; // 15 minutes in seconds
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin
      .storage
      .from("telegram_chat_files_private")
      .createSignedUrl(filePath, expiresIn);

    if (signedUrlError) {
      console.error("Error creating signed URL:", signedUrlError);
      return new Response(
        JSON.stringify({ error: "Failed to create signed URL", details: signedUrlError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return the signed URL
    return new Response(
      JSON.stringify({ signedUrl: signedUrlData.signedUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
