import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { ProjectKnowledge, Project } from '@/types/supabase';
import { FileText, Trash2, Plus, Download, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ProfileButton } from '@/components/profile/ProfileButton';
import { addKnowledge, fetchProjectKnowledge } from '@/lib/KnowledgeUtils';
import { 
  initializeStorage,
  uploadKnowledgeDocument,
  testBucketAccess
} from '@/lib/StorageUtils';

const ManageKnowledge = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [project, setProject] = useState<Project | null>(null);
  const [knowledge, setKnowledge] = useState<ProjectKnowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [knowledgeDocuments, setKnowledgeDocuments] = useState<File[]>([]);
  const [isAddingKnowledge, setIsAddingKnowledge] = useState(false);
  const [newKnowledgeContent, setNewKnowledgeContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [bucketStatus, setBucketStatus] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !id) return;

      try {
        console.log('Initializing storage...');
        await initializeStorage();
        console.log('Storage initialized');
        
        // Check bucket access
        const hasAccess = await testBucketAccess('project-knowledge');
        setBucketStatus(hasAccess ? 'accessible' : 'inaccessible');
        
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (projectError) {
          toast({
            title: 'Error',
            description: 'Failed to load project',
            variant: 'destructive',
          });
          navigate('/projects');
          return;
        }

        if (!projectData) {
          toast({
            title: 'Error',
            description: t('errors.projectNotFound'),
            variant: 'destructive',
          });
          navigate('/projects');
          return;
        }

        const validColorScheme = (projectData.color_scheme === 'blue' || 
                               projectData.color_scheme === 'red' || 
                               projectData.color_scheme === 'orange' || 
                               projectData.color_scheme === 'green') 
                               ? projectData.color_scheme as 'blue' | 'red' | 'orange' | 'green'
                               : 'blue';
                               
        // Type assertion to access description
        const projectDataWithDesc = projectData as any;

        // Create a properly typed Project object with all required properties
        const typedProject: Project = {
          id: projectData.id,
          name: projectData.name,
          url_name: projectData.url_name,
          status: projectData.status,
          landing_image: projectData.landing_image,
          user_id: projectData.user_id,
          created_at: projectData.created_at,
          color_scheme: validColorScheme,
          telegram_bot: projectData.telegram_bot || null,
          description: projectDataWithDesc.description || null,
        };
        
        setProject(typedProject);

        // Fetch knowledge data
        try {
          console.log(`Fetching knowledge data for project ${id}`);
          const knowledgeData = await fetchProjectKnowledge(id);
          console.log('Knowledge data fetched:', knowledgeData);
          
          if (knowledgeData && knowledgeData.length > 0) {
            // Convert to ProjectKnowledge array with proper type casting
            const typedKnowledgeData: ProjectKnowledge[] = knowledgeData.map(item => ({
              id: item.id,
              content: item.content || '',
              created_at: item.created_at,
              metadata: item.metadata as ProjectKnowledge['metadata']
            }));
            setKnowledge(typedKnowledgeData);
            console.log('Knowledge data processed:', typedKnowledgeData);
          } else {
            console.log('No knowledge data found for this project');
            setKnowledge([]);
          }
        } catch (knowledgeError) {
          console.error('Error fetching knowledge:', knowledgeError);
          toast({
            title: 'Error',
            description: 'Failed to load project knowledge',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error loading project data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, id, navigate, t]);

  const handleKnowledgeDocumentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const limitedFiles = newFiles.slice(0, 5 - knowledgeDocuments.length);
      setKnowledgeDocuments(prev => [...prev, ...limitedFiles]);
    }
  };

  const removeKnowledgeDocument = (index: number) => {
    setKnowledgeDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const uploadKnowledgeDocuments = async (projectId: string) => {
    if (knowledgeDocuments.length === 0) return [];
    
    console.log(`Uploading ${knowledgeDocuments.length} knowledge documents for project ${projectId}`);
    setUploadStatus(`Starting upload of ${knowledgeDocuments.length} documents...`);
    
    const uploadResults = await Promise.all(
      knowledgeDocuments.map(async (file, index) => {
        try {
          setUploadStatus(`Uploading document ${index + 1}/${knowledgeDocuments.length}: ${file.name}...`);
          const result = await uploadKnowledgeDocument(file, projectId);
          console.log(`Document ${index + 1} upload result:`, result);
          return result;
        } catch (error: any) {
          console.error(`Exception uploading document ${file.name}:`, error);
          setUploadStatus(`Error uploading ${file.name}: ${error.message}`);
          return null;
        }
      })
    );
    
    const successfulUploads = uploadResults.filter(Boolean);
    console.log(`Successfully uploaded ${successfulUploads.length} of ${knowledgeDocuments.length} documents`);
    setUploadStatus(`Completed: ${successfulUploads.length}/${knowledgeDocuments.length} documents uploaded successfully.`);
    
    return successfulUploads;
  };

  const handleAddKnowledge = async () => {
    if (!user || !id || (!newKnowledgeContent.trim() && knowledgeDocuments.length === 0)) {
      return;
    }

    setSaving(true);
    try {
      if (newKnowledgeContent.trim()) {
        // Only using webhook to add knowledge, never direct insertion
        await addKnowledge(id, newKnowledgeContent.trim());
      }

      if (knowledgeDocuments.length > 0) {
        console.log(`Processing ${knowledgeDocuments.length} knowledge documents`);
        const documents = await uploadKnowledgeDocuments(id);
        console.log(`Received ${documents.length} upload results`);
        
        for (const doc of documents) {
          if (doc) {
            console.log(`Creating knowledge entry for document: ${doc.fileName}`);
            // Using webhook instead of direct insertion
            await addKnowledge(id, `Document: ${doc.fileName}`);
          }
        }
      }

      // Refresh the knowledge data
      const knowledgeData = await fetchProjectKnowledge(id);
      
      // Convert to ProjectKnowledge array with proper type casting
      if (knowledgeData) {
        const typedKnowledgeData: ProjectKnowledge[] = knowledgeData.map(item => ({
          id: item.id,
          content: item.content || '',
          created_at: item.created_at,
          metadata: item.metadata as ProjectKnowledge['metadata']
        }));
        setKnowledge(typedKnowledgeData);
      }

      setNewKnowledgeContent('');
      setKnowledgeDocuments([]);
      setIsAddingKnowledge(false);

      toast({
        title: 'Success',
        description: 'Knowledge added successfully',
      });
    } catch (error: any) {
      console.error('Error adding knowledge:', error);
      const errorMessage = error instanceof Error && error.message.includes('too long') 
        ? error.message 
        : "Failed to add knowledge. Please try again.";
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
      setUploadStatus('');
    }
  };

  const handleDeleteKnowledge = async (knowledgeId: number) => {
    if (!user || !id) return;

    setDeleting(knowledgeId.toString());
    try {
      // Updated to delete from project_knowledge_vector
      const { error } = await supabase
        .from('project_knowledge_vector')
        .delete()
        .eq('id', knowledgeId);

      if (error) {
        console.error('Error deleting knowledge:', error);
        throw error;
      }

      setKnowledge(prev => prev.filter(k => k.id !== knowledgeId));

      toast({
        title: 'Success',
        description: 'Knowledge entry deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting knowledge:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete knowledge entry',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner size="lg" className="mb-4" />
          <p>{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg font-semibold text-red-500">{t('errors.projectNotFound')}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate('/projects')}
          >
            {t('goBack')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">{t('project.manageKnowledge', { defaultValue: 'Manage Knowledge' })}</h1>
            <span className="text-gray-500">-</span>
            <span className="font-medium">{project?.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/projects')}>
              {t('goBack', { defaultValue: 'Go back' })}
            </Button>
            <ProfileButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('project.knowledge', { defaultValue: 'Knowledge' })}</CardTitle>
            <Button onClick={() => setIsAddingKnowledge(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('project.addKnowledge', { defaultValue: 'Add Knowledge' })}
            </Button>
          </CardHeader>
          <CardContent>
            {knowledge.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">{t('project.noKnowledge', { defaultValue: 'No knowledge entries yet.' })}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {knowledge.map((item) => (
                  <Card key={item.id} className="bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {item.content.startsWith('Document: ') ? (
                            <div className="flex items-center mb-2">
                              <FileText className="h-5 w-5 mr-2 text-blue-500" />
                              <span className="font-medium">
                                {item.content.replace('Document: ', '')}
                              </span>
                            </div>
                          ) : (
                            <div className="whitespace-pre-wrap">{item.content}</div>
                          )}
                          <div className="text-xs text-gray-500 mt-2">
                            {new Date(item.created_at).toLocaleString()}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteKnowledge(item.id)}
                          disabled={deleting === item.id.toString()}
                          aria-label={t('delete', { defaultValue: 'Delete' })}
                        >
                          {deleting === item.id.toString() ? (
                            <Spinner className="h-4 w-4" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={isAddingKnowledge} onOpenChange={setIsAddingKnowledge}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('project.addKnowledge', { defaultValue: 'Add Knowledge' })}</DialogTitle>
            <DialogDescription>
              Add text or document knowledge to your project. Storage bucket status: {bucketStatus}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Textarea
                placeholder={t('project.enterKnowledgeInfo', { defaultValue: 'Enter text knowledge here' })}
                value={newKnowledgeContent}
                onChange={(e) => setNewKnowledgeContent(e.target.value)}
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('project.orUploadDocuments', { defaultValue: 'Or upload documents' })}</p>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                onChange={handleKnowledgeDocumentsChange}
                className="cursor-pointer"
                multiple
                disabled={knowledgeDocuments.length >= 5}
              />
              <p className="text-xs text-gray-500">
                {t('project.uploadLimit', { defaultValue: 'You can upload up to 5 documents.' })}
              </p>
              {uploadStatus && (
                <p className="text-xs text-blue-600">
                  Upload status: {uploadStatus}
                </p>
              )}
              {knowledgeDocuments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {knowledgeDocuments.map((file, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-gray-100 p-2 rounded"
                    >
                      <span>{file.name}</span>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeKnowledgeDocument(index)}
                      >
                        {t('cancel', { defaultValue: 'Cancel' })}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewKnowledgeContent('');
                setKnowledgeDocuments([]);
                setIsAddingKnowledge(false);
              }}
            >
              {t('cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              onClick={handleAddKnowledge}
              disabled={saving || (!newKnowledgeContent.trim() && knowledgeDocuments.length === 0)}
            >
              {saving ? <Spinner className="mr-2 h-4 w-4" /> : null}
              {t('save', { defaultValue: 'Save' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageKnowledge;
