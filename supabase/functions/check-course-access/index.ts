
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

    // Initialize Supabase client with service role key to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return new Response(
        JSON.stringify({ status: "Error", error: "Server configuration error" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
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

    // DIAGNOSTICS: Fetch all profiles to inspect in logs
    const { data: allProfilesForDiagnostic, error: allProfilesError } = await supabaseClient
      .from('profiles')
      .select('id, telegram')
      .not('telegram', 'is', null);
    
    console.log('DIAGNOSTIC - All profiles with telegram username:', {
      totalProfiles: allProfilesForDiagnostic?.length || 0,
      profiles: allProfilesForDiagnostic,
      error: allProfilesError
    });

    if (allProfilesForDiagnostic) {
      // Log detailed formatting of each telegram value for comparison
      const formattedTelegrams = allProfilesForDiagnostic.map(p => ({
        id: p.id,
        originalTelegram: p.telegram,
        cleanedTelegram: p.telegram?.toLowerCase().replace('@', '').trim(),
        bytesLength: p.telegram ? [...p.telegram].length : 0,
        charCodes: p.telegram ? [...p.telegram].map(c => c.charCodeAt(0)) : []
      }));
      
      console.log('DIAGNOSTIC - Telegram username formats:', formattedTelegrams);
      
      // Add specific check for the telegram username we're looking for
      console.log('DIAGNOSTIC - Direct string comparison results:', formattedTelegrams.map(p => ({
        id: p.id,
        telegram: p.originalTelegram,
        cleanedTelegram: p.cleanedTelegram,
        matchesCleanTelegram: p.cleanedTelegram === cleanTelegramUsername,
        stringEquality: p.cleanedTelegram == cleanTelegramUsername
      })));
    }

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

    // 4. Try one more attempt - direct search for usernames containing the value
    if (profileError || !profileData) {
      const { data: containsAttemptData, error: containsAttemptError } = await supabaseClient
        .from('profiles')
        .select('id, telegram')
        .ilike('telegram', `%${cleanTelegramUsername}%`)
        .limit(5);
        
      console.log('Contains search attempt:', { 
        query: `ILIKE '%${cleanTelegramUsername}%'`, 
        results: containsAttemptData, 
        error: containsAttemptError 
      });
        
      if (!containsAttemptError && containsAttemptData && containsAttemptData.length > 0) {
        // Use the first match
        profileData = containsAttemptData[0];
        profileError = null;
        console.log('Using first match from contains search:', profileData);
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
    
    // Ensure courseId is properly formatted 
    let formattedCourseId = courseId;
    
    // Sanitize courseId and make sure it's correctly formatted
    if (formattedCourseId) {
      formattedCourseId = formattedCourseId.trim();
      
      // Fix courseId if it's missing the last character (which seems to be happening)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{11,12}$/i;
      if (uuidRegex.test(formattedCourseId) && formattedCourseId.length === 35) {
        // If it's 35 characters (missing one), try to query the database for the full ID
        console.log('Course ID appears to be missing a character:', formattedCourseId);
        
        const { data: possibleCourses, error: courseSearchError } = await supabaseClient
          .from('courses')
          .select('id')
          .ilike('id', `${formattedCourseId}%`)
          .limit(1);
          
        if (!courseSearchError && possibleCourses && possibleCourses.length > 0) {
          formattedCourseId = possibleCourses[0].id;
          console.log('Found matching course ID:', formattedCourseId);
        }
      }
      
      // Final check to ensure it's a valid UUID
      const finalUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!finalUuidRegex.test(formattedCourseId)) {
        console.log('Invalid course ID format:', formattedCourseId);
        return new Response(
          JSON.stringify({ status: "Not enrolled", error: "Invalid course ID format" }),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
    }
    
    console.log("Formatted course ID:", formattedCourseId);

    // 2. Get course with the provided courseId
    const { data: courseData, error: courseError } = await supabaseClient
      .from('courses')
      .select('id, duration, recurring')
      .eq('id', formattedCourseId)
      .maybeSingle();

    if (courseError) {
      console.log('Course query error:', courseError);
      return new Response(
        JSON.stringify({ status: "Not enrolled", error: "Course query error" }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    if (!courseData) {
      console.log('Course not found:', formattedCourseId);
      return new Response(
        JSON.stringify({ status: "Not enrolled", error: "Course not found" }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log('Course found:', courseData);

    // 3. Check if user is enrolled in the course
    const { data: enrollmentData, error: enrollmentError } = await supabaseClient
      .from('enrollments')
      .select('begin_date, end_date, is_paid')
      .eq('user_id', profileData.id)
      .eq('course_id', courseData.id)
      .order('begin_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (enrollmentError) {
      console.log('Enrollment query error:', enrollmentError);
      return new Response(
        JSON.stringify({ status: "Not enrolled", error: "Enrollment query error" }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    if (!enrollmentData) {
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
