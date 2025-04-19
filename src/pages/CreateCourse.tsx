import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Project {
  id: string;
  name: string;
}

const CreateCourse = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  
  const [courseName, setCourseName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [courseType, setCourseType] = useState('diet');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('0');
  const [isRecurring, setIsRecurring] = useState(false);
  const [details, setDetails] = useState('');
  const [telegramBot, setTelegramBot] = useState('');
  const [loading, setLoading] = useState(false);
  const [botNameError, setBotNameError] = useState('');

  // Fetch user's projects
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name')
          .eq('user_id', user.id)
          .eq('status', true);

        if (error) throw error;

        if (data && data.length > 0) {
          setProjects(data);
          setSelectedProject(data[0].id); // Select first project by default
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, [user]);

  const validateBotName = async (name: string) => {
    if (!name) return '';
    // Modified regex to allow @ symbol in bot names
    if (!/^[a-zA-Z0-9_@]+$/.test(name)) return 'Bot name can only contain letters, numbers, underscores, and @ symbol';
    
    // Check if bot name is already taken
    const { data } = await supabase
      .from('courses')
      .select('telegram_bot')
      .eq('telegram_bot', name)
      .single();
    
    if (data) return t('errors.uniqueBotName');
    return '';
  };

  const handleBotNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setTelegramBot(name);
    const error = await validateBotName(name);
    setBotNameError(error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProject) return;
    
    // Validate form
    if (!courseName || !description) {
      toast({
        title: 'Error',
        description: t('errors.required'),
        variant: 'destructive',
      });
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast({
        title: 'Error',
        description: t('errors.minPrice'),
        variant: 'destructive',
      });
      return;
    }

    if (telegramBot) {
      const botError = await validateBotName(telegramBot);
      if (botError) {
        setBotNameError(botError);
        return;
      }
    }

    setLoading(true);

    try {
      // Create course in database - Remove user_id field as it doesn't exist in the courses table
      const { error } = await supabase.from('courses').insert({
        name: courseName,
        description: description,
        status: isActive,
        type: courseType,
        price: priceNum,
        duration: parseInt(duration),
        recurring: isRecurring,
        details: details,
        telegram_bot: telegramBot || null,
        project_id: selectedProject,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: t('success.courseCreated'),
      });

      // Redirect to courses page
      navigate('/courses');
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: 'Error',
        description: 'Failed to create course. Please try again.',
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
          <h1 className="text-2xl font-bold">{t('influencer.course.createNew')}</h1>
          <Button variant="ghost" onClick={() => navigate('/courses')}>
            {t('cancel')}
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>{t('influencer.course.createNew')}</CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center p-6">
                <h3 className="text-lg font-semibold mb-4">You need to create a project first</h3>
                <Button onClick={() => navigate('/create-project')}>
                  {t('influencer.project.createNew')}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="project">{t('select.project')}</Label>
                  <Select
                    value={selectedProject}
                    onValueChange={setSelectedProject}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="courseName">{t('influencer.course.name')}</Label>
                  <Input
                    id="courseName"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="Course Name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t('influencer.course.description')}</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A brief description of your course"
                    rows={3}
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="isActive">{t('influencer.course.status')}</Label>
                  <span className="text-sm text-gray-500 ml-2">
                    {isActive ? t('influencer.course.active') : t('influencer.course.inactive')}
                  </span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="courseType">{t('influencer.course.type')}</Label>
                  <Select
                    value={courseType}
                    onValueChange={setCourseType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diet">{t('influencer.course.types.diet')}</SelectItem>
                      <SelectItem value="mentalHealth">{t('influencer.course.types.mentalHealth')}</SelectItem>
                      <SelectItem value="sport">{t('influencer.course.types.sport')}</SelectItem>
                      <SelectItem value="business">{t('influencer.course.types.business')}</SelectItem>
                      <SelectItem value="education">{t('influencer.course.types.education')}</SelectItem>
                      <SelectItem value="other">{t('influencer.course.types.other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">{t('influencer.course.price')}</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                    <Input
                      id="price"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="pl-8"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">{t('influencer.course.duration')}</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="0"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="0 for one-time course"
                    required
                  />
                  <p className="text-sm text-gray-500">
                    {parseInt(duration) === 0 
                      ? t('influencer.course.oneTime') 
                      : `${duration} ${t('customer.courses.days')}`}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isRecurring"
                    checked={isRecurring}
                    onCheckedChange={setIsRecurring}
                    disabled={parseInt(duration) === 0}
                  />
                  <Label htmlFor="isRecurring">{t('influencer.course.recurring')}</Label>
                  <span className="text-sm text-gray-500 ml-2">
                    {isRecurring ? t('influencer.course.yes') : t('influencer.course.no')}
                  </span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="details">{t('influencer.course.details')}</Label>
                  <Textarea
                    id="details"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Markdown supported"
                    rows={6}
                  />
                  <p className="text-sm text-gray-500">
                    Markdown formatting is supported
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telegramBot">{t('influencer.course.telegramBot')}</Label>
                  <Input
                    id="telegramBot"
                    value={telegramBot}
                    onChange={handleBotNameChange}
                    placeholder="your_bot_name or @your_bot_name"
                  />
                  {botNameError && <p className="text-sm text-red-500">{botNameError}</p>}
                  <p className="text-xs text-gray-500">
                    Bot name can include letters, numbers, underscores, and the @ symbol
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating Course...' : t('influencer.course.save')}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreateCourse;
