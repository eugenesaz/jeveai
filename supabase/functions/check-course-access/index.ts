
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ status: "Error", error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
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
      const url = new URL(req.url);
      telegramUsername = url.searchParams.get("telegramUsername");
      courseId = url.searchParams.get("courseId");
    }
    
    if (!telegramUsername || !courseId) {
      return new Response(
        JSON.stringify({ status: "Not enrolled", error: "Both telegramUsername and courseId are required" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanTelegramUsername = telegramUsername.replace('@', '').trim().toLowerCase();
    
    console.log('Processing request:', { telegramUsername: cleanTelegramUsername, courseId });

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

    if (profileError || !profileData) {
      console.log('Profile not found or error:', profileError);
      return new Response(
        JSON.stringify({ status: "Not enrolled", error: "User not found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // First, get the enrollment id WITHOUT ordering by begin_date
    const { data: enrollmentData, error: enrollmentError } = await supabaseClient
      .from('enrollments')
      .select('id')
      .eq('user_id', profileData.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (enrollmentError || !enrollmentData) {
      console.log('No enrollment found or error:', enrollmentError);
      return new Response(
        JSON.stringify({ status: "Not enrolled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Then use enrollment id to get subscription details
    const { data: subscriptionData, error: subscriptionError } = await supabaseClient
      .from('subscriptions')
      .select('begin_date, end_date, is_paid')
      .eq('enrollment_id', enrollmentData.id)
      .order('begin_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscriptionError) {
      console.log('Error checking subscription:', subscriptionError);
      return new Response(
        JSON.stringify({ status: "Not enrolled", error: "Error checking subscription" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptionData) {
      console.log('No subscription found');
      return new Response(
        JSON.stringify({ status: "Not enrolled", error: "No active subscription" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if the subscription is active
    const now = new Date();
    const isActive = subscriptionData.is_paid && (!subscriptionData.end_date || new Date(subscriptionData.end_date) > now);

    if (!isActive) {
      return new Response(
        JSON.stringify({
          status: "Expired",
          subscription_begin: subscriptionData.begin_date,
          subscription_end: subscriptionData.end_date
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        status: "Active",
        subscription_begin: subscriptionData.begin_date,
        subscription_end: subscriptionData.end_date
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
