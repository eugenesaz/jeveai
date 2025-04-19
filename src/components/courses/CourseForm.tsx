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
import { toast } from '@/components/ui/use-toast';

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
  materials: File[];
}

interface CourseFormProps {
  onSubmit: (data: CourseFormData) => Promise<void>;
  loading: boolean;
  initialValues?: Partial<CourseFormData>;
}

export const CourseForm = ({ onSubmit, loading, initialValues }: CourseFormProps) => {
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
    materials: [],
  });

  // Initialize form with initial values if provided (for editing)
  useEffect(() => {
    if (initialValues) {
      setFormData(prev => ({
        ...prev,
        ...initialValues,
        materials: initialValues.materials || []
      }));
      if (initialValues.telegramBot) {
        validateBotName(initialValues.telegramBot);
      }
    }
  }, [initialValues, validateBotName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (botNameError) return;

    // Upload materials before submitting
    const uploadedMaterials = await Promise.all(
      formData.materials.map(async (file) => {
        const fileName = `${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
          .from('course-materials')
          .upload(fileName, file);

        if (error) {
          toast({
            title: 'Upload Error',
            description: `Failed to upload ${file.name}`,
            variant: 'destructive',
          });
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
    await validateBotName(value);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="courseName">{t('influencer.course.name')}</Label>
        <Input
          id="courseName"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Course Name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t('influencer.course.description')}</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="A brief description of your course"
          rows={3}
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
        />
        <Label htmlFor="isActive">{t('influencer.course.status')}</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="courseType">{t('influencer.course.type')}</Label>
        <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
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
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
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
          value={formData.duration}
          onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
          placeholder="0 for one-time course"
          required
        />
        <p className="text-sm text-gray-500">
          {parseInt(formData.duration) === 0 
            ? t('influencer.course.oneTime') 
            : `${formData.duration} ${t('customer.courses.days')}`}
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isRecurring"
          checked={formData.isRecurring}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRecurring: checked }))}
          disabled={parseInt(formData.duration) === 0}
        />
        <Label htmlFor="isRecurring">{t('influencer.course.recurring')}</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="details">{t('influencer.course.details')}</Label>
        <Textarea
          id="details"
          value={formData.details}
          onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
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
          value={formData.telegramBot}
          onChange={(e) => handleBotNameChange(e.target.value)}
          placeholder="your_bot_name or @your_bot_name"
        />
        {botNameError && <p className="text-sm text-red-500">{botNameError}</p>}
        <p className="text-xs text-gray-500">
          Bot name can include letters, numbers, underscores, and the @ symbol
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="aiInstructions">{t('influencer.course.aiInstructions')}</Label>
        <Textarea
          id="aiInstructions"
          value={formData.aiInstructions}
          onChange={(e) => setFormData(prev => ({ ...prev, aiInstructions: e.target.value }))}
          placeholder="Optional AI instructions for the course"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="materials">{t('influencer.course.materials')}</Label>
        <Input
          id="materials"
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
          onChange={handleMaterialUpload}
          disabled={formData.materials.length >= 10}
        />
        <p className="text-sm text-gray-500">
          {t('influencer.course.materialsInfo', 'Up to 10 files allowed')}
        </p>
        
        {formData.materials.length > 0 && (
          <div className="mt-2 space-y-2">
            {formData.materials.map((file, index) => (
              <div 
                key={index} 
                className="flex justify-between items-center bg-gray-100 p-2 rounded"
              >
                <span>{file.name}</span>
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="sm"
                  onClick={() => removeMaterial(index)}
                >
                  {t('remove')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading || !!botNameError}>
        {loading ? 'Saving Course...' : t('influencer.course.save')}
      </Button>
    </form>
  );
};
