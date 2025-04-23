
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { UsersList } from '@/components/conversations/UsersList';
import { MessageList } from '@/components/conversations/MessageList';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, RefreshCcw, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface User {
  id: string;
  name: string;
  messageCount: number;
}

interface Message {
  id: string;
  user_message: string;
  message_time: string;
  response: string;
  response_time: string;
  message_highlight: string | null;
}

const ViewConversations = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!courseId) return;
    setRefreshing(true);

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('user_id, name')
        .eq('course_id', courseId);

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      const userMap = new Map<string, { name: string; count: number }>();
      data.forEach(item => {
        const existing = userMap.get(item.user_id);
        if (existing) {
          existing.count += 1;
        } else {
          userMap.set(item.user_id, { name: item.name, count: 1 });
        }
      });

      const users = Array.from(userMap.entries()).map(([id, info]) => ({
        id,
        name: info.name,
        messageCount: info.count
      }));

      setUsers(users);
      if (users.length > 0 && !selectedUserId) {
        setSelectedUserId(users[0].id);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [courseId]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!courseId || !selectedUserId) return;

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', selectedUserId)
        .order('message_time', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data);
    };

    if (selectedUserId) {
      fetchMessages();
    }
  }, [courseId, selectedUserId]);

  const handleAddKnowledge = () => {
    navigate(`/manage-knowledge/${courseId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('back')}
            </Button>
            <Button
              variant="outline"
              onClick={fetchData}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {t('refresh')}
            </Button>
          </div>
          <Button
            onClick={handleAddKnowledge}
            variant="default"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('Add Knowledge')}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <p>{t('loading')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white rounded-xl shadow-sm overflow-hidden min-h-[70vh]">
            <div className="border-r p-4">
              <UsersList
                users={users}
                selectedUserId={selectedUserId}
                onUserSelect={setSelectedUserId}
              />
            </div>
            <div className="md:col-span-2 p-4">
              <MessageList messages={messages} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ViewConversations;
