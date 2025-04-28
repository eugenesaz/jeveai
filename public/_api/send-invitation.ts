
// Edge function proxy for send-invitation
export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  // Get the Supabase URL from the environment variables
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lxiqvvourradjjhocxrd.supabase.co';
  
  // Proxy the request to the Supabase Edge Function
  const url = `${SUPABASE_URL}/functions/v1/send-invitation`;
  
  // Forward the headers and body
  const headers = new Headers(req.headers);
  
  try {
    console.log("Proxying request to edge function:", url);
    
    // Debug logging
    if (req.method === 'POST') {
      try {
        const clonedReq = req.clone();
        const bodyText = await clonedReq.text();
        console.log('Request body:', bodyText);
      } catch (e) {
        console.error('Could not log request body:', e);
      }
    }
    
    const response = await fetch(url, {
      method: req.method,
      headers,
      body: req.body,
    });
    
    console.log('Edge function response status:', response.status);
    
    // Return the response from the edge function
    return response;
  } catch (error) {
    console.error('Error proxying to edge function:', error);
    return new Response(JSON.stringify({ error: 'Failed to proxy request to edge function' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
