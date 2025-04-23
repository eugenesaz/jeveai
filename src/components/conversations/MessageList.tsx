
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  id: string;
  user_message: string;
  message_time: string;
  response: string;
  response_time: string;
  message_highlight: string | null;
}

interface MessageListProps {
  messages: Message[];
}

export const MessageList = ({ messages }: MessageListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredMessages = messages.filter(message => 
    message.user_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.response.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (message.message_highlight?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const getHighlightColor = (highlight: string | null) => {
    if (!highlight) return 'bg-white border';
    
    const percentage = parseFloat(highlight);
    if (isNaN(percentage)) return 'bg-white border';

    if (percentage >= 80) return 'bg-white border';
    if (percentage >= 50) return 'bg-yellow-50 border-yellow-100';
    return 'bg-red-50 border-red-100';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search messages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-4">
          {filteredMessages.map((message) => (
            <div key={message.id} className="space-y-4">
              <div className="rounded-lg p-4 transition-all duration-200 border bg-white">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium">User Message</p>
                    <p className="text-sm text-gray-600">{message.user_message}</p>
                  </div>
                  <time className="text-xs text-gray-500">
                    {format(new Date(message.message_time), 'MMM d, yyyy HH:mm')}
                  </time>
                </div>
              </div>

              <div className="rounded-lg p-4 transition-all duration-200 border bg-white">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium">Response</p>
                    <p className="text-sm text-gray-600">{message.response}</p>
                  </div>
                  <time className="text-xs text-gray-500">
                    {format(new Date(message.response_time), 'MMM d, yyyy HH:mm')}
                  </time>
                </div>
              </div>

              {message.message_highlight && (
                <div className={`rounded p-2 ${getHighlightColor(message.message_highlight)}`}>
                  <p className="text-sm font-medium text-gray-800">% of knowledge in the response</p>
                  <p className="text-sm text-gray-700">{message.message_highlight}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
