import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { uploadFile, createBucket, testBucketAccess } from '@/lib/StorageUtils';

const CreateProject = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projectName, setProjectName] = useState('');
  const [urlName, setUrlName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [colorScheme, setColorScheme] = useState<'blue' | 'red' | 'orange' | 'green'>('blue');
  const [landingImage, setLandingImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [urlError, setUrlError] = useState('');

  const handleColorSchemeChange = (value: string) => {
    if (value === 'blue' || value === 'red' || value === 'orange' || value === 'green') {
      setColorScheme(value);
    }
  };

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
    if (!user) return;
    
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

    setLoading(true);
    let landingImageUrl = '';

    try {
      // Handle image upload if an image was selected
      if (landingImage) {
        setUploadingImage(true);
        
        // Check bucket access first
        const hasAccess = await testBucketAccess('project-images');
        
        if (!hasAccess) {
          console.log('Creating project-images bucket...');
          await createBucket('project-images');
        }

        const fileExt = landingImage.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        console.log('Uploading project image:', filePath);
        
        const uploadedUrl = await uploadFile('project-images', filePath, landingImage);
        
        if (uploadedUrl) {
          landingImageUrl = uploadedUrl;
          console.log('Image uploaded successfully. URL:', landingImageUrl);
        } else {
          console.error('Image upload failed');
          toast({
            title: 'Warning',
            description: 'Image upload failed. Project will be created without an image.',
            variant: 'destructive',
          });
        }
        
        setUploadingImage(false);
      }

      console.log('Creating project with data:', {
        name: projectName,
        url_name: urlName,
        status: isActive,
        color_scheme: colorScheme,
        landing_image: landingImageUrl,
        user_id: user.id
      });

      const { error: insertError } = await supabase.from('projects').insert({
        name: projectName,
        url_name: urlName,
        status: isActive,
        color_scheme: colorScheme,
        landing_image: landingImageUrl,
        user_id: user.id,
      });

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      toast({
        title: 'Success',
        description: t('success.projectCreated'),
      });

      navigate('/projects');
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to create project. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('influencer.project.createNew')}</h1>
          <Button variant="ghost" onClick={() => navigate('/projects')}>
            {t('cancel')}
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>{t('influencer.project.createNew')}</CardTitle>
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
                  defaultValue="blue" 
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
                        setImagePreview(null);
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
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Spinner className="h-5 w-5 mr-2" />
                    <span>Creating Project...</span>
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

export default CreateProject;
