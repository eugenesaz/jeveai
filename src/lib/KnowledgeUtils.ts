
import { supabase } from '@/integrations/supabase/client';

export const addKnowledge = async (projectId: string, content: string) => {
  const webhookUrl = `https://paradiseapp.app.n8n.cloud/webhook/2039fb97-5c55-4f3c-bd6b-37f5ac18a0d9/project-knowledge/${projectId}`;

  console.log(`Sending knowledge via webhook body for project: ${projectId}`);

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api_key': 'EsH3PvxtdDqeR4G'
    },
    body: JSON.stringify({ content: content })
  });

  if (!response.ok) {
    console.error(`Failed to add knowledge. Status: ${response.status}, Text: ${await response.text().catch(() => '')}`);
    throw new Error(`Failed to add knowledge (Status: ${response.status})`);
  }

  return response;
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
