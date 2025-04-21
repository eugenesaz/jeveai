
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { telegramUsername, botUsername } = await req.json();
    
    if (!telegramUsername || !botUsername) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`Checking access for telegram user ${telegramUsername} to bot ${botUsername}`);

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Get user ID from profiles where telegram username matches
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("telegram", telegramUsername)
      .single();

    if (profileError || !profileData) {
      console.log("User not found:", profileError);
      return new Response(
        JSON.stringify({ status: "Not enrolled", reason: "User not found" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const userId = profileData.id;

    // 2. Get course that has the specified telegram bot
    const { data: courseData, error: courseError } = await supabaseAdmin
      .from("courses")
      .select("id")
      .eq("telegram_bot", botUsername)
      .single();

    if (courseError || !courseData) {
      console.log("Course not found:", courseError);
      return new Response(
        JSON.stringify({ status: "Not enrolled", reason: "Course not found" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const courseId = courseData.id;

    // 3. Check enrollment status
    const { data: enrollmentData, error: enrollmentError } = await supabaseAdmin
      .from("enrollments")
      .select("begin_date, end_date")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .eq("is_paid", true)
      .single();

    if (enrollmentError || !enrollmentData) {
      console.log("Enrollment not found:", enrollmentError);
      return new Response(
        JSON.stringify({ status: "Not enrolled" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // 4. Check if the course has expired (if it has an end date)
    if (enrollmentData.end_date) {
      const endDate = new Date(enrollmentData.end_date);
      const now = new Date();
      
      if (now > endDate) {
        return new Response(
          JSON.stringify({ status: "Expired", endDate: enrollmentData.end_date }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
    }

    // 5. If we got here, the user is enrolled and the course is active
    return new Response(
      JSON.stringify({ 
        status: "Active", 
        beginDate: enrollmentData.begin_date,
        endDate: enrollmentData.end_date || null
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
    
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
