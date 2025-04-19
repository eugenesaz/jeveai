
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';

interface Project {
  id: string;
  name: string;
}

interface ProjectSelectorProps {
  userId: string;
  value: string;
  onChange: (value: string) => void;
}

export const ProjectSelector = ({ userId, value, onChange }: ProjectSelectorProps) => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name')
          .eq('user_id', userId)
          .eq('status', true);

        if (error) throw error;

        if (data && data.length > 0) {
          setProjects(data);
          if (!value && data.length > 0) {
            onChange(data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, [userId, value, onChange]);

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
      <Select value={value} onValueChange={onChange}>
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
