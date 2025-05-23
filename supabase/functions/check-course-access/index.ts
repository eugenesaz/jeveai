
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ 
          status: "Error", 
          error: "Server configuration error",
          subscription_begin: null,
          subscription_end: null,
          course_info_link: null
        }),
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
        JSON.stringify({ 
          status: "Not enrolled", 
          error: "Both telegramUsername and courseId are required",
          subscription_begin: null,
          subscription_end: null,
          course_info_link: courseId ? `https://jeveai.lovable.app/course/${courseId}` : null
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean telegram handle by removing any @ symbol
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

    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id')
      .ilike('telegram', cleanTelegramUsername)
      .maybeSingle();

    if (profileError || !profileData) {
      console.log('Profile not found or error:', profileError);
      return new Response(
        JSON.stringify({ 
          status: "Not enrolled", 
          error: "User not found",
          subscription_begin: null,
          subscription_end: null,
          course_info_link: `https://jeveai.lovable.app/course/${courseId}`
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: enrollmentData, error: enrollmentError } = await supabaseClient
      .from('enrollments')
      .select('id, courses(name, description)')
      .eq('user_id', profileData.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (enrollmentError || !enrollmentData) {
      console.log('No enrollment found or error:', enrollmentError);
      return new Response(
        JSON.stringify({ 
          status: "Not enrolled",
          subscription_begin: null,
          subscription_end: null,
          course_info_link: `https://jeveai.lovable.app/course/${courseId}`
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
        JSON.stringify({ 
          status: "Not enrolled", 
          error: "Error checking subscription",
          subscription_begin: null,
          subscription_end: null,
          course_info_link: `https://jeveai.lovable.app/course/${courseId}`
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptionData) {
      console.log('No subscription found');
      return new Response(
        JSON.stringify({ 
          status: "Not enrolled", 
          error: "No active subscription",
          subscription_begin: null,
          subscription_end: null,
          course_info_link: `https://jeveai.lovable.app/course/${courseId}`,
          course_name: enrollmentData.courses?.name,
          course_description: enrollmentData.courses?.description
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date();
    const isActive = subscriptionData.is_paid && (!subscriptionData.end_date || new Date(subscriptionData.end_date) > now);

    if (!isActive) {
      return new Response(
        JSON.stringify({
          status: "Expired",
          subscription_begin: subscriptionData.begin_date,
          subscription_end: subscriptionData.end_date,
          course_info_link: `https://jeveai.lovable.app/course/${courseId}`,
          course_name: enrollmentData.courses?.name,
          course_description: enrollmentData.courses?.description
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        status: "Active",
        subscription_begin: subscriptionData.begin_date,
        subscription_end: subscriptionData.end_date,
        course_info_link: `https://jeveai.lovable.app/course/${courseId}`,
        course_name: enrollmentData.courses?.name,
        course_description: enrollmentData.courses?.description
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error('Error processing request:', err);
    return new Response(
      JSON.stringify({ 
        status: "Error", 
        error: "Internal Server Error",
        subscription_begin: null,
        subscription_end: null,
        course_info_link: courseId ? `https://jeveai.lovable.app/course/${courseId}` : null
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
