
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { ProjectSelector } from '@/components/courses/ProjectSelector';
import { CourseForm } from '@/components/courses/CourseForm';

const CreateCourse = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: any) => {
    if (!user || !selectedProject) return;
    setLoading(true);

    try {
      const { error } = await supabase.from('courses').insert({
        name: formData.name,
        description: formData.description,
        status: formData.isActive,
        type: formData.type,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        recurring: formData.isRecurring,
        details: formData.details,
        telegram_bot: formData.telegramBot || null,
        project_id: selectedProject,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: t('success.courseCreated'),
      });

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
            {user && (
              <>
                <ProjectSelector
                  userId={user.id}
                  value={selectedProject}
                  onChange={setSelectedProject}
                />
                {selectedProject && (
                  <CourseForm onSubmit={handleSubmit} loading={loading} />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreateCourse;
