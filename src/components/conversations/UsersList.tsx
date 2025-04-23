
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from 'lucide-react';

interface User {
  id: string;
  name: string;
  messageCount: number;
}

interface UsersListProps {
  users: User[];
  selectedUserId: string | null;
  onUserSelect: (userId: string) => void;
}

export const UsersList = ({ users, selectedUserId, onUserSelect }: UsersListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1">
          {filteredUsers.map((user) => (
            <button
              key={user.id}
              onClick={() => onUserSelect(user.id)}
              className={`w-full p-3 text-left rounded-lg transition-all duration-200 ${
                selectedUserId === user.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-muted'
              }`}
            >
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-muted-foreground">
                {user.messageCount} messages
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
