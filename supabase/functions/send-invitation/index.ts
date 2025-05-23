
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Parse the request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      console.error("Error parsing request body:", e);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { inviterEmail, recipientEmail, projectName, projectId, role, invitationId, appUrl } = requestBody;

    // Basic validation
    if (!recipientEmail || !projectName || !invitationId || !appUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters', details: { recipientEmail, projectName, invitationId, appUrl } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construct invitation URL with invitationId as query param
    const invitationUrl = `${appUrl}/projects?inviteId=${invitationId}`;

    // Construct email content
    const subject = `Invitation to collaborate on project: ${projectName}`;
    const roleDisplay = role === 'read_only' ? 'Read Only' : 
                        role === 'contributor' ? 'Contributor' : 
                        role === 'knowledge_manager' ? 'Knowledge Manager' : role;
    
    const from = inviterEmail || 'noreply@example.com';
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4361ee;">Project Invitation</h2>
        <p>You've been invited to collaborate on the project <strong>${projectName}</strong> with <strong>${roleDisplay}</strong> access.</p>
        ${inviterEmail ? `<p>Invitation sent by: ${inviterEmail}</p>` : ''}
        <p>Click the button below to accept this invitation:</p>
        <div style="margin: 25px 0;">
          <a href="${invitationUrl}" style="background-color: #4361ee; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Accept Invitation</a>
        </div>
        <p style="color: #666; font-size: 13px;">If you don't have an account yet, you'll be prompted to create one.</p>
        <p style="color: #666; font-size: 13px;">If you did not expect this invitation, you can safely ignore this email.</p>
      </div>
    `;

    console.log(`Sending invitation email to ${recipientEmail} for project ${projectName}`);

    // In a production environment, you would integrate with a real email service here
    // For now, we'll just log the email details and pretend we sent it
    console.log({
      to: recipientEmail,
      from: from,
      subject: subject,
      html: emailContent,
    });

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation email scheduled',
        details: {
          recipient: recipientEmail,
          project: projectName,
          url: invitationUrl
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send invitation email', stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
