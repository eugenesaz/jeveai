import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { uploadProjectImage, testBucketAccess, uploadKnowledgeDocument } from '@/lib/StorageUtils';
import { Project, ProjectKnowledge } from '@/types/supabase';
import { Textarea } from '@/components/ui/textarea';

const EditProject = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState('');
  const [urlName, setUrlName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [colorScheme, setColorScheme] = useState<'blue' | 'red' | 'orange' | 'green'>('blue');
  const [landingImage, setLandingImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [telegramBot, setTelegramBot] = useState('');
  const [knowledge, setKnowledge] = useState('');
  const [existingKnowledge, setExistingKnowledge] = useState<ProjectKnowledge[]>([]);
  const [knowledgeDocuments, setKnowledgeDocuments] = useState<File[]>([]);

  const colorOptions = [
    { value: 'blue', label: t('influencer.project.blue', 'Blue'), className: 'text-blue-600' },
    { value: 'red', label: t('influencer.project.red', 'Red'), className: 'text-red-600' },
    { value: 'orange', label: t('influencer.project.orange', 'Orange'), className: 'text-orange-600' },
    { value: 'green', label: t('influencer.project.green', 'Green'), className: 'text-green-600' },
    { value: 'purple', label: t('influencer.project.purple', 'Purple'), className: 'text-purple-600' },
    { value: 'teal', label: t('influencer.project.teal', 'Teal'), className: 'text-teal-600' },
    { value: 'yellow', label: t('influencer.project.yellow', 'Yellow'), className: 'text-yellow-600' },
  ];

  const handleColorSchemeChange = (value: string) => {
    if (colorOptions.some((c) => c.value === value)) {
      setColorScheme(value as any);
    }
  };

  useEffect(() => {
    const fetchProject = async () => {
      if (!user || !id) return;

      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (error) {
          toast({
            title: 'Error',
            description: 'Failed to load project',
            variant: 'destructive',
          });
          navigate('/projects');
          return;
        }

        if (!data) {
          toast({
            title: 'Error',
            description: 'Project not found',
            variant: 'destructive',
          });
          navigate('/projects');
          return;
        }

        const validColorScheme = (data.color_scheme === 'blue' || 
                                 data.color_scheme === 'red' || 
                                 data.color_scheme === 'orange' || 
                                 data.color_scheme === 'green') 
                                 ? data.color_scheme as 'blue' | 'red' | 'orange' | 'green'
                                 : 'blue';

        const projectData = data as any;

        const typedProject: Project = {
          id: data.id,
          name: data.name,
          url_name: data.url_name,
          status: data.status,
          landing_image: data.landing_image,
          user_id: data.user_id,
          created_at: data.created_at,
          color_scheme: validColorScheme,
          telegram_bot: data.telegram_bot || null,
          description: projectData.description || null,
        };
        
        setProject(typedProject);
        setProjectName(data.name);
        setUrlName(data.url_name);
        setIsActive(data.status || false);
        setColorScheme(validColorScheme);
        setTelegramBot(typedProject.telegram_bot || '');
        
        if (data.landing_image) {
          setImagePreview(data.landing_image);
        }

        const { data: knowledgeData } = await supabase
          .from('project_knowledge')
          .select('*')
          .eq('project_id', id)
          .order('created_at', { ascending: false });

        if (knowledgeData && knowledgeData.length > 0) {
          setExistingKnowledge(knowledgeData);
          const textKnowledge = knowledgeData.find(k => !k.document_url);
          if (textKnowledge) {
            setKnowledge(textKnowledge.content);
          }
        }
      } catch (error) {
        console.error('Error fetching project:', error);
        toast({
          title: 'Error',
          description: 'Failed to load project',
          variant: 'destructive',
        });
        navigate('/projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [user, id, navigate, t]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLandingImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

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

  const validateUrlName = async (url: string) => {
    if (!url) return t('errors.required');
    if (!/^[a-zA-Z0-9-_]+$/.test(url)) return 'URL can only contain letters, numbers, dashes, and underscores';
    
    if (project && url === project.url_name) return '';
    
    const { data } = await supabase
      .from('projects')
      .select('url_name')
      .eq('url_name', url)
      .single();
    
    if (data) return t('errors.uniqueUrlName');
    return '';
  };

  const handleUrlNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setUrlName(url);
    const error = await validateUrlName(url);
    setUrlError(error);
  };

  const uploadKnowledgeDocuments = async (projectId: string) => {
    if (knowledgeDocuments.length === 0) return [];
    
    console.log(`Processing ${knowledgeDocuments.length} knowledge documents for project ${projectId}`);
    
    const uploadResults = await Promise.all(
      knowledgeDocuments.map(async (file) => {
        try {
          return await uploadKnowledgeDocument(file, projectId);
        } catch (error) {
          console.error(`Error uploading document ${file.name}:`, error);
          return null;
        }
      })
    );
    
    return uploadResults.filter(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    
    if (!projectName) {
      toast({
        title: 'Error',
        description: t('errors.required'),
        variant: 'destructive',
      });
      return;
    }

    const urlValidation = await validateUrlName(urlName);
    if (urlValidation) {
      setUrlError(urlValidation);
      return;
    }

    setSaving(true);

    try {
      let landingImageUrl = project?.landing_image || '';

      if (landingImage) {
        setUploadingImage(true);
        
        const hasAccess = await testBucketAccess('project-images');
        
        if (!hasAccess) {
          console.error('Project-images bucket not accessible.');
          toast({
            title: 'Warning',
            description: 'Storage bucket not available. Contact support.',
            variant: 'destructive',
          });
          setUploadingImage(false);
          setSaving(false);
          return;
        }

        const uploadedUrl = await uploadProjectImage(landingImage, user.id);
        
        if (uploadedUrl) {
          landingImageUrl = uploadedUrl;
          console.log('Image uploaded successfully. URL:', landingImageUrl);
        } else {
          console.error('Image upload failed during edit');
          toast({
            title: 'Warning',
            description: 'Image upload failed. Project will be updated without changing the image.',
            variant: 'destructive',
          });
        }
        
        setUploadingImage(false);
      }

      console.log('Updating project with data:', {
        name: projectName,
        url_name: urlName,
        status: isActive,
        color_scheme: colorScheme,
        landing_image: landingImageUrl,
        telegram_bot: telegramBot || null,
      });

      const { error: updateError } = await supabase
        .from('projects')
        .update({
          name: projectName,
          url_name: urlName,
          status: isActive,
          color_scheme: colorScheme,
          landing_image: landingImageUrl,
          telegram_bot: telegramBot || null,
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      if (knowledge) {
        const latestKnowledge = existingKnowledge.find(k => !k.document_url);
        if (!latestKnowledge || latestKnowledge.content !== knowledge) {
          const { error: knowledgeError } = await supabase.from('project_knowledge').insert({
            project_id: id,
            content: knowledge,
          });

          if (knowledgeError) {
            console.error('Error creating knowledge:', knowledgeError);
          }
        }
      }

      if (knowledgeDocuments.length > 0) {
        const documents = await uploadKnowledgeDocuments(id);
        
        for (const doc of documents) {
          if (doc) {
            await supabase.from('project_knowledge').insert({
              project_id: id,
              content: `Document: ${doc.fileName}`,
              document_url: doc.url,
            });
          }
        }
      }

      toast({
        title: 'Success',
        description: t('success.projectUpdated'),
      });

      navigate('/projects');
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to update project. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner size="lg" className="mb-4" />
          <p>{t('loading', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50">
      <header className="bg-white/70 shadow-sm backdrop-blur">
        <div className="container mx-auto p-6 flex justify-between items-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{t('edit_project.title', 'Edit Project')}</h1>
          <Button variant="ghost" onClick={() => navigate('/projects')}>
            {t('cancel', 'Cancel')}
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-10">
        <Card className="max-w-3xl mx-auto border-none shadow-xl glass-morphism">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl font-bold mb-0">
              {t('edit_project.heading', 'Edit Project Details')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="projectName">{t('edit_project.name', 'Project Name')}</Label>
                  <Input
                    id="projectName"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder={t('edit_project.name_placeholder', 'My Awesome Project')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="urlName">{t('edit_project.url_name', 'URL Name')}</Label>
                  <Input
                    id="urlName"
                    value={urlName}
                    onChange={handleUrlNameChange}
                    placeholder={t('edit_project.url_name_placeholder', 'my-awesome-project')}
                    required
                  />
                  {urlError && <p className="text-sm text-red-500">{urlError}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectStatus">{t('edit_project.status', 'Project Status')}</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <span className="text-sm text-gray-500 ml-2">
                    {isActive ? t('edit_project.active', 'Active') : t('edit_project.inactive', 'Inactive')}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('edit_project.color_scheme', 'Color Scheme')}</Label>
                <RadioGroup 
                  value={colorScheme} 
                  onValueChange={handleColorSchemeChange}
                  className="flex flex-wrap gap-4"
                >
                  {colorOptions.map((color) => (
                    <div className="flex items-center space-x-2" key={color.value}>
                      <RadioGroupItem value={color.value} id={color.value} />
                      <Label htmlFor={color.value} className={color.className}>{color.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telegramBot">{t('edit_project.telegram_bot', 'Knowledge Telegram Bot Name')}</Label>
                <Input
                  id="telegramBot"
                  value={telegramBot}
                  onChange={(e) => setTelegramBot(e.target.value)}
                  placeholder={t('edit_project.telegram_bot_placeholder', 'your_bot_name (without @)')}
                />
                <p className="text-xs text-gray-500">{t('edit_project.telegram_bot_hint', 'Bot name can include letters, numbers, and underscores')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="knowledge">{t('edit_project.knowledge', 'Project Knowledge')}</Label>
                <Textarea
                  id="knowledge"
                  value={knowledge}
                  onChange={(e) => setKnowledge(e.target.value)}
                  placeholder={t('edit_project.knowledge_placeholder', 'Enter knowledge information for your project')}
                  rows={5}
                />
                <p className="text-xs text-gray-500">{t('edit_project.knowledge_hint', 'This will help your users understand your project better')}</p>
              </div>

              {existingKnowledge.filter(k => k.document_url).length > 0 && (
                <div className="space-y-2">
                  <Label>{t('edit_project.existing_docs', 'Existing Knowledge Documents')}</Label>
                  <div className="space-y-2">
                    {existingKnowledge
                      .filter(k => k.document_url)
                      .map((doc, index) => (
                        <div 
                          key={index} 
                          className="flex justify-between items-center bg-gray-100 p-2 rounded"
                        >
                          <a 
                            href={doc.document_url || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {doc.content.replace('Document: ', '')}
                          </a>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="knowledgeDocuments">{t('edit_project.add_docs', 'Add Knowledge Documents')}</Label>
                <Input
                  id="knowledgeDocuments"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={handleKnowledgeDocumentsChange}
                  className="cursor-pointer"
                  multiple
                  disabled={knowledgeDocuments.length >= 5}
                />
                <p className="text-xs text-gray-500">{t('edit_project.docs_hint', 'Upload up to 5 additional documents to attach to your project knowledge')}</p>
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
                          {t('edit_project.remove', 'Remove')}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="landingImage">{t('edit_project.landing_image', 'Landing Image')}</Label>
                <Input
                  id="landingImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cursor-pointer"
                />
                {imagePreview && (
                  <div className="mt-2 relative w-full h-40 overflow-hidden rounded-xl border">
                    <img 
                      src={imagePreview} 
                      alt={t('edit_project.landing_image_preview', 'Landing page preview')}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-3 right-3"
                      onClick={() => {
                        setLandingImage(null);
                        setImagePreview(project?.landing_image || null);
                      }}
                    >
                      {t('edit_project.remove', 'Remove')}
                    </Button>
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary text-white font-bold py-3"
                disabled={saving}
              >
                {saving ? (
                  <div className="flex items-center justify-center">
                    <Spinner className="h-5 w-5 mr-2" />
                    <span>{t('edit_project.saving', 'Updating Project...')}</span>
                  </div>
                ) : (
                  t('edit_project.save', 'Save Changes')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EditProject;
