
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

// Initialize Supabase client
const supabaseUrl = 'https://your-supabase-url.supabase.co';
const supabaseAnonKey = 'your-supabase-anon-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  stripe_key?: string;
  gemini_key?: string;
}

const Admin = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
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

      try {
        const { data, error } = await supabase
          .from('admin')
          .select('*')
          .eq('username', 'Wizard')
          .single();

        if (error || !data) {
          // User is not an admin, redirect
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to access this page.',
            variant: 'destructive',
          });
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/');
      }
    };

    checkAdmin();
  }, [user, navigate]);

  // Fetch all influencers
  useEffect(() => {
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
  }, []);

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
          .select('id, name, url_name, status, stripe_key, gemini_key')
          .eq('user_id', selectedInfluencer);

        if (error) throw error;

        if (data) {
          setProjects(data as Project[]);
          if (data.length > 0) {
            setSelectedProject(data[0].id);
            setStripeKey(data[0].stripe_key || '');
            setGeminiKey(data[0].gemini_key || '');
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

  // Update keys when selecting a different project
  useEffect(() => {
    if (selectedProject) {
      const project = projects.find(p => p.id === selectedProject);
      if (project) {
        setStripeKey(project.stripe_key || '');
        setGeminiKey(project.gemini_key || '');
      }
    } else {
      setStripeKey('');
      setGeminiKey('');
    }
  }, [selectedProject, projects]);

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
      const { error } = await supabase
        .from('projects')
        .update({
          stripe_key: stripeKey,
          gemini_key: geminiKey,
        })
        .eq('id', selectedProject);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'API keys saved successfully',
      });

      // Update the local state
      setProjects(projects.map(project => 
        project.id === selectedProject 
          ? { ...project, stripe_key: stripeKey, gemini_key: geminiKey } 
          : project
      ));
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
