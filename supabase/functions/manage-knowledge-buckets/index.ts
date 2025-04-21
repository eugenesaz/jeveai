
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

    // Initialize regular client for authenticated operations
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

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header is required" }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Handle POST request (ensure bucket exists)
    if (req.method === "POST") {
      const { action } = await req.json();
      
      if (action === "ensure_buckets") {
        // First check if bucket already exists
        const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
        
        if (listError) {
          console.error('Error listing buckets:', listError);
          throw listError;
        }
        
        // Define the buckets we need
        const requiredBuckets = ['project-images', 'project-knowledge'];
        const createdBuckets = [];
        
        // Create any missing buckets
        for (const bucketName of requiredBuckets) {
          const bucketExists = buckets.some(bucket => bucket.name === bucketName);
          
          if (!bucketExists) {
            console.log(`Creating bucket: ${bucketName}`);
            const { error } = await supabaseAdmin.storage.createBucket(bucketName, {
              public: true
            });
            
            if (error) {
              console.error(`Error creating bucket ${bucketName}:`, error);
              throw error;
            }
            
            createdBuckets.push(bucketName);
          } else {
            console.log(`Bucket ${bucketName} already exists`);
          }
        }
        
        // Create public policies for the buckets if they don't exist
        for (const bucketName of requiredBuckets) {
          // Add public policy for the bucket
          console.log(`Ensuring public access policy for bucket: ${bucketName}`);
          
          // Create policy for read access
          const readPolicy = `storage.objects.${bucketName}.select`;
          const { error: readPolicyError } = await supabaseAdmin.rpc(
            'create_storage_policy',
            {
              name: `${bucketName}_public_select`,
              bucket: bucketName,
              definition: 'true',
              operation: 'SELECT',
              check_clause: 'true'
            }
          );
          
          if (readPolicyError) {
            console.error(`Error creating read policy for ${bucketName}:`, readPolicyError);
          }
          
          // Create policy for insert access
          const insertPolicy = `storage.objects.${bucketName}.insert`;
          const { error: insertPolicyError } = await supabaseAdmin.rpc(
            'create_storage_policy',
            {
              name: `${bucketName}_auth_insert`,
              bucket: bucketName,
              definition: 'auth.uid() IS NOT NULL',
              operation: 'INSERT',
              check_clause: 'true'
            }
          );
          
          if (insertPolicyError) {
            console.error(`Error creating insert policy for ${bucketName}:`, insertPolicyError);
          }
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Storage buckets configured successfully",
            created: createdBuckets 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
    }

    // If not properly routed
    return new Response(
      JSON.stringify({ error: "Invalid request" }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (err) {
    console.error('Error processing request:', err);
    
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: err.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
