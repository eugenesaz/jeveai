
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';

interface ProjectSelectorProps {
  userId?: string;
  value?: string;
  onChange?: (value: string) => void;
  selectedProjectId?: string;
  onProjectSelect?: (projectId: string) => void;
  disabled?: boolean;
}

export const ProjectSelector = ({ 
  userId, 
  value, 
  onChange, 
  selectedProjectId, 
  onProjectSelect, 
  disabled = false 
}: ProjectSelectorProps) => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!userId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fixed query: Use proper select syntax and error handling
        const { data, error } = await supabase
          .from('projects')
          .select('id, name')
          .eq('user_id', userId)
          .eq('status', true);

        if (error) {
          console.error('Error fetching projects:', error);
          setError(`Failed to fetch projects: ${error.message}`);
          return;
        }

        if (data && data.length > 0) {
          setProjects(data);
          // Use selectedProjectId or value, prioritizing selectedProjectId
          const projectToSelect = selectedProjectId || value || (data.length > 0 ? data[0].id : '');
          if (projectToSelect && onProjectSelect) {
            onProjectSelect(projectToSelect);
          }
        } else {
          setProjects([]);
        }
      } catch (error: any) {
        console.error('Error fetching projects:', error);
        setError(`Unexpected error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProjects();
    }
  }, [userId, selectedProjectId, value, onProjectSelect]);

  if (loading) {
    return (
      <div className="text-center p-6">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">{t('loading.projects', 'Loading projects...')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6">
        <p className="text-red-500">{error}</p>
        <p className="mt-2 text-sm">{t('error.tryAgain', 'Please try again later')}</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center p-6">
        <h3 className="text-lg font-semibold mb-4">{t('no.projects')}</h3>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="project">{t('select.project')}</Label>
      <Select 
        value={selectedProjectId || value} 
        onValueChange={(newValue) => {
          if (onProjectSelect) onProjectSelect(newValue);
          if (onChange) onChange(newValue);
        }}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={t('select.project')} />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
