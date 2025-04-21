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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ProfileButton } from '@/components/profile/ProfileButton';
import { 
  initializeStorage,
  uploadKnowledgeDocument
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

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !id) return;

      try {
        await initializeStorage();
        console.log('Storage initialized');
        
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

        const typedProject: Project = {
          ...projectData,
          color_scheme: validColorScheme,
          telegram_bot: projectData.telegram_bot || null,
        };
        
        setProject(typedProject);

        const { data: knowledgeData, error: knowledgeError } = await supabase
          .from('project_knowledge')
          .select('*')
          .eq('project_id', id)
          .order('created_at', { ascending: false });

        if (knowledgeError) {
          console.error('Error fetching knowledge:', knowledgeError);
          toast({
            title: 'Error',
            description: 'Failed to load project knowledge',
            variant: 'destructive',
          });
        } else if (knowledgeData) {
          setKnowledge(knowledgeData);
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
    
    const uploadResults = await Promise.all(
      knowledgeDocuments.map(async (file) => {
        try {
          const result = await uploadKnowledgeDocument(file, projectId);
          console.log("Document upload result:", result);
          return result;
        } catch (error) {
          console.error(`Exception uploading document ${file.name}:`, error);
          return null;
        }
      })
    );
    
    const successfulUploads = uploadResults.filter(Boolean);
    console.log(`Successfully uploaded ${successfulUploads.length} of ${knowledgeDocuments.length} documents`);
    
    return successfulUploads;
  };

  const handleAddKnowledge = async () => {
    if (!user || !id || (!newKnowledgeContent.trim() && knowledgeDocuments.length === 0)) {
      return;
    }

    setSaving(true);
    try {
      if (newKnowledgeContent.trim()) {
        const { error } = await supabase.from('project_knowledge').insert({
          project_id: id,
          content: newKnowledgeContent.trim(),
        });

        if (error) {
          console.error('Error creating text knowledge:', error);
          throw error;
        }
      }

      if (knowledgeDocuments.length > 0) {
        console.log(`Processing ${knowledgeDocuments.length} knowledge documents`);
        const documents = await uploadKnowledgeDocuments(id);
        console.log(`Received ${documents.length} upload results`);
        
        for (const doc of documents) {
          if (doc) {
            console.log(`Creating database entry for document: ${doc.fileName}`);
            const { error } = await supabase.from('project_knowledge').insert({
              project_id: id,
              content: `Document: ${doc.fileName}`,
              document_url: doc.url,
            });

            if (error) {
              console.error('Error creating document knowledge entry:', error);
            } else {
              console.log(`Successfully created knowledge entry for document: ${doc.fileName}`);
            }
          }
        }
      }

      const { data, error } = await supabase
        .from('project_knowledge')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching updated knowledge:', error);
      } else if (data) {
        setKnowledge(data);
      }

      setNewKnowledgeContent('');
      setKnowledgeDocuments([]);
      setIsAddingKnowledge(false);

      toast({
        title: 'Success',
        description: 'Knowledge added successfully',
      });
    } catch (error) {
      console.error('Error adding knowledge:', error);
      toast({
        title: 'Error',
        description: 'Failed to add knowledge',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKnowledge = async (knowledgeId: string) => {
    if (!user || !id) return;

    setDeleting(knowledgeId);
    try {
      const { error } = await supabase
        .from('project_knowledge')
        .delete()
        .eq('id', knowledgeId)
        .eq('project_id', id);

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
                          {item.document_url ? (
                            <div className="flex flex-col">
                              <div className="flex items-center mb-2">
                                <FileText className="h-5 w-5 mr-2 text-blue-500" />
                                <span className="font-medium">
                                  {item.content.replace('Document: ', '')}
                                </span>
                              </div>
                              <div className="flex space-x-2">
                                <a
                                  href={item.document_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  {t('view', { defaultValue: 'View' })}
                                </a>
                                <a
                                  href={item.document_url}
                                  download
                                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  {t('download', { defaultValue: 'Download' })}
                                </a>
                              </div>
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
                          disabled={deleting === item.id}
                          aria-label={t('delete', { defaultValue: 'Delete' })}
                        >
                          {deleting === item.id ? (
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
                {bucketStatus && ` Bucket status: ${bucketStatus}`}
              </p>
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
