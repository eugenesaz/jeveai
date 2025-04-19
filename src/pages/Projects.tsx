
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types/supabase';
import { toast } from '@/components/ui/use-toast';
import { Plus } from 'lucide-react';

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
        
        // Cast color_scheme to ensure it matches the Project type
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

  const getColorClass = (colorScheme: string | null) => {
    switch (colorScheme) {
      case 'blue':
        return 'bg-blue-100 border-blue-500';
      case 'red':
        return 'bg-red-100 border-red-500';
      case 'orange':
        return 'bg-orange-100 border-orange-500';
      case 'green':
        return 'bg-green-100 border-green-500';
      default:
        return 'bg-gray-100 border-gray-500';
    }
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
      <header className="bg-white shadow-sm">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('influencer.project.title')}</h1>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              {t('navigation.dashboard')}
            </Button>
            <Button variant="ghost" onClick={() => navigate('/courses')}>
              {t('navigation.courses')}
            </Button>
            <Button onClick={() => navigate('/create-project')} variant="default">
              {t('influencer.project.createNew')}
            </Button>
          </div>
        </div>
      </header>

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card 
                key={project.id} 
                className={`border-2 ${getColorClass(project.color_scheme)}`}
              >
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>
                    {project.status ? t('influencer.project.active') : t('influencer.project.inactive')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {project.landing_image && (
                    <div className="w-full h-40 mb-4 overflow-hidden rounded">
                      <img 
                        src={project.landing_image} 
                        alt={project.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <p className="text-sm text-gray-500">
                    URL: {window.location.origin}/{project.url_name}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => handleCopyUrl(project.url_name)}
                  >
                    {t('influencer.project.copyUrl')}
                  </Button>
                  <Button 
                    variant="default"
                    onClick={() => navigate(`/edit-project/${project.id}`)}
                  >
                    {t('edit')}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Projects;
