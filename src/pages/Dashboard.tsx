
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Home, Package, LogOut, Plus, ArrowRight, Share2, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Project, ProjectShare } from '@/types/supabase';
import { toast } from '@/components/ui/sonner';
import { ProjectTile } from '@/components/projects/ProjectTile';
import { PendingInvitationTile } from '@/components/projects/PendingInvitationTile';
import { ProfileButton } from '@/components/profile/ProfileButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Dashboard = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [ownedProjects, setOwnedProjects] = useState<Project[]>([]);
  const [sharedProjects, setSharedProjects] = useState<Project[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<(ProjectShare & { project: any; inviterEmail?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'owned', 'shared'
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching projects for user ID:', user.id);
      
      // Fetch owned projects with explicit filter by user_id
      const { data: ownedData, error: ownedError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id);

      if (ownedError) {
        console.error('Error fetching owned projects:', ownedError);
        throw ownedError;
      }
      
      // Fetch shared projects with status='accepted'
      const { data: sharedData, error: sharedError } = await supabase
        .from('project_shares')
        .select(`
          id,
          role,
          status,
          project:project_id (
            id,
            name,
            url_name,
            status,
            landing_image,
            user_id,
            created_at,
            color_scheme,
            telegram_bot
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted');
      
      if (sharedError) {
        console.error('Error fetching shared projects:', sharedError);
        throw sharedError;
      }
      
      // Fetch pending invitations
      const { data: pendingData, error: pendingError } = await supabase
        .from('project_shares')
        .select(`
          id,
          role,
          status,
          invited_email,
          project:project_id (
            id,
            name,
            url_name,
            status,
            landing_image,
            user_id,
            created_at,
            color_scheme,
            telegram_bot
          ),
          inviter_id
        `)
        .eq('invited_email', user.email)
        .eq('status', 'pending');

      if (pendingError) {
        console.error('Error fetching pending invitations:', pendingError);
        throw pendingError;
      }

      // For each shared project and pending invitation, fetch the owner's email
      const fetchOwnerEmails = async (items: any[]) => {
        return Promise.all(
          items
            .filter(share => share.project) // Filter out any null projects
            .map(async (item) => {
              const project = item.project;
              let ownerEmail = null;
              
              try {
                // Fetch owner's email directly using the project's user_id
                if (project && project.user_id) {
                  const { data: ownerData, error: ownerError } = await supabase
                    .from('profiles')
                    .select('email')
                    .eq('id', project.user_id)
                    .maybeSingle();
                  
                  if (ownerError) {
                    console.error('Error fetching owner email:', ownerError);
                  } else if (ownerData) {
                    ownerEmail = ownerData.email;
                  }
                }
                
                // For pending invitations, also fetch the inviter's email
                let inviterEmail = null;
                if (item.inviter_id) {
                  const { data: inviterData, error: inviterError } = await supabase
                    .from('profiles')
                    .select('email')
                    .eq('id', item.inviter_id)
                    .maybeSingle();
                  
                  if (inviterError) {
                    console.error('Error fetching inviter email:', inviterError);
                  } else if (inviterData) {
                    inviterEmail = inviterData.email;
                  }
                }
                
                return {
                  ...item,
                  ownerEmail,
                  inviterEmail
                };
              } catch (e) {
                console.error('Error fetching owner email:', e);
                return item;
              }
            })
        );
      };

      const sharedProjectsWithOwners = await fetchOwnerEmails(sharedData || []);
      const pendingInvitationsWithEmails = await fetchOwnerEmails(pendingData || []);

      // Transform owned projects
      const typedOwnedProjects = ownedData?.map(project => {
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
            project.color_scheme === 'green' ||
            project.color_scheme === 'purple' ||
            project.color_scheme === 'indigo' ||
            project.color_scheme === 'pink' ||
            project.color_scheme === 'teal')
            ? project.color_scheme as 'blue' | 'red' | 'orange' | 'green' | 'purple' | 'indigo' | 'pink' | 'teal'
            : null,
          telegram_bot: project.telegram_bot || null,
          description: projectData.description || null,
          isShared: false
        } as Project;
      }) || [];
      
      // Transform shared projects with adjusted object structure
      const typedSharedProjects = sharedProjectsWithOwners
        .filter(Boolean)
        .map((item) => {
          if (!item.project) return null;
          
          return {
            id: item.project.id,
            name: item.project.name,
            url_name: item.project.url_name,
            status: item.project.status,
            landing_image: item.project.landing_image,
            user_id: item.project.user_id,
            created_at: item.project.created_at,
            color_scheme: (item.project.color_scheme === 'blue' || 
                         item.project.color_scheme === 'red' || 
                         item.project.color_scheme === 'orange' || 
                         item.project.color_scheme === 'green' ||
                         item.project.color_scheme === 'purple' ||
                         item.project.color_scheme === 'indigo' ||
                         item.project.color_scheme === 'pink' ||
                         item.project.color_scheme === 'teal') 
                         ? item.project.color_scheme as 'blue' | 'red' | 'orange' | 'green' | 'purple' | 'indigo' | 'pink' | 'teal'
                         : null,
            telegram_bot: item.project.telegram_bot || null,
            description: null,
            isShared: true,
            ownerEmail: item.ownerEmail,
            shareRole: item.role
          } as Project & { shareRole: string };
        }).filter(Boolean) as (Project & { shareRole: string })[];

      // Set state for pending invitations
      setPendingInvitations(pendingInvitationsWithEmails || []);
      setOwnedProjects(typedOwnedProjects);
      setSharedProjects(typedSharedProjects);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      setError(error?.message || 'Failed to load projects');
      toast.error('Error', {
        description: 'Failed to load projects: ' + (error?.message || 'Unknown error'),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  const handleInvitationAction = () => {
    // Refresh the projects and invitations after an accept/decline action
    fetchProjects();
  };

  // All projects combined
  const allProjects = [...ownedProjects, ...sharedProjects];
  
  // Get projects to display based on active tab
  const projectsToDisplay = activeTab === 'owned' 
    ? ownedProjects 
    : activeTab === 'shared' 
      ? sharedProjects 
      : allProjects;
  
  // Limit to 3 projects for dashboard display
  const displayedProjects = projectsToDisplay.slice(0, 3);
  
  // Get pending invitations if on 'all' tab
  const displayedInvitations = activeTab === 'all' ? pendingInvitations.slice(0, 2) : [];

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

            {pendingInvitations.length > 0 && activeTab === 'all' && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-blue-600 flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    {t('Pending Invitations')}
                    <span className="ml-2 bg-blue-500 text-white rounded-full w-5 h-5 inline-flex items-center justify-center text-xs font-bold">
                      {pendingInvitations.length}
                    </span>
                  </h3>
                  {pendingInvitations.length > 2 && (
                    <Button 
                      variant="ghost" 
                      onClick={() => navigate('/projects')}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {t('View all invitations')}
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {displayedInvitations.map((invitation, index) => (
                    <div 
                      key={invitation.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <PendingInvitationTile 
                        invitation={invitation}
                        onAcceptReject={handleInvitationAction}
                      />
                    </div>
                  ))}
                </div>
                <div className="border-b border-gray-200 my-6" />
              </div>
            )}

            <div className="mb-6">
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">
                    {t('All Projects')} ({allProjects.length})
                  </TabsTrigger>
                  <TabsTrigger value="owned">
                    {t('My Projects')} ({ownedProjects.length})
                  </TabsTrigger>
                  <TabsTrigger value="shared">
                    <Share2 className="h-4 w-4 mr-2" />
                    {t('Shared With Me')} ({sharedProjects.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-40">
                <p>{t('loading')}</p>
              </div>
            ) : error ? (
              <div className="text-center bg-red-50 rounded-xl p-10 animate-fade-in">
                <h3 className="text-xl font-semibold mb-4 text-red-600">{t('Error loading projects')}</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()} className="gap-2">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {t('Reload')}
                </Button>
              </div>
            ) : ownedProjects.length === 0 && sharedProjects.length === 0 && pendingInvitations.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-300 bg-gray-50 animate-fade-in">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-lg text-gray-600 mb-4">{t('no.projects')}</p>
                  <Button onClick={() => navigate('/create-project')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t('influencer.project.createNew')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedProjects.map((project, index) => (
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
                {projectsToDisplay.length > 3 && (
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
