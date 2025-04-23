import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Check, ChevronLeft, Save, FileImage, Copy, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useBotNameValidator } from '@/hooks/useBotNameValidator';

// Define the allowed color schemes explicitly
type ColorScheme = 'blue' | 'red' | 'orange' | 'green' | 'purple' | 'indigo' | 'pink' | 'teal';

const EditProject = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { botNameError, validateBotName } = useBotNameValidator();
  
  // Project fields
  const [projectName, setProjectName] = useState('');
  const [urlName, setUrlName] = useState('');
  const [originalUrlName, setOriginalUrlName] = useState('');
  const [telegramBot, setTelegramBot] = useState('');
  const [originalTelegramBot, setOriginalTelegramBot] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [colorScheme, setColorScheme] = useState<ColorScheme>('blue');
  
  // Image handling
  const [landingImage, setLandingImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const fetchProject = async () => {
      if (!user || !id) return;
      
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) {
          console.error('Error fetching project:', error);
          toast.error(t('errors.projectNotFound', 'Project not found'));
          navigate('/projects');
          return;
        }
        
        // Verify if user is the owner of the project
        if (data.user_id !== user.id) {
          toast.error(t('errors.notAuthorized', 'You are not authorized to edit this project'));
          navigate('/projects');
          return;
        }
        
        setProjectName(data.name);
        setUrlName(data.url_name);
        setOriginalUrlName(data.url_name);
        setTelegramBot(data.telegram_bot || '');
        setOriginalTelegramBot(data.telegram_bot || '');
        setIsActive(data.status);
        // Make sure to cast the color_scheme to the ColorScheme type
        // and provide a fallback if it's not one of the expected values
        setColorScheme((data.color_scheme as ColorScheme) || 'blue');
        setLandingImage(data.landing_image);
        
      } catch (error) {
        console.error('Error:', error);
        toast.error(t('errors.generic', 'An error occurred'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchProject();
  }, [user, id, navigate, t]);
  
  const handleUrlNameChange = (value: string) => {
    // Replace spaces with underscores, remove special characters, and convert to lowercase
    const formattedValue = value
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .toLowerCase();
    
    setUrlName(formattedValue);
  };
  
  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create a preview of the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setLandingImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !id) return;
    setSaving(true);
    
    try {
      // Validate URL name format
      if (!/^[a-z0-9_]+$/.test(urlName)) {
        toast.error(t('errors.invalidUrlName', 'Invalid URL name format. Use only lowercase letters, numbers, and underscores.'));
        setSaving(false);
        return;
      }
      
      // Check if URL name is already taken (only if it has changed)
      if (urlName !== originalUrlName) {
        const { data: existingProject, error: urlCheckError } = await supabase
          .from('projects')
          .select('id')
          .eq('url_name', urlName)
          .single();
          
        if (!urlCheckError && existingProject) {
          toast.error(t('errors.urlNameTaken', 'This URL name is already taken. Please choose another one.'));
          setSaving(false);
          return;
        }
      }
      
      // Validate Telegram bot name if provided
      if (telegramBot && telegramBot !== originalTelegramBot) {
        const error = await validateBotName(telegramBot, originalTelegramBot);
        if (error) {
          setSaving(false);
          return;
        }
      }
      
      // Upload new image if selected
      let imageUrl = landingImage;
      if (imageFile) {
        const filename = `${user.id}/${Date.now().toString(36)}_${Math.random().toString(36).substring(2)}_${imageFile.name.replace(/\s+/g, '_')}`;
        
        const { data: storageData, error: storageError } = await supabase.storage
          .from('project-images')
          .upload(filename, imageFile);
          
        if (storageError) {
          throw storageError;
        }
        
        const { data: publicUrlData } = supabase.storage
          .from('project-images')
          .getPublicUrl(filename);
          
        imageUrl = publicUrlData.publicUrl;
      }
      
      // Update project
      const { error } = await supabase
        .from('projects')
        .update({
          name: projectName,
          url_name: urlName,
          status: isActive,
          telegram_bot: telegramBot || null,
          color_scheme: colorScheme, // Now this is properly typed
          landing_image: imageUrl,
        })
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      toast.success(t('success.projectUpdated', 'Project updated successfully'));
      navigate('/projects');
      
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error(t('errors.updateFailed', 'Failed to update project. Please try again.'));
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>{t('loading')}</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('influencer.project.edit', 'Edit Project')}</h1>
          <Button variant="ghost" onClick={() => navigate('/projects')} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t('go.back', 'Go Back')}
          </Button>
        </div>
      </header>
      
      <main className="container mx-auto py-8 px-4">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>{t('influencer.project.edit', 'Edit Project')}</CardTitle>
            <CardDescription>
              {t('influencer.project.editDescription', 'Update your project details and settings')}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="projectName">{t('influencer.project.name')}</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder={t('influencer.project.namePlaceholder', 'Enter project name')}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="urlName">{t('influencer.project.urlName')}</Label>
                <div className="flex items-center space-x-2">
                  <div className="bg-gray-100 px-3 py-2 rounded-l-md border border-r-0 text-gray-500">
                    {window.location.origin}/
                  </div>
                  <Input
                    id="urlName"
                    value={urlName}
                    onChange={(e) => handleUrlNameChange(e.target.value)}
                    className="rounded-l-none"
                    placeholder="my-project"
                    required
                  />
                </div>
                <p className="text-sm text-gray-500">
                  {t('influencer.project.urlNameHint', 'Use only lowercase letters, numbers, and underscores')}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telegramBot">{t('influencer.project.telegramBot')}</Label>
                <Input
                  id="telegramBot"
                  value={telegramBot}
                  onChange={(e) => setTelegramBot(e.target.value)}
                  placeholder="your_bot_name"
                />
                {botNameError && <p className="text-sm text-red-500">{botNameError}</p>}
                <p className="text-sm text-gray-500">
                  {t('influencer.project.telegramBotHint', 'Optional: Add a Telegram bot for this project')}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>{t('influencer.project.colorScheme')}</Label>
                <RadioGroup
                  value={colorScheme}
                  onValueChange={(value) => setColorScheme(value as typeof colorScheme)}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                >
                  <Label
                    htmlFor="blue"
                    className={`flex items-center justify-between rounded-md border-2 p-4 cursor-pointer ${
                      colorScheme === 'blue' ? 'border-blue-500' : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-500"></div>
                      <span>{t('colors.blue')}</span>
                    </div>
                    <RadioGroupItem value="blue" id="blue" className="sr-only" />
                    {colorScheme === 'blue' && <Check className="w-5 h-5 text-blue-500" />}
                  </Label>
                  
                  <Label
                    htmlFor="red"
                    className={`flex items-center justify-between rounded-md border-2 p-4 cursor-pointer ${
                      colorScheme === 'red' ? 'border-red-500' : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-red-500"></div>
                      <span>{t('colors.red')}</span>
                    </div>
                    <RadioGroupItem value="red" id="red" className="sr-only" />
                    {colorScheme === 'red' && <Check className="w-5 h-5 text-red-500" />}
                  </Label>
                  
                  <Label
                    htmlFor="green"
                    className={`flex items-center justify-between rounded-md border-2 p-4 cursor-pointer ${
                      colorScheme === 'green' ? 'border-green-500' : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-green-500"></div>
                      <span>{t('colors.green')}</span>
                    </div>
                    <RadioGroupItem value="green" id="green" className="sr-only" />
                    {colorScheme === 'green' && <Check className="w-5 h-5 text-green-500" />}
                  </Label>
                  
                  <Label
                    htmlFor="orange"
                    className={`flex items-center justify-between rounded-md border-2 p-4 cursor-pointer ${
                      colorScheme === 'orange' ? 'border-orange-500' : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-orange-500"></div>
                      <span>{t('colors.orange')}</span>
                    </div>
                    <RadioGroupItem value="orange" id="orange" className="sr-only" />
                    {colorScheme === 'orange' && <Check className="w-5 h-5 text-orange-500" />}
                  </Label>
                  
                  <Label
                    htmlFor="purple"
                    className={`flex items-center justify-between rounded-md border-2 p-4 cursor-pointer ${
                      colorScheme === 'purple' ? 'border-purple-500' : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-purple-500"></div>
                      <span>{t('colors.purple', 'Purple')}</span>
                    </div>
                    <RadioGroupItem value="purple" id="purple" className="sr-only" />
                    {colorScheme === 'purple' && <Check className="w-5 h-5 text-purple-500" />}
                  </Label>
                  
                  <Label
                    htmlFor="indigo"
                    className={`flex items-center justify-between rounded-md border-2 p-4 cursor-pointer ${
                      colorScheme === 'indigo' ? 'border-indigo-500' : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-indigo-500"></div>
                      <span>{t('colors.indigo', 'Indigo')}</span>
                    </div>
                    <RadioGroupItem value="indigo" id="indigo" className="sr-only" />
                    {colorScheme === 'indigo' && <Check className="w-5 h-5 text-indigo-500" />}
                  </Label>
                  
                  <Label
                    htmlFor="pink"
                    className={`flex items-center justify-between rounded-md border-2 p-4 cursor-pointer ${
                      colorScheme === 'pink' ? 'border-pink-500' : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-pink-500"></div>
                      <span>{t('colors.pink', 'Pink')}</span>
                    </div>
                    <RadioGroupItem value="pink" id="pink" className="sr-only" />
                    {colorScheme === 'pink' && <Check className="w-5 h-5 text-pink-500" />}
                  </Label>
                  
                  <Label
                    htmlFor="teal"
                    className={`flex items-center justify-between rounded-md border-2 p-4 cursor-pointer ${
                      colorScheme === 'teal' ? 'border-teal-500' : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-teal-500"></div>
                      <span>{t('colors.teal', 'Teal')}</span>
                    </div>
                    <RadioGroupItem value="teal" id="teal" className="sr-only" />
                    {colorScheme === 'teal' && <Check className="w-5 h-5 text-teal-500" />}
                  </Label>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label>{t('influencer.project.landingImage')}</Label>
                <div 
                  onClick={handleImageClick}
                  className="border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  
                  {landingImage ? (
                    <div className="relative w-full">
                      <img 
                        src={landingImage} 
                        alt="Landing page preview" 
                        className="rounded-md max-h-64 mx-auto object-contain"
                      />
                      <div className="mt-2 text-center text-sm text-gray-500">
                        {t('influencer.project.clickToChangeImage')}
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 flex flex-col items-center text-gray-500">
                      <FileImage className="w-12 h-12 mb-2" />
                      <p className="text-center">
                        {t('influencer.project.dropImageHere')}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        {t('influencer.project.orClickToSelect')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="isActive">{t('influencer.project.isActive')}</Label>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/projects')}
              >
                {t('cancel', 'Cancel')}
              </Button>
              <Button
                type="submit"
                disabled={saving || !!botNameError}
                className="flex items-center gap-2"
              >
                {/* Use allowed icon */}
                <ArrowRight className="w-4 h-4" /> 
                {saving ? t('saving', 'Saving...') : t('save', 'Save')}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default EditProject;
