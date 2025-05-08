
import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, FileIcon, FileText, Image, FileVideo, FileAudio, File, RefreshCcw } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { toast } from '@/components/ui/sonner';

interface Message {
  id: string;
  user_message: string;
  message_time: string;
  response: string;
  response_time: string;
  message_highlight: string | null;
  file_storage_path: string | null; 
  original_file_name: string | null;
}

interface MessageListProps {
  messages: Message[];
}

export const MessageList = ({ messages }: MessageListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loadingFiles, setLoadingFiles] = useState<Record<string, boolean>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  
  const filteredMessages = messages.filter(message => 
    message.user_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.response.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (message.message_highlight?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (message.original_file_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const getHighlightColor = (highlight: string | null) => {
    if (!highlight) return 'bg-white border';
    
    const percentage = parseFloat(highlight);
    if (isNaN(percentage)) return 'bg-white border';

    if (percentage >= 80) return 'bg-white border';
    if (percentage >= 50) return 'bg-yellow-50 border-yellow-100';
    return 'bg-red-50 border-red-100';
  };

  // Function to get a signed URL for file access
  const getSignedUrl = async (filePath: string) => {
    try {
      setLoadingFiles(prev => ({ ...prev, [filePath]: true }));
      setFileErrors(prev => ({ ...prev, [filePath]: '' }));
      
      const { data, error } = await supabase.functions.invoke('get-private-file-url', {
        body: { filePath },
      });

      if (error) {
        console.error('Error getting signed URL:', error);
        setFileErrors(prev => ({ ...prev, [filePath]: `Error: ${error.message}` }));
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Failed to get signed URL:', error);
      setFileErrors(prev => ({ ...prev, [filePath]: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`}));
      return null;
    } finally {
      setLoadingFiles(prev => ({ ...prev, [filePath]: false }));
    }
  };

  // Get signed URLs for all file messages on component mount
  useEffect(() => {
    const fetchSignedUrls = async () => {
      const filesToFetch = messages.filter(message => message.file_storage_path);
      
      if (filesToFetch.length === 0) return;
      
      // Initialize loading state for all files
      const initialLoadingState: Record<string, boolean> = {};
      filesToFetch.forEach(message => {
        if (message.file_storage_path) {
          initialLoadingState[message.file_storage_path] = true;
        }
      });
      setLoadingFiles(initialLoadingState);
      
      // Fetch files one by one to avoid overwhelming the edge function
      for (const message of filesToFetch) {
        if (!message.file_storage_path) continue;
        
        try {
          const signedUrl = await getSignedUrl(message.file_storage_path);
          if (signedUrl) {
            setSignedUrls(prev => ({ 
              ...prev, 
              [message.file_storage_path!]: signedUrl 
            }));
          }
        } catch (err) {
          console.error(`Error fetching URL for ${message.file_storage_path}:`, err);
        }
      }
    };

    fetchSignedUrls();
  }, [messages]);

  // Helper to determine file type for icon display
  const getFileIcon = (fileName: string) => {
    if (!fileName) return <File className="h-5 w-5" />;
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return <Image className="h-5 w-5" />;
    } else if (['mp4', 'webm', 'mov', 'avi'].includes(extension || '')) {
      return <FileVideo className="h-5 w-5" />;
    } else if (['mp3', 'wav', 'ogg'].includes(extension || '')) {
      return <FileAudio className="h-5 w-5" />;
    } else if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension || '')) {
      return <FileText className="h-5 w-5" />;
    }
    
    return <FileIcon className="h-5 w-5" />;
  };

  // Helper to render file content based on its type
  const renderFileContent = (filePath: string, fileName: string) => {
    const isLoading = loadingFiles[filePath];
    const error = fileErrors[filePath];
    const signedUrl = signedUrls[filePath];
    
    if (isLoading) {
      return <div className="mt-2 text-sm text-gray-500">Loading file...</div>;
    }
    
    if (error) {
      return (
        <div className="mt-2">
          <div className="text-sm text-red-500 mb-2">{error}</div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={async () => {
              const newUrl = await getSignedUrl(filePath);
              if (newUrl) {
                setSignedUrls(prev => ({ ...prev, [filePath]: newUrl }));
                toast.success("File URL refreshed");
              }
            }}
            className="flex items-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" /> Try Again
          </Button>
        </div>
      );
    }
    
    if (!signedUrl) return (
      <div className="mt-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={async () => {
            const newUrl = await getSignedUrl(filePath);
            if (newUrl) {
              setSignedUrls(prev => ({ ...prev, [filePath]: newUrl }));
              toast.success("File URL generated");
            }
          }}
          className="flex items-center gap-2"
        >
          <RefreshCcw className="h-4 w-4" /> Load File
        </Button>
      </div>
    );
    
    // Images can be rendered directly
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return (
        <div className="mt-2">
          <img 
            src={signedUrl} 
            alt={fileName} 
            className="max-w-full max-h-80 rounded-md"
            onError={(e) => {
              // If the signed URL expires, show a refresh button
              e.currentTarget.style.display = 'none';
              document.getElementById(`reload-${filePath}`)?.classList.remove('hidden');
            }}
          />
          <div id={`reload-${filePath}`} className="hidden mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={async () => {
                const newUrl = await getSignedUrl(filePath);
                if (newUrl) {
                  setSignedUrls(prev => ({ ...prev, [filePath]: newUrl }));
                  toast.success("Image refreshed");
                  document.getElementById(`reload-${filePath}`)?.classList.add('hidden');
                  const imgElement = document.querySelector(`img[alt="${fileName}"]`);
                  if (imgElement) {
                    (imgElement as HTMLImageElement).style.display = 'block';
                    (imgElement as HTMLImageElement).src = newUrl;
                  }
                }
              }}
              className="flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" /> Refresh Image
            </Button>
          </div>
        </div>
      );
    }
    
    // For all other file types, provide a download link
    return (
      <div className="mt-2">
        <Button 
          variant="outline" 
          size="sm" 
          asChild
          className="flex items-center gap-2 text-left"
        >
          <a 
            href={signedUrl} 
            download={fileName} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            {getFileIcon(fileName)}
            <span>Download {fileName}</span>
          </a>
        </Button>
      </div>
    );
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
                    <p className="text-sm text-gray-600">
                      {message.user_message || (message.file_storage_path && 
                        <span className="flex items-center text-gray-600">
                          {getFileIcon(message.original_file_name || '')}
                          <span className="ml-2">{message.original_file_name || 'Attachment'}</span>
                        </span>)
                      }
                    </p>
                    
                    {message.file_storage_path && (
                      renderFileContent(message.file_storage_path, message.original_file_name || 'file')
                    )}
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
