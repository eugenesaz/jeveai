import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { FileImage, ArrowLeft, ArrowRight, Check, Plus } from 'lucide-react';
import { useBotNameValidator } from '@/hooks/useBotNameValidator';

// Define the allowed color schemes explicitly
type ColorScheme = 'blue' | 'red' | 'orange' | 'green' | 'purple' | 'indigo' | 'pink' | 'teal';

const CreateProject = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { botNameError, validateBotName } = useBotNameValidator();

  const [projectName, setProjectName] = useState('');
  const [urlName, setUrlName] = useState('');
  const [telegramBot, setTelegramBot] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [colorScheme, setColorScheme] = useState<ColorScheme>('blue');
  const [landingImage, setLandingImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [urlNameExists, setUrlNameExists] = useState(false);

  const handleUrlNameChange = (value: string) => {
    // Replace spaces with underscores, remove special characters, and convert to lowercase
    const formattedValue = value
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .toLowerCase();
    setUrlName(formattedValue);
    
    // Reset the existing URL name error when changed
    setUrlNameExists(false);
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

  const checkUrlNameExists = async (urlNameToCheck: string): Promise<boolean> => {
    try {
      // Use the correct format for the query parameters
      const { data, error } = await supabase
        .from('projects')
        .select('id')
        .eq('url_name', urlNameToCheck)
        .limit(1);

      if (error) {
        console.error('Error checking URL name:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error in URL name check:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;
    setSaving(true);

    try {
      // Validate URL name format
      if (!/^[a-z0-9_]+$/.test(urlName)) {
        toast.error(t('errors.invalidUrlName', 'Invalid URL name format. Use only lowercase letters, numbers, and underscores.'));
        setSaving(false);
        return;
      }

      // Check if URL name is already taken
      const exists = await checkUrlNameExists(urlName);
      if (exists) {
        setUrlNameExists(true);
        toast.error(t('errors.urlNameTaken', 'This URL name is already taken. Please choose another one.'));
        setSaving(false);
        return;
      }

      // Validate Telegram bot name if provided
      if (telegramBot) {
        const error = await validateBotName(telegramBot, undefined);
        if (error) {
          setSaving(false);
          return;
        }
      }

      // Upload image if selected
      let imageUrl = null;
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

      // Create project with proper data structure
      const projectData = {
        name: projectName,
        url_name: urlName,
        status: isActive,
        telegram_bot: telegramBot || null,
        color_scheme: colorScheme,
        landing_image: imageUrl,
        user_id: user.id
      };

      // Log the project data for debugging
      console.log('Sending project data:', JSON.stringify(projectData));

      // Use the Supabase client to insert the project
      const { data, error } = await supabase
        .from('projects')
        .insert([projectData])
        .select();

      if (error) {
        console.error('Project creation error details:', error);
        throw error;
      }

      toast.success(t('success.projectCreated', 'Project created successfully'));
      navigate('/projects');
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast.error(t('errors.createFailed', 'Failed to create project. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('influencer.project.createNew', 'Add Project')}</h1>
          <Button variant="ghost" onClick={() => navigate('/projects')} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t('cancel', 'Cancel')}
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>{t('influencer.project.createNew', 'Add Project')}</CardTitle>
            <CardDescription>
              {t('influencer.project.createDescription', 'Fill in the details to create your new project')}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="projectName">{t('influencer.project.name')}</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
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
                    onChange={e => handleUrlNameChange(e.target.value)}
                    className={`rounded-l-none ${urlNameExists ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    placeholder="my-project"
                    required
                  />
                </div>
                {urlNameExists && (
                  <p className="text-sm text-red-500">
                    {t('errors.urlNameTaken', 'This URL name is already taken. Please choose another one.')}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  {t('influencer.project.urlNameHint', 'Use only lowercase letters, numbers, and underscores')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telegramBot">{t('influencer.project.telegramBot')}</Label>
                <Input
                  id="telegramBot"
                  value={telegramBot}
                  onChange={e => setTelegramBot(e.target.value)}
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
                  onValueChange={value => setColorScheme(value as ColorScheme)}
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
                disabled={saving || !!botNameError || urlNameExists}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    {t('saving', 'Saving...')}
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    {t('save', 'Save')}
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default CreateProject;
