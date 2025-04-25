
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
    let telegramUsername, courseId;

    // Parse request body - handle both form data and JSON
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      // Handle JSON body
      const body = await req.json();
      telegramUsername = body.telegramUsername;
      courseId = body.courseId;
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      // Handle form data
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
      console.log('Missing parameters:', { telegramUsername, courseId });
      return new Response(
        JSON.stringify({ 
          error: "Both telegramUsername and courseId are required" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Clean up telegramUsername by removing @ if present and trim spaces
    const cleanTelegramUsername = telegramUsername.replace('@', '').trim().toLowerCase();
    
    console.log('Processing request for:', { 
      cleanTelegramUsername, 
      originalUsername: telegramUsername,
      courseId 
    });

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 1. First attempt - direct query with case insensitive search
    let { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, telegram')
      .ilike('telegram', cleanTelegramUsername)
      .single();

    // Debug log
    console.log('First query attempt:', { 
      query: `ILIKE '${cleanTelegramUsername}'`,
      result: profileData, 
      error: profileError 
    });

    // 2. If first attempt fails, try with exact match after removing any special characters
    if (profileError || !profileData) {
      const { data: secondAttemptData, error: secondAttemptError } = await supabaseClient
        .from('profiles')
        .select('id, telegram')
        .eq('telegram', cleanTelegramUsername)
        .single();
        
      console.log('Second query attempt (exact match):', { 
        query: `= '${cleanTelegramUsername}'`, 
        result: secondAttemptData, 
        error: secondAttemptError 
      });
        
      if (!secondAttemptError && secondAttemptData) {
        profileData = secondAttemptData;
        profileError = null;
      }
    }

    // 3. If still no match, try with a broader search
    if (profileError || !profileData) {
      // Get all profiles and find a match manually (last resort)
      const { data: allProfiles, error: allProfilesError } = await supabaseClient
        .from('profiles')
        .select('id, telegram')
        .not('telegram', 'is', null);
        
      if (!allProfilesError && allProfiles && allProfiles.length > 0) {
        console.log('Getting all profiles to search manually:', { 
          profileCount: allProfiles.length,
          allTelegrams: allProfiles.map(p => p.telegram)
        });
        
        // Find a profile with a similar telegram username
        const matchingProfile = allProfiles.find(profile => {
          if (!profile.telegram) return false;
          const normalizedProfileTelegram = profile.telegram.toLowerCase().replace('@', '').trim();
          const normalizedRequestTelegram = cleanTelegramUsername.toLowerCase();
          
          return normalizedProfileTelegram === normalizedRequestTelegram;
        });
        
        if (matchingProfile) {
          console.log('Found matching profile through manual search:', matchingProfile);
          profileData = matchingProfile;
          profileError = null;
        }
      }
    }

    if (profileError || !profileData) {
      console.log('Profile not found after all attempts. Search details:', { 
        cleanTelegramUsername,
        error: profileError
      });
      return new Response(
        JSON.stringify({ status: "Not enrolled", error: "User not found" }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log('Profile found:', profileData);

    // 2. Get course with the provided courseId
    const { data: courseData, error: courseError } = await supabaseClient
      .from('courses')
      .select('id, duration, recurring')
      .eq('id', courseId)
      .single();

    if (courseError || !courseData) {
      console.log('Course not found:', courseId);
      return new Response(
        JSON.stringify({ status: "Not enrolled", error: "Course not found" }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // 3. Check if user is enrolled in the course
    const { data: enrollmentData, error: enrollmentError } = await supabaseClient
      .from('enrollments')
      .select('begin_date, end_date, is_paid')
      .eq('user_id', profileData.id)
      .eq('course_id', courseData.id)
      .order('begin_date', { ascending: false })
      .limit(1)
      .single();

    if (enrollmentError || !enrollmentData) {
      console.log('Enrollment not found for user in course');
      return new Response(
        JSON.stringify({ status: "Not enrolled" }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // 4. Check if the enrollment has expired
    const now = new Date();
    let expired = false;
    
    if (enrollmentData.end_date) {
      const endDate = new Date(enrollmentData.end_date);
      if (now > endDate) {
        expired = true;
      }
    }

    // 5. Check if payment is complete
    if (!enrollmentData.is_paid) {
      return new Response(
        JSON.stringify({ status: "Not paid" }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    if (expired) {
      return new Response(
        JSON.stringify({ 
          status: "Expired",
          subscription_begin: enrollmentData.begin_date,
          subscription_end: enrollmentData.end_date
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        status: "Active",
        subscription_begin: enrollmentData.begin_date,
        subscription_end: enrollmentData.end_date
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (err) {
    console.error('Error processing request:', err);
    
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
