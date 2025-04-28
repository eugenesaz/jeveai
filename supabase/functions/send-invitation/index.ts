
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@1.0.0";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Interface for the request body
interface InvitationRequest {
  inviterName?: string;
  inviterEmail: string;
  recipientEmail: string;
  projectName: string;
  projectId: string;
  role: string;
  invitationId: string;
  appUrl: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not set");
    }

    const resend = new Resend(resendApiKey);
    const body: InvitationRequest = await req.json();

    const {
      inviterName,
      inviterEmail,
      recipientEmail,
      projectName,
      projectId,
      role,
      invitationId,
      appUrl,
    } = body;

    if (!inviterEmail || !recipientEmail || !projectName || !projectId || !role || !invitationId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Format the role for display
    const formattedRole = role.replace('_', ' ').replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
    
    // Create the URL to the projects page
    const projectsUrl = `${appUrl}/projects`;
    
    // Send the email
    const { data, error } = await resend.emails.send({
      from: "Project Invitations <no-reply@notifications.app>",
      to: [recipientEmail],
      subject: `You've been invited to collaborate on "${projectName}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Project Invitation</h2>
          <p style="color: #4b5563; font-size: 16px;">
            ${inviterName ? inviterName : inviterEmail} has invited you to collaborate on <strong>${projectName}</strong>.
          </p>
          <p style="color: #4b5563; font-size: 16px;">
            You've been granted <strong>${formattedRole}</strong> access to this project.
          </p>
          <div style="margin: 30px 0;">
            <a href="${projectsUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Invitation</a>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If you don't have an account yet, you'll need to create one with this email address to access the project.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #9ca3af; font-size: 12px;">
            If you weren't expecting this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Failed to send email:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    // Return success response
    return new Response(
      JSON.stringify({ success: true, message: "Invitation email sent", data }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-invitation function:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
