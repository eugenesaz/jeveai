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
    // Get the Supabase credentials from environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ status: "Error", error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Parse request data - handle both JSON and form data
    let telegramUsername, courseId;
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      const body = await req.json();
      telegramUsername = body.telegramUsername;
      courseId = body.courseId;
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      telegramUsername = formData.get("telegramUsername")?.toString();
      courseId = formData.get("courseId")?.toString();
    } else {
      // Try to get from URL parameters
      const url = new URL(req.url);
      telegramUsername = url.searchParams.get("telegramUsername");
      courseId = url.searchParams.get("courseId");
    }
    
    // Validate required parameters
    if (!telegramUsername || !courseId) {
      return new Response(
        JSON.stringify({ status: "Not enrolled", error: "Both telegramUsername and courseId are required" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean up telegramUsername by removing @ if present and trim spaces
    const cleanTelegramUsername = telegramUsername.replace('@', '').trim().toLowerCase();
    
    console.log('Processing request:', { telegramUsername: cleanTelegramUsername, courseId });

    // Initialize Supabase client with service role key to bypass RLS
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Find the user profile by Telegram username
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id')
      .ilike('telegram', cleanTelegramUsername)
      .maybeSingle();

    if (profileError) {
      console.log('Profile query error:', profileError);
      return new Response(
        JSON.stringify({ status: "Not enrolled", error: "Error finding user" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profileData) {
      console.log('Profile not found:', { username: cleanTelegramUsername });
      return new Response(
        JSON.stringify({ status: "Not enrolled", error: "User not found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('Profile found:', profileData);
    
    // Check if course exists
    const { data: courseData, error: courseError } = await supabaseClient
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .maybeSingle();

    if (courseError || !courseData) {
      console.log('Course not found or error:', courseId, courseError);
      return new Response(
        JSON.stringify({ status: "Not enrolled", error: "Course not found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current date for comparisons
    const now = new Date();
    
    // Find the most recent active enrollment for this user and course
    const { data: enrollmentData, error: enrollmentError } = await supabaseClient
      .from('enrollments')
      .select('id, begin_date, end_date, is_paid')
      .eq('user_id', profileData.id)
      .eq('course_id', courseData.id)
      .eq('is_paid', true)
      .order('begin_date', { ascending: false });

    if (enrollmentError) {
      console.log('Enrollment query error:', enrollmentError);
      return new Response(
        JSON.stringify({ status: "Not enrolled", error: "Error checking enrollment" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!enrollmentData || enrollmentData.length === 0) {
      console.log('No enrollment found');
      return new Response(
        JSON.stringify({ status: "Not enrolled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Find active enrollment (either no end_date or end_date in the future)
    const activeEnrollment = enrollmentData.find(enrollment => {
      // If no end date, it's an unlimited subscription
      if (!enrollment.end_date) return true;
      
      // Otherwise check if the end date is in the future
      return new Date(enrollment.end_date) > now;
    });
    
    // If no active enrollment found, the subscription has expired
    if (!activeEnrollment) {
      const mostRecent = enrollmentData[0]; // Already sorted by begin_date desc
      return new Response(
        JSON.stringify({ 
          status: "Expired",
          subscription_begin: mostRecent.begin_date,
          subscription_end: mostRecent.end_date
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Active subscription found
    return new Response(
      JSON.stringify({ 
        status: "Active",
        subscription_begin: activeEnrollment.begin_date,
        subscription_end: activeEnrollment.end_date
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error('Error processing request:', err);
    return new Response(
      JSON.stringify({ status: "Error", error: "Internal Server Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
