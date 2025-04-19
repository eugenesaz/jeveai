import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types/supabase';
import { toast } from '@/components/ui/use-toast';
import { ProjectsHeader } from '@/components/projects/ProjectsHeader';
import { ProjectTile } from '@/components/projects/ProjectTile';

const Projects = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;

      try {
        console.log('Fetching projects for user ID:', user.id);
        
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          throw error;
        }

        console.log('Projects data:', data);
        
        const typedProjects = data?.map(project => ({
          ...project,
          color_scheme: (project.color_scheme === 'blue' || 
                         project.color_scheme === 'red' || 
                         project.color_scheme === 'orange' || 
                         project.color_scheme === 'green') 
                         ? project.color_scheme as 'blue' | 'red' | 'orange' | 'green'
                         : null
        })) || [];
        
        setProjects(typedProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: 'Error',
          description: 'Failed to load projects',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  const handleCopyUrl = (urlName: string) => {
    const url = `${window.location.origin}/${urlName}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'URL Copied',
      description: 'Project URL has been copied to clipboard',
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>{t('login.required')}</CardTitle>
            <CardDescription>{t('please.login.to.access')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/')} 
              className="w-full"
            >
              {t('go.to.login')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectsHeader />
      <main className="container mx-auto p-6 space-y-6">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p>{t('loading')}</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center p-10">
            <h2 className="text-xl font-semibold mb-4">{t('no.projects')}</h2>
            <Button onClick={() => navigate('/create-project')} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('influencer.project.createNew')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectTile
                key={project.id}
                project={project}
                onCopyUrl={handleCopyUrl}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Projects;
