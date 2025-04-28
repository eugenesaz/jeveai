import { supabase } from '@/integrations/supabase/client';

export const addKnowledge = async (projectId: string, content: string) => {
  const webhookUrl = `https://paradiseapp.app.n8n.cloud/webhook/2039fb97-5c55-4f3c-bd6b-37f5ac18a0d9/project-knowledge/${projectId}`;

  console.log(`[KnowledgeUtils] Beginning webhook request for project: ${projectId}`);
  console.log(`[KnowledgeUtils] Webhook URL: ${webhookUrl}`);
  console.log(`[KnowledgeUtils] Content length: ${content.length} characters`);
  
  try {
    console.log(`[KnowledgeUtils] Sending POST request to webhook...`);
    
    const requestBody = JSON.stringify({ content: content });
    console.log(`[KnowledgeUtils] Request body (first 100 chars): ${requestBody.substring(0, 100)}${requestBody.length > 100 ? '...' : ''}`);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: requestBody
    });

    console.log(`[KnowledgeUtils] Webhook response status: ${response.status}`);
    const responseText = await response.text();
    console.log(`[KnowledgeUtils] Webhook response body: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);

    if (!response.ok) {
      console.error(`[KnowledgeUtils] Failed to add knowledge. Status: ${response.status}, Text: ${responseText}`);
      throw new Error(`Failed to add knowledge (Status: ${response.status})`);
    }

    console.log(`[KnowledgeUtils] Successfully sent knowledge to webhook`);
    return response;
  } catch (error) {
    console.error('[KnowledgeUtils] Exception during webhook request:', error);
    throw new Error(`Failed to add knowledge: ${error.message || 'Unknown error'}`);
  }
};

export const fetchProjectKnowledge = async (projectId: string) => {
  console.log(`Fetching knowledge for project ID: ${projectId}`);
  
  try {
    const { data, error } = await supabase
      .from('project_knowledge_vector')
      .select('id, content, created_at, metadata')
      .filter('metadata->>projectId', 'eq', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching project knowledge:', error);
      throw error;
    }

    console.log(`Retrieved ${data?.length || 0} knowledge entries`);
    return data || [];
  } catch (error) {
    console.error('Exception fetching project knowledge:', error);
    throw error;
  }
};
