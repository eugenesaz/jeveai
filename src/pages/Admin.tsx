import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Influencer {
  id: string;
  email: string;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  url_name: string;
  status: boolean;
}

interface ProjectSecret {
  id: string;
  project_id: string;
  stripe_secret?: string | null;
  gemini_api_key?: string | null;
}

const Admin = () => {
  const { t } = useTranslation();
  const { user, signOut, userRole } = useAuth();
  const navigate = useNavigate();

  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [selectedInfluencer, setSelectedInfluencer] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [stripeKey, setStripeKey] = useState<string>('');
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Check if the current user is the admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;

      if (userRole !== 'admin') {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to access this page.',
          variant: 'destructive',
        });
        navigate('/dashboard');
        return;
      }
      
      // If we get here, the user is an admin
      console.log('Admin access granted');
    };

    checkAdmin();
  }, [user, userRole, navigate]);

  // Fetch all influencers
  useEffect(() => {
    if (!user || userRole !== 'admin') return;
    
    const fetchInfluencers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, created_at')
          .eq('role', 'influencer');

        if (error) throw error;

        if (data) {
          setInfluencers(data as Influencer[]);
        }
      } catch (error) {
        console.error('Error fetching influencers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInfluencers();
  }, [user, userRole]);

  // Fetch projects for selected influencer
  useEffect(() => {
    const fetchProjects = async () => {
      if (!selectedInfluencer) {
        setProjects([]);
        setSelectedProject(null);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, url_name, status')
          .eq('user_id', selectedInfluencer);

        if (error) throw error;

        if (data) {
          setProjects(data as Project[]);
          if (data.length > 0) {
            setSelectedProject(data[0].id);
            
            // Fetch project secrets
            await fetchProjectSecrets(data[0].id);
          } else {
            setSelectedProject(null);
            setStripeKey('');
            setGeminiKey('');
          }
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [selectedInfluencer]);

  // Fetch project secrets when a project is selected
  const fetchProjectSecrets = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('project_secrets')
        .select('id, project_id, stripe_secret, gemini_api_key')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setStripeKey(data.stripe_secret || '');
        setGeminiKey(data.gemini_api_key || '');
      } else {
        setStripeKey('');
        setGeminiKey('');
      }
    } catch (error) {
      console.error('Error fetching project secrets:', error);
      setStripeKey('');
      setGeminiKey('');
    }
  };

  // Update keys when selecting a different project
  useEffect(() => {
    if (selectedProject) {
      fetchProjectSecrets(selectedProject);
    }
  }, [selectedProject]);

  const handleSaveKeys = async () => {
    if (!selectedProject) {
      toast({
        title: 'Error',
        description: 'No project selected',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      
      // Check if a record already exists
      const { data: existingData, error: checkError } = await supabase
        .from('project_secrets')
        .select('id')
        .eq('project_id', selectedProject)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      let result;
      
      if (existingData) {
        // Update existing record
        result = await supabase
          .from('project_secrets')
          .update({
            stripe_secret: stripeKey,
            gemini_api_key: geminiKey,
            updated_at: new Date().toISOString()
          })
          .eq('project_id', selectedProject);
      } else {
        // Insert new record
        result = await supabase
          .from('project_secrets')
          .insert({
            project_id: selectedProject,
            stripe_secret: stripeKey,
            gemini_api_key: geminiKey
          });
      }
      
      if (result.error) throw result.error;

      toast({
        title: 'Success',
        description: 'API keys saved successfully',
      });
    } catch (error) {
      console.error('Error saving API keys:', error);
      toast({
        title: 'Error',
        description: 'Failed to save API keys',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-900 text-white shadow-sm">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('admin.title')}</h1>
          <Button variant="ghost" className="text-white hover:text-gray-200" onClick={signOut}>
            {t('navigation.logout')}
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Influencers list */}
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.influencers')}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && influencers.length === 0 ? (
                <div className="flex justify-center py-8">
                  <p>Loading influencers...</p>
                </div>
              ) : influencers.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No influencers found</p>
              ) : (
                <div className="space-y-2">
                  {influencers.map(influencer => (
                    <Button
                      key={influencer.id}
                      variant={selectedInfluencer === influencer.id ? "default" : "outline"}
                      className="w-full justify-start text-left"
                      onClick={() => setSelectedInfluencer(influencer.id)}
                    >
                      {influencer.email}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Projects list */}
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.projects')}</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedInfluencer ? (
                <p className="text-center py-8 text-gray-500">Select an influencer to view projects</p>
              ) : loading ? (
                <div className="flex justify-center py-8">
                  <p>Loading projects...</p>
                </div>
              ) : projects.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No projects found for this influencer</p>
              ) : (
                <div className="space-y-2">
                  {projects.map(project => (
                    <Button
                      key={project.id}
                      variant={selectedProject === project.id ? "default" : "outline"}
                      className="w-full justify-start text-left"
                      onClick={() => setSelectedProject(project.id)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{project.name}</span>
                        <span className={`text-xs px-2 py-1 rounded ${project.status ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {project.status ? t('active') : t('inactive')}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* API Keys */}
          <Card>
            <CardHeader>
              <CardTitle>{t('api.keys')}</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedProject ? (
                <p className="text-center py-8 text-gray-500">Select a project to configure API keys</p>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="stripe-key">{t('admin.keys.stripe')}</Label>
                    <Input
                      id="stripe-key"
                      type="password"
                      value={stripeKey}
                      onChange={(e) => setStripeKey(e.target.value)}
                      placeholder="sk_test_..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gemini-key">{t('admin.keys.gemini')}</Label>
                    <Input
                      id="gemini-key"
                      type="password"
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="AI-..."
                    />
                  </div>
                  
                  <Button 
                    onClick={handleSaveKeys} 
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? 'Saving...' : t('admin.keys.save')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Admin;
