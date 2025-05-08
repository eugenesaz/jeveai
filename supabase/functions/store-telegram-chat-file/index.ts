
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

    // Get the request body
    const { userId, courseId, fileName, base64FileContent } = await req.json();

    // Input validation
    if (!userId || !courseId || !fileName || !base64FileContent) {
      return new Response(
        JSON.stringify({
          error: "Missing required parameters",
          details: "userId, courseId, fileName, and base64FileContent are required"
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Retrieve projectId from the courses table using courseId
    const { data: courseData, error: courseError } = await supabaseAdmin
      .from("courses")
      .select("project_id")
      .eq("id", courseId)
      .single();

    if (courseError || !courseData) {
      console.error("Error getting project_id:", courseError);
      return new Response(
        JSON.stringify({ error: "Failed to retrieve project information", details: courseError?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const projectId = courseData.project_id;

    // Generate a unique filename to prevent collisions
    const fileExtension = fileName.includes(".") 
      ? fileName.substring(fileName.lastIndexOf(".")) 
      : "";
    const timestamp = new Date().getTime();
    const uniqueFileName = `${fileName.replace(/\.[^/.]+$/, "")}_${timestamp}${fileExtension}`;
    
    // Define the storage path
    const storagePath = `${projectId}/${courseId}/${userId}/${uniqueFileName}`;

    // Decode base64 content
    const binaryContent = Uint8Array.from(atob(base64FileContent.replace(/^data:.*?;base64,/, "")), c => c.charCodeAt(0));

    // Upload file to Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from("telegram_chat_files_private")
      .upload(storagePath, binaryContent, {
        contentType: "application/octet-stream", // Default content type
        upsert: false
      });

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload file", details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return the storage path
    return new Response(
      JSON.stringify({ storagePath: storagePath }),
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
