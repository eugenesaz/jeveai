
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
        console.log(`Fetching projects for user ID: ${userId}`);
        
        // Get projects owned by the user
        const { data: ownedProjects, error: ownedError } = await supabase
          .from('projects')
          .select('id, name')
          .eq('user_id', userId);

        if (ownedError) {
          console.error('Error fetching owned projects:', ownedError);
          setError(`Failed to fetch projects: ${ownedError.message}`);
          return;
        }

        // Get projects shared with the user
        const { data: sharedProjects, error: sharedError } = await supabase
          .from('project_shares')
          .select('project:project_id (id, name)')
          .eq('user_id', userId)
          .eq('status', 'accepted');

        if (sharedError) {
          console.error('Error fetching shared projects:', sharedError);
          setError(`Failed to fetch shared projects: ${sharedError.message}`);
          return;
        }

        // Combine and format the projects
        const allProjects = [
          ...(ownedProjects || []),
          ...(sharedProjects?.map(item => item.project) || [])
        ];

        console.log(`Found ${allProjects.length} projects (${ownedProjects?.length || 0} owned, ${sharedProjects?.length || 0} shared)`);

        if (allProjects.length > 0) {
          setProjects(allProjects);
          // Use selectedProjectId or value, prioritizing selectedProjectId
          const projectToSelect = selectedProjectId || value || (allProjects.length > 0 ? allProjects[0].id : '');
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
      <div className="text-center p-4 border rounded-md bg-gray-50">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">{t('loading.projects', 'Loading projects...')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 border rounded-md bg-red-50">
        <p className="text-red-500 text-sm font-medium">{error}</p>
        <p className="mt-2 text-sm">{t('error.tryAgain', 'Please try again later')}</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center p-4 border rounded-md bg-gray-50">
        <h3 className="text-lg font-medium text-gray-700">{t('no.projects', 'No projects found')}</h3>
        <p className="text-sm text-gray-500 mt-1">{t('create.project.first', 'Create a project first')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="project">{t('select.project', 'Select Project')}</Label>
      <Select 
        value={selectedProjectId || value} 
        onValueChange={(newValue) => {
          if (onProjectSelect) onProjectSelect(newValue);
          if (onChange) onChange(newValue);
        }}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={t('select.project', 'Select Project')} />
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
