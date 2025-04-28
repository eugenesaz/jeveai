
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Home, LogOut, Share2, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Project, ProjectShare } from '@/types/supabase';
import { toast } from '@/components/ui/sonner';
import { ProjectsHeader } from '@/components/projects/ProjectsHeader';
import { ProjectTile } from '@/components/projects/ProjectTile';
import { PendingInvitationTile } from '@/components/projects/PendingInvitationTile';
import { ProfileButton } from '@/components/profile/ProfileButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Projects = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [ownedProjects, setOwnedProjects] = useState<Project[]>([]);
  const [sharedProjects, setSharedProjects] = useState<Project[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<(ProjectShare & { project: any; inviterEmail?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'owned', 'shared', 'pending'
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching projects for user ID:', user.id);
      
      // Fetch owned projects
      const { data: ownedData, error: ownedError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id);

      if (ownedError) {
        console.error('Error fetching owned projects:', ownedError);
        throw ownedError;
      }

      console.log('Owned projects fetched:', ownedData?.length || 0);

      // Fetch shared projects
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

      console.log('Shared projects fetched:', sharedData?.length || 0);

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

      console.log('Pending invitations fetched:', pendingData?.length || 0);
      
      const fetchOwnerEmails = async (items: any[]) => {
        return Promise.all(
          items
            .filter(item => item.project) // Filter out any null projects
            .map(async (item) => {
              const project = item.project;
              let ownerEmail = null;
              
              try {
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
                console.error('Error fetching emails:', e);
                return item;
              }
            })
        );
      };

      const sharedProjectsWithOwners = await fetchOwnerEmails(sharedData || []);
      const pendingInvitationsWithEmails = await fetchOwnerEmails(pendingData || []);
      
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
      
      const typedSharedProjects = sharedProjectsWithOwners.map((item) => {
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
    toast.success('Project URL has been copied to clipboard');
  };

  const getFilteredProjects = () => {
    let projectsToFilter: any[] = [];
    
    if (activeTab === 'owned') {
      projectsToFilter = ownedProjects;
    } else if (activeTab === 'shared') {
      projectsToFilter = sharedProjects;
    } else if (activeTab === 'pending') {
      return [];
    } else { // 'all'
      projectsToFilter = [...ownedProjects, ...sharedProjects];
    }
    
    if (searchQuery) {
      return projectsToFilter.filter(project => 
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    } else {
      return projectsToFilter;
    }
  };

  const getFilteredInvitations = () => {
    if (activeTab !== 'all' && activeTab !== 'pending') {
      return [];
    }
    
    if (searchQuery) {
      return pendingInvitations.filter(invitation => 
        invitation.project?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      return pendingInvitations;
    }
  };

  const handleInvitationAction = () => {
    fetchProjects();
  };

  const filteredProjects = getFilteredProjects();
  const filteredInvitations = getFilteredInvitations();

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
      <header className="bg-white shadow-sm animate-fade-in">
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
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 animate-fade-in">
            <h2 className="text-2xl font-bold">{t('projects.manage', 'Manage Your Projects')}</h2>
            <Button 
              onClick={() => navigate('/create-project')} 
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              {t('project.createNew', 'Create New Project')}
            </Button>
          </div>
          
          <div className="mb-6">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">
                  {t('All')} ({ownedProjects.length + sharedProjects.length + pendingInvitations.length})
                </TabsTrigger>
                <TabsTrigger value="owned">
                  {t('My Projects')} ({ownedProjects.length})
                </TabsTrigger>
                <TabsTrigger value="shared">
                  <Share2 className="h-4 w-4 mr-2" />
                  {t('Shared With Me')} ({sharedProjects.length})
                </TabsTrigger>
                {pendingInvitations.length > 0 && (
                  <TabsTrigger value="pending" className="relative">
                    {t('Invitations')} ({pendingInvitations.length})
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                      {pendingInvitations.length}
                    </span>
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          </div>

          <div className="relative w-full md:max-w-sm mb-8 animate-fade-in">
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
          ) : (
            <>
              {filteredInvitations.length > 0 && (activeTab === 'all' || activeTab === 'pending') && (
                <div className="mb-8">
                  {activeTab === 'all' && (
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-600">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {t('Pending Invitations')}
                    </h3>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    {filteredInvitations.map((invitation, index) => (
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
                  {activeTab === 'all' && <div className="border-b border-gray-200 my-8" />}
                </div>
              )}

              {activeTab !== 'pending' ? (
                filteredProjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project, index) => (
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
                ) : (
                  <div className="text-center bg-gray-50 rounded-xl p-10 animate-fade-in">
                    {searchQuery ? (
                      <>
                        <h3 className="text-xl font-semibold mb-4">{t('no.search.results', 'No projects match your search')}</h3>
                        <p className="text-gray-600 mb-4">{t('try.different.search', 'Try different search terms or create a new project')}</p>
                      </>
                    ) : activeTab === 'shared' ? (
                      <>
                        <h3 className="text-xl font-semibold mb-4">{t('No shared projects')}</h3>
                        <p className="text-gray-600 mb-4">{t('No projects have been shared with you yet')}</p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-xl font-semibold mb-4">{t('no.projects')}</h3>
                        <p className="text-gray-600 mb-4">{t('create.first.project', 'Create your first project to get started')}</p>
                      </>
                    )}
                    {activeTab !== 'shared' && (
                      <Button onClick={() => navigate('/create-project')} className="gap-2">
                        <Plus className="h-4 w-4" />
                        {t('project.createNew', 'Create New Project')}
                      </Button>
                    )}
                  </div>
                )
              ) : (
                filteredInvitations.length === 0 && (
                  <div className="text-center bg-gray-50 rounded-xl p-10 animate-fade-in">
                    <h3 className="text-xl font-semibold mb-4">{t('No pending invitations')}</h3>
                    <p className="text-gray-600 mb-4">{t('You have no pending project invitations')}</p>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Projects;
