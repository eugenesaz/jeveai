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
import { checkBucketAccess } from '@/lib/StorageUtils';
import { Project } from '@/types/supabase';

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
  const [urlError, setUrlError] = useState('');

  const handleColorSchemeChange = (value: string) => {
    if (value === 'blue' || value === 'red' || value === 'orange' || value === 'green') {
      setColorScheme(value);
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

        const typedProject: Project = {
          ...data,
          color_scheme: validColorScheme
        };
        
        setProject(typedProject);
        setProjectName(data.name);
        setUrlName(data.url_name);
        setIsActive(data.status);
        setColorScheme(validColorScheme);
        
        if (data.landing_image) {
          setImagePreview(data.landing_image);
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
        const bucketAccessible = await checkBucketAccess('project-images');
        
        if (!bucketAccessible) {
          const { error: createBucketError } = await supabase.storage
            .createBucket('project-images', { public: true });
          
          if (createBucketError) {
            console.error('Error creating bucket on-demand:', createBucketError);
            toast({
              title: 'Warning',
              description: 'Could not access image storage. Project will be updated without changing the image.',
            });
          }
        }

        const fileExt = landingImage.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        console.log('Uploading image:', filePath);
        
        try {
          const { error: uploadError, data } = await supabase.storage
            .from('project-images')
            .upload(filePath, landingImage);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            toast({
              title: 'Warning',
              description: 'Image upload failed. Project will be updated without changing the image.',
            });
          } else {
            console.log('Upload successful:', data);
            
            const { data: { publicUrl } } = supabase.storage
              .from('project-images')
              .getPublicUrl(filePath);
              
            landingImageUrl = publicUrl;
          }
        } catch (uploadError) {
          console.error('Upload exception:', uploadError);
          toast({
            title: 'Warning',
            description: 'Image upload failed. Project will be updated without changing the image.',
          });
        }
      }

      console.log('Updating project with data:', {
        name: projectName,
        url_name: urlName,
        status: isActive,
        color_scheme: colorScheme,
        landing_image: landingImageUrl,
      });

      const { error: updateError } = await supabase
        .from('projects')
        .update({
          name: projectName,
          url_name: urlName,
          status: isActive,
          color_scheme: colorScheme,
          landing_image: landingImageUrl,
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
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
          <p>{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('influencer.project.edit')}</h1>
          <Button variant="ghost" onClick={() => navigate('/projects')}>
            {t('cancel')}
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>{t('influencer.project.edit')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="projectName">{t('influencer.project.name')}</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="My Awesome Project"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="urlName">{t('influencer.project.urlName')}</Label>
                <Input
                  id="urlName"
                  value={urlName}
                  onChange={handleUrlNameChange}
                  placeholder="my-awesome-project"
                  required
                />
                {urlError && <p className="text-sm text-red-500">{urlError}</p>}
                <p className="text-sm text-gray-500">
                  {window.location.origin}/{urlName || 'your-url-name'}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="isActive">{t('influencer.project.status')}</Label>
                <span className="text-sm text-gray-500 ml-2">
                  {isActive ? t('influencer.project.active') : t('influencer.project.inactive')}
                </span>
              </div>

              <div className="space-y-2">
                <Label>{t('influencer.project.colorScheme')}</Label>
                <RadioGroup 
                  value={colorScheme} 
                  onValueChange={handleColorSchemeChange}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="blue" id="blue" />
                    <Label htmlFor="blue" className="text-blue-600">{t('influencer.project.blue')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="red" id="red" />
                    <Label htmlFor="red" className="text-red-600">{t('influencer.project.red')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="orange" id="orange" />
                    <Label htmlFor="orange" className="text-orange-600">{t('influencer.project.orange')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="green" id="green" />
                    <Label htmlFor="green" className="text-green-600">{t('influencer.project.green')}</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="landingImage">{t('influencer.project.landingImage')}</Label>
                <Input
                  id="landingImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cursor-pointer"
                />
                {imagePreview && (
                  <div className="mt-2 relative w-full h-40 overflow-hidden rounded border">
                    <img 
                      src={imagePreview} 
                      alt="Landing page preview" 
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setLandingImage(null);
                        setImagePreview(project?.landing_image || null);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={saving}
              >
                {saving ? (
                  <div className="flex items-center justify-center">
                    <Spinner className="h-5 w-5 mr-2" />
                    <span>Updating Project...</span>
                  </div>
                ) : (
                  t('influencer.project.save')
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
