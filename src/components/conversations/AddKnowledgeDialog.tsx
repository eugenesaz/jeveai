
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { addKnowledge } from '@/lib/KnowledgeUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AddKnowledgeDialogProps {
  courseId: string;
  onKnowledgeAdded?: () => void;
  projectId?: string; // Optional project ID for direct knowledge addition
}

export function AddKnowledgeDialog({ courseId, projectId, onKnowledgeAdded }: AddKnowledgeDialogProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    setIsSubmitting(true);
    try {
      // If projectId is provided directly, use it; otherwise get it from the course
      let targetProjectId = projectId;
      
      if (!targetProjectId && courseId) {
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('project_id')
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;
        targetProjectId = courseData.project_id;
      }

      if (!targetProjectId) {
        throw new Error("Project ID not available");
      }

      // Using webhook to add knowledge - never direct insertion
      await addKnowledge(targetProjectId, content.trim());

      toast({
        title: "Knowledge added successfully",
        description: "Your knowledge base has been updated.",
      });

      setContent('');
      setOpen(false);
      onKnowledgeAdded?.();
    } catch (error) {
      console.error('Error adding knowledge:', error);
      const errorMessage = error instanceof Error && error.message.includes('too long') 
        ? error.message 
        : "There was a problem adding your knowledge. Please try again.";
      
      toast({
        title: "Error adding knowledge",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          Add Knowledge
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Knowledge</DialogTitle>
          <DialogDescription>
            Add new knowledge to help improve AI responses. Maximum length is supported.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Enter knowledge here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[200px]"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !content.trim()}>
              {isSubmitting ? 'Adding...' : 'Add Knowledge'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
