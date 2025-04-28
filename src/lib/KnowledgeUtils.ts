
const MAX_WEBHOOK_LENGTH = 4000; // Typical max length for webhook URLs

export const addKnowledge = async (projectId: string, content: string) => {
  const webhookUrl = `https://paradiseapp.app.n8n.cloud/webhook/2039fb97-5c55-4f3c-bd6b-37f5ac18a0d9/project-knowledge/${projectId}/${encodeURIComponent(content)}`;
  
  if (content.length > MAX_WEBHOOK_LENGTH) {
    throw new Error("Content is too long. Please use the Telegram bot or split your message into smaller parts.");
  }

  console.log(`Sending knowledge to webhook: ${projectId}`);

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api_key': 'EsH3PvxtdDqeR4G'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to add knowledge');
  }

  return response;
};

export const fetchProjectKnowledge = async (projectId: string) => {
  console.log(`Fetching knowledge for project ID: ${projectId}`);
  
  try {
    // We're using the project_knowledge_vector table where projectId is in the metadata
    const { data, error } = await supabase
      .from('project_knowledge_vector')
      .select('id, content, created_at, metadata')
      .filter('metadata->projectId', 'eq', projectId)
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

