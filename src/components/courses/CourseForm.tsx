
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useBotNameValidator } from '@/hooks/useBotNameValidator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CourseFormData {
  name: string;
  description: string;
  isActive: boolean;
  type: string;
  price: string;
  duration: string;
  isRecurring: boolean;
  details: string;
  telegramBot: string;
  aiInstructions: string;
  coursePlan: string;
  materials: File[];
}

interface FieldLabels {
  name: string;
  description: string;
  isActive: string;
  type: string;
  price: string;
  duration: string;
  isRecurring: string;
  details: string;
  telegramBot: string;
  aiInstructions: string;
  coursePlan: string;
  materials: string;
}

interface CourseFormProps {
  onSubmit: (data: CourseFormData) => Promise<void>;
  loading: boolean;
  initialValues?: Partial<CourseFormData>;
  fieldLabels?: FieldLabels;
}

export const CourseForm = ({ onSubmit, loading, initialValues, fieldLabels }: CourseFormProps) => {
  const { t } = useTranslation();
  const { botNameError, validateBotName } = useBotNameValidator();

  const [formData, setFormData] = useState<CourseFormData>({
    name: '',
    description: '',
    isActive: true,
    type: 'diet',
    price: '',
    duration: '0',
    isRecurring: false,
    details: '',
    telegramBot: '',
    aiInstructions: '',
    coursePlan: '',
    materials: [],
  });

  // Store the original bot name for comparison during validation
  const [originalBotName, setOriginalBotName] = useState<string>('');
  const [activeTab, setActiveTab] = useState('basic');

  // Initialize form with initial values if provided (for editing)
  useEffect(() => {
    if (initialValues) {
      setFormData(prev => ({
        ...prev,
        ...initialValues,
        materials: initialValues.materials || []
      }));
      if (initialValues.telegramBot) {
        setOriginalBotName(initialValues.telegramBot);
      }
    }
  }, [initialValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the bot name before submitting
    if (formData.telegramBot && formData.telegramBot !== originalBotName) {
      const error = await validateBotName(formData.telegramBot, originalBotName);
      if (error) return;
    }

    // Upload materials before submitting
    const uploadedMaterials = await Promise.all(
      formData.materials.map(async (file) => {
        const fileName = `${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
          .from('course-materials')
          .upload(fileName, file);

        if (error) {
          toast.error(`${t('upload.error', 'Upload Error')}: ${file.name}`);
          return null;
        }

        return {
          name: fileName,
          url: data?.path,
          original_name: file.name,
        };
      })
    );

    // Filter out any null uploads
    const validMaterials = uploadedMaterials.filter(m => m !== null);

    await onSubmit({
      ...formData,
      materials: validMaterials as any[]
    });
  };

  const handleBotNameChange = async (value: string) => {
    setFormData(prev => ({ ...prev, telegramBot: value }));
    // Only validate after a slight delay to prevent immediate validation while typing
    setTimeout(() => {
      validateBotName(value, originalBotName);
    }, 500);
  };

  const handleMaterialUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const limitedFiles = newFiles.slice(0, 10 - formData.materials.length);
      
      setFormData(prev => ({
        ...prev,
        materials: [...prev.materials, ...limitedFiles]
      }));
    }
  };

  const removeMaterial = (index: number) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  // Use fieldLabels if provided, otherwise fallback to translation keys
  const labels = fieldLabels || {
    name: t('influencer.course.name', 'Course Name'),
    description: t('influencer.course.description', 'Course Description'),
    isActive: t('influencer.course.status', 'Status'),
    type: t('influencer.course.type', 'Course Type'),
    price: t('influencer.course.price', 'Price (USD)'),
    duration: t('influencer.course.duration', 'Duration (Days)'),
    isRecurring: t('influencer.course.recurring', 'Recurring Payment'),
    details: t('influencer.course.details', 'Course Details'),
    telegramBot: t('influencer.course.telegramBot', 'Telegram Chatbot Name'),
    aiInstructions: t('influencer.course.aiInstructions', 'AI Instructions'),
    coursePlan: t('influencer.course.coursePlan', 'Course Plan'),
    materials: t('influencer.course.materials', 'Materials')
  };

  return (
    <Card className="border bg-card text-card-foreground shadow-sm">
      <CardHeader className="flex flex-col space-y-1.5 p-6">
        <CardTitle className="text-2xl font-bold">
          {initialValues ? t('influencer.course.edit') : t('influencer.course.createNew')}
        </CardTitle>
        <CardDescription>
          {t('influencer.course.form.description', 'Fill in the details to create your course')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="basic">{t('form.basic_info', 'Basic Info')}</TabsTrigger>
            <TabsTrigger value="details">{t('form.details', 'Details')}</TabsTrigger>
            <TabsTrigger value="materials">{t('form.materials', 'Materials')}</TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <TabsContent value="basic" className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="courseName">{labels.name}</Label>
                <Input
                  id="courseName"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('course.name.placeholder', 'Enter course name')}
                  className="bg-background"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{labels.description}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('course.description.placeholder', 'A brief description of your course')}
                  rows={3}
                  className="bg-background"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">{labels.isActive}</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="courseType">{labels.type}</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder={t('course.type.placeholder', 'Select a course type')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diet">{t('influencer.course.types.diet', 'Diet')}</SelectItem>
                    <SelectItem value="mentalHealth">{t('influencer.course.types.mentalHealth', 'Mental Health')}</SelectItem>
                    <SelectItem value="sport">{t('influencer.course.types.sport', 'Sport')}</SelectItem>
                    <SelectItem value="business">{t('influencer.course.types.business', 'Business')}</SelectItem>
                    <SelectItem value="education">{t('influencer.course.types.education', 'Education')}</SelectItem>
                    <SelectItem value="other">{t('influencer.course.types.other', 'Other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">{labels.price}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                  <Input
                    id="price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                    className="pl-8 bg-background"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">{labels.duration}</Label>
                <Input
                  id="duration"
                  type="number"
                  min="0"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder={t('course.duration.placeholder', '0 for one-time course')}
                  className="bg-background"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  {parseInt(formData.duration) === 0 
                    ? t('influencer.course.oneTime', 'One-time course') 
                    : `${formData.duration} ${t('customer.courses.days', 'days')}`}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRecurring: checked }))}
                  disabled={parseInt(formData.duration) === 0}
                />
                <Label htmlFor="isRecurring">{labels.isRecurring}</Label>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="details">{labels.details}</Label>
                <Textarea
                  id="details"
                  value={formData.details}
                  onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
                  placeholder={t('course.details.placeholder', 'Markdown supported')}
                  rows={6}
                  className="bg-background"
                />
                <p className="text-sm text-muted-foreground">
                  {t('markdown.supported', 'Markdown formatting is supported')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coursePlan">{labels.coursePlan}</Label>
                <Textarea
                  id="coursePlan"
                  value={formData.coursePlan}
                  onChange={(e) => setFormData(prev => ({ ...prev, coursePlan: e.target.value }))}
                  placeholder={t('course.plan.placeholder', 'Detailed day-by-day plan for your course')}
                  rows={8}
                  className="bg-background"
                />
                <p className="text-sm text-muted-foreground">
                  {t('course.plan.description', 'Provide a detailed plan explaining what will happen on each day of the course')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telegramBot">{labels.telegramBot}</Label>
                <Input
                  id="telegramBot"
                  value={formData.telegramBot}
                  onChange={(e) => handleBotNameChange(e.target.value)}
                  placeholder={t('telegram.bot.placeholder', 'your_bot_name or @your_bot_name')}
                  className="bg-background"
                />
                {botNameError && <p className="text-sm text-red-500">{botNameError}</p>}
                <p className="text-xs text-muted-foreground">
                  {t('telegram.bot.description', 'Bot name can include letters, numbers, underscores, and the @ symbol')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aiInstructions">{labels.aiInstructions}</Label>
                <Textarea
                  id="aiInstructions"
                  value={formData.aiInstructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, aiInstructions: e.target.value }))}
                  placeholder={t('ai.instructions.placeholder', 'Optional AI instructions for the course')}
                  rows={3}
                  className="bg-background"
                />
              </div>
            </TabsContent>

            <TabsContent value="materials" className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="materials">{labels.materials}</Label>
                <Input
                  id="materials"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={handleMaterialUpload}
                  disabled={formData.materials.length >= 10}
                  className="bg-background"
                />
                <p className="text-sm text-muted-foreground">
                  {t('influencer.course.materialsInfo', 'Up to 10 files allowed')}
                </p>
                
                {formData.materials.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {formData.materials.map((file, index) => (
                      <div 
                        key={index} 
                        className="flex justify-between items-center bg-gray-50 p-2 rounded"
                      >
                        <span>{file.name}</span>
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="sm"
                          onClick={() => removeMaterial(index)}
                        >
                          {t('remove', 'Remove')}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <div className="flex justify-end pt-4">
              <Button type="submit" className="w-full md:w-auto" disabled={loading || !!botNameError}>
                {loading ? t('saving', 'Saving...') : t('influencer.course.save', 'Save Course')}
              </Button>
            </div>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
};
