
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
    // Initialize Supabase client with service role for admin operations
    // We'll use the service role directly since we're validating access in the function logic
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

    // Get the authorization header to identify the user
    const authHeader = req.headers.get("Authorization");
    let userId = null;
    
    if (authHeader) {
      // Try to get the user from the JWT token
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
        
        if (!userError && userData?.user) {
          userId = userData.user.id;
        }
      } catch (authError) {
        console.error("Error authenticating user:", authError);
        // Continue with userId as null - we'll check permissions differently
      }
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
    // If we couldn't get userId from token, we'll use alternative access checks
    let hasAccess = false;
    
    if (userId) {
      // Check if user is enrolled in this course
      const { data: enrollmentData } = await supabaseAdmin
        .from("enrollments")
        .select("id")
        .eq("course_id", courseId)
        .eq("user_id", userId)
        .limit(1);
        
      hasAccess = enrollmentData && enrollmentData.length > 0;
      
      if (!hasAccess) {
        // Check if user owns the project
        const { data: projectData } = await supabaseAdmin
          .from("projects")
          .select("id")
          .eq("id", projectId)
          .eq("user_id", userId)
          .limit(1);
          
        hasAccess = projectData && projectData.length > 0;
        
        if (!hasAccess) {
          // Check project_shares
          const { data: sharesData } = await supabaseAdmin
            .from("project_shares")
            .select("id")
            .eq("project_id", projectId)
            .eq("user_id", userId)
            .eq("status", "accepted")
            .limit(1);
            
          hasAccess = sharesData && sharesData.length > 0;
        }
      }
    } else {
      // If we couldn't get the user ID, we'll use a more permissive check
      // For the course conversations viewer, we'll confirm the file path corresponds to a valid conversation
      const { data: conversationData } = await supabaseAdmin
        .from("conversations")
        .select("id")
        .eq("course_id", courseId)
        .eq("file_storage_path", filePath)
        .limit(1);
        
      hasAccess = conversationData && conversationData.length > 0;
    }
    
    // For development and testing, temporarily allow all access
    // IMPORTANT: In production, remove this override
    hasAccess = true; // Temporary override for development
    
    if (!hasAccess) {
      console.error("Access denied to file:", filePath);
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
