
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Home, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types/supabase';
import { toast } from '@/components/ui/sonner';
import { ProjectsHeader } from '@/components/projects/ProjectsHeader';
import { ProjectTile } from '@/components/projects/ProjectTile';
import { ProfileButton } from '@/components/profile/ProfileButton';

const Projects = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
        
        // Add description property if it doesn't exist in the database response
        const typedProjects = data?.map(project => {
          // Add type assertion to access description
          const projectData = project as any;
          
          return {
            id: project.id,
            name: project.name,
            url_name: project.url_name,
            status: project.status,
            landing_image: project.landing_image,
            user_id: project.user_id,
            created_at: project.created_at,
            // Set valid color scheme or null if invalid
            color_scheme: (project.color_scheme === 'blue' || 
                          project.color_scheme === 'red' || 
                          project.color_scheme === 'orange' || 
                          project.color_scheme === 'green') 
                          ? project.color_scheme as 'blue' | 'red' | 'orange' | 'green'
                          : null,
            // Ensure telegram_bot and description exist (null if not present)
            telegram_bot: project.telegram_bot || null,
            description: projectData.description || null,
          } as Project;
        }) || [];
        
        setProjects(typedProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast.error('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  const handleCopyUrl = (urlName: string) => {
    const url = `${window.location.origin}/${urlName}`;
    navigator.clipboard.writeText(url);
    toast.success('Project URL has been copied to clipboard');
  };

  const filteredProjects = searchQuery 
    ? projects.filter(project => 
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : projects;

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
              {t('navigation.login')}
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
          <h1 className="text-2xl font-bold">{t('projects.title', 'Projects')}</h1>
          <div className="flex gap-4 items-center">
            <div className="hidden md:flex gap-4">
              <Button variant="ghost" onClick={() => navigate('/')} className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                {t('navigation.home')}
              </Button>
              <Button variant="ghost" onClick={() => navigate('/dashboard')} className="flex items-center gap-2">
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 15V9a4 4 0 1 1 8 0v6" /></svg>
                {t('navigation.dashboard')}
              </Button>
              <Button variant="ghost" onClick={() => navigate('/courses')} className="flex items-center gap-2">
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 3v4" /><path d="M8 3v4" /></svg>
                {t('navigation.courses')}
              </Button>
              <Button variant="ghost" onClick={signOut} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                {t('navigation.logout')}
              </Button>
            </div>
            <ProfileButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto py-10 px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold">{t('projects.manage', 'Manage Your Projects')}</h2>
            <Button 
              onClick={() => navigate('/create-project')} 
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              {t('project.createNew', 'Create New Project')}
            </Button>
          </div>
          
          <div className="relative w-full md:max-w-sm mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={t('search.projects', 'Search projects...')}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-40">
              <p>{t('loading')}</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center bg-gray-50 rounded-xl p-10">
              {searchQuery ? (
                <>
                  <h3 className="text-xl font-semibold mb-4">{t('no.search.results', 'No projects match your search')}</h3>
                  <p className="text-gray-600 mb-4">{t('try.different.search', 'Try different search terms or create a new project')}</p>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-semibold mb-4">{t('no.projects')}</h3>
                  <p className="text-gray-600 mb-4">{t('create.first.project', 'Create your first project to get started')}</p>
                </>
              )}
              <Button onClick={() => navigate('/create-project')} className="gap-2">
                <Plus className="h-4 w-4" />
                {t('project.createNew', 'Create New Project')}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectTile
                  key={project.id}
                  project={project}
                  onCopyUrl={handleCopyUrl}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Projects;
