
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types/supabase';
import { toast } from '@/components/ui/use-toast';
import { ProjectTile } from '@/components/projects/ProjectTile';
import { EarningsChart } from '@/components/dashboard/EarningsChart';
import { ProfileButton } from '@/components/profile/ProfileButton';

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
          // Create a new object with all properties and add defaults for missing ones
          return {
            ...project,
            color_scheme: (project.color_scheme === 'blue' || 
                         project.color_scheme === 'red' || 
                         project.color_scheme === 'orange' || 
                         project.color_scheme === 'green') 
                         ? project.color_scheme as 'blue' | 'red' | 'orange' | 'green'
                         : null,
            telegram_bot: project.telegram_bot || null,
            description: project.description || null,
          } as Project;
        }) || [];
        
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
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('influencer.dashboard.title')}</h1>
          <div className="flex gap-4 items-center">
            <div className="hidden md:flex gap-4">
              <Button variant="ghost" onClick={() => navigate('/')}>
                {t('navigation.home')}
              </Button>
              <Button variant="ghost" onClick={() => navigate('/projects')}>
                {t('influencer.dashboard.projects')}
              </Button>
              <Button variant="ghost" onClick={() => navigate('/courses')}>
                {t('navigation.courses')}
              </Button>
              <Button variant="ghost" onClick={signOut}>
                {t('navigation.logout')}
              </Button>
            </div>
            <ProfileButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <div className="grid gap-10">
          <EarningsChart />
          
          <section className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-2xl font-bold mb-6">{t('dashboard.quick.actions', 'Quick Actions')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-blue-50 border-blue-100 hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <Plus className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{t('dashboard.create.project', 'Create Project')}</h3>
                  <p className="text-gray-600 text-sm mb-4">{t('dashboard.create.project.desc', 'Start a new project for your audience')}</p>
                  <Button 
                    variant="outline" 
                    className="mt-auto text-blue-600 border-blue-200 hover:bg-blue-100"
                    onClick={() => navigate('/create-project')}
                  >
                    {t('dashboard.get.started', 'Get Started')}
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-purple-50 border-purple-100 hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                    <Plus className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{t('dashboard.create.course', 'Create Course')}</h3>
                  <p className="text-gray-600 text-sm mb-4">{t('dashboard.create.course.desc', 'Add a new course to your offerings')}</p>
                  <Button 
                    variant="outline" 
                    className="mt-auto text-purple-600 border-purple-200 hover:bg-purple-100"
                    onClick={() => navigate('/create-course')}
                  >
                    {t('dashboard.get.started', 'Get Started')}
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-green-50 border-green-100 hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <svg className="h-6 w-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20V10" />
                      <path d="M18 20V4" />
                      <path d="M6 20v-4" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{t('dashboard.view.analytics', 'View Analytics')}</h3>
                  <p className="text-gray-600 text-sm mb-4">{t('dashboard.analytics.desc', 'Track your performance and growth')}</p>
                  <Button 
                    variant="outline" 
                    className="mt-auto text-green-600 border-green-200 hover:bg-green-100"
                    disabled
                  >
                    {t('dashboard.coming.soon', 'Coming Soon')}
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-amber-50 border-amber-100 hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                    <svg className="h-6 w-6 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 1 0 7.75" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{t('dashboard.manage.users', 'Manage Users')}</h3>
                  <p className="text-gray-600 text-sm mb-4">{t('dashboard.users.desc', 'View and manage your user base')}</p>
                  <Button 
                    variant="outline" 
                    className="mt-auto text-amber-600 border-amber-200 hover:bg-amber-100"
                    disabled
                  >
                    {t('dashboard.coming.soon', 'Coming Soon')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>
          
          <section className="bg-white rounded-2xl shadow-sm p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">{t('influencer.dashboard.projects')}</h2>
              <Button onClick={handleCreateProject} className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                {t('influencer.project.createNew')}
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-40">
                <p>{t('loading')}</p>
              </div>
            ) : projects.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
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
                  {projects.slice(0, 3).map((project) => (
                    <ProjectTile
                      key={project.id}
                      project={project}
                      onCopyUrl={handleCopyUrl}
                    />
                  ))}
                </div>
                
                {projects.length > 3 && (
                  <div className="mt-6 text-center">
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/projects')}
                      className="gap-2"
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
