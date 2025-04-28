
const MAX_WEBHOOK_LENGTH = 4000; // Typical max length for webhook URLs

export const addKnowledge = async (projectId: string, content: string) => {
  const webhookUrl = `https://paradiseapp.app.n8n.cloud/webhook/2039fb97-5c55-4f3c-bd6b-37f5ac18a0d9/project-knowledge/${projectId}/${encodeURIComponent(content)}`;
  
  if (content.length > MAX_WEBHOOK_LENGTH) {
    throw new Error("Content is too long. Please use the Telegram bot or split your message into smaller parts.");
  }

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
