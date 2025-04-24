import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { UsersList } from '@/components/conversations/UsersList';
import { MessageList } from '@/components/conversations/MessageList';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, RefreshCcw, Folder } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AddKnowledgeDialog } from '@/components/conversations/AddKnowledgeDialog';

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
  const [highlightFilter, setHighlightFilter] = useState<string>("all");

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

      if (selectedUserId) {
        await fetchMessagesForUser(selectedUserId);
      } else if (users.length > 0) {
        setSelectedUserId(users[0].id);
        await fetchMessagesForUser(users[0].id);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchMessagesForUser = async (userId: string) => {
    if (!courseId) return;

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .order('message_time', { ascending: false });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data);
  };

  useEffect(() => {
    fetchData();
  }, [courseId]);

  useEffect(() => {
    if (selectedUserId) {
      fetchMessagesForUser(selectedUserId);
    }
  }, [selectedUserId]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const getFilteredMessages = () => {
    if (highlightFilter === "all") return messages;
    
    return messages.filter(message => {
      if (!message.message_highlight) return false;
      
      const percentage = parseFloat(message.message_highlight);
      if (isNaN(percentage)) return false;
      
      if (highlightFilter === "high" && percentage >= 80) return true;
      if (highlightFilter === "medium" && percentage >= 50 && percentage < 80) return true;
      if (highlightFilter === "low" && percentage < 50) return true;
      
      return false;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-10 animate-fade-in">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={handleGoBack}
              className="gap-2 hover:scale-105 transition-transform"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('back')}
            </Button>
            <Button
              variant="outline"
              onClick={fetchData}
              disabled={refreshing}
              className="gap-2 hover:scale-105 transition-transform"
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {t('refresh')}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/projects')}
              className="gap-2 hover:scale-105 transition-transform"
            >
              <Folder className="h-4 w-4" />
              {t('navigation.projects', 'Projects')}
            </Button>
          </div>
          <div className="flex gap-2">
            <select 
              className="border rounded-md px-3 py-2 bg-white text-sm"
              value={highlightFilter}
              onChange={(e) => setHighlightFilter(e.target.value)}
            >
              <option value="all">{t('filter.all', 'All Messages')}</option>
              <option value="high">{t('filter.high', 'High Knowledge (>80%)')}</option>
              <option value="medium">{t('filter.medium', 'Medium Knowledge (50-80%)')}</option>
              <option value="low">{t('filter.low', 'Low Knowledge (<50%)')}</option>
            </select>
            <AddKnowledgeDialog courseId={courseId || ''} onKnowledgeAdded={fetchData} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-grow">
        {loading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <p>{t('loading')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white rounded-xl shadow-sm overflow-hidden min-h-[70vh] animate-fade-in">
            <div className="border-r p-4">
              <UsersList
                users={users}
                selectedUserId={selectedUserId}
                onUserSelect={setSelectedUserId}
              />
            </div>
            <div className="md:col-span-2 p-4">
              <MessageList messages={getFilteredMessages()} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ViewConversations;
