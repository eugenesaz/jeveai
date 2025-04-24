import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Home, Package, LogOut, Plus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types/supabase';
import { toast } from '@/components/ui/sonner';
import { ProjectTile } from '@/components/projects/ProjectTile';
import { ProfileButton } from '@/components/profile/ProfileButton';
import { EarningsChart } from '@/components/dashboard/EarningsChart';

const Dashboard = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
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
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        console.log('Projects data:', data);

        const typedProjects = data?.map(project => {
          const projectData = project as any;
          return {
            id: project.id,
            name: project.name,
            url_name: project.url_name,
            status: project.status,
            landing_image: project.landing_image,
            user_id: project.user_id,
            created_at: project.created_at,
            color_scheme: (project.color_scheme === 'blue' ||
              project.color_scheme === 'red' ||
              project.color_scheme === 'orange' ||
              project.color_scheme === 'green')
              ? project.color_scheme as 'blue' | 'red' | 'orange' | 'green'
              : null,
            telegram_bot: project.telegram_bot || null,
            description: projectData.description || null,
          } as Project;
        }) || [];

        setProjects(typedProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast.error('Error', {
          description: 'Failed to load projects',
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
    toast.success('URL Copied', {
      description: 'Project URL has been copied to clipboard',
    });
  };

  const handleCreateProject = () => {
    navigate('/create-project');
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
      <header className="bg-white shadow-sm animate-fade-in">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('influencer.dashboard.title')}</h1>
          <div className="flex gap-4 items-center">
            <div className="hidden md:flex gap-4">
              <Button variant="ghost" onClick={() => navigate('/dashboard')} className="group transition-all duration-300">
                <Home className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
                {t('navigation.home')}
              </Button>
              <Button variant="ghost" onClick={() => navigate('/projects')} className="group transition-all duration-300">
                <Package className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
                {t('navigation.projects')}
              </Button>
              <Button variant="ghost" onClick={() => navigate('/courses')} className="group transition-all duration-300">
                <Calendar className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
                {t('navigation.courses')}
              </Button>
              <Button variant="ghost" onClick={signOut} className="group transition-all duration-300">
                <LogOut className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
                {t('navigation.logout')}
              </Button>
            </div>
            <ProfileButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <div className="grid gap-10">
          <section className="bg-white rounded-2xl shadow-sm p-8 animate-fade-in">
            <div className="flex justify-between items-center mb-8 animate-fade-in">
              <h2 className="text-2xl font-bold">{t('influencer.dashboard.projects')}</h2>
              <Button 
                onClick={handleCreateProject} 
                className="group transition-all duration-300 bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
                {t('influencer.project.createNew')}
              </Button>
            </div>
            
            <div className="mb-8">
              <EarningsChart />
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-40">
                <p>{t('loading')}</p>
              </div>
            ) : projects.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-300 bg-gray-50 animate-fade-in">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-lg text-gray-600 mb-4">{t('no.projects')}</p>
                  <Button onClick={handleCreateProject} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t('influencer.project.createNew')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.slice(0, 3).map((project, index) => (
                    <div 
                      key={project.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <ProjectTile
                        project={project}
                        onCopyUrl={handleCopyUrl}
                      />
                    </div>
                  ))}
                </div>
                {projects.length > 3 && (
                  <div className="mt-6 text-center animate-fade-in">
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/projects')}
                      className="gap-2 hover:scale-105 transition-transform"
                    >
                      {t('view.all.projects', 'View All Projects')}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
