
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { ProjectSelector } from '@/components/courses/ProjectSelector';
import { CourseForm } from '@/components/courses/CourseForm';
import { ArrowLeft } from 'lucide-react';

const CreateCourse = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialProjectId = queryParams.get('projectId');
  
  const [selectedProject, setSelectedProject] = useState<string>(initialProjectId || '');
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
        ai_instructions: formData.aiInstructions || null,
        materials: formData.materials ? JSON.stringify(formData.materials) : '[]',
        course_plan: formData.coursePlan || null,
      });

      if (error) throw error;

      toast.success(t('success.courseCreated', 'Course created successfully'));
      navigate('/courses');
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error(t('errors.courseCreateFailed', 'Failed to create course. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('influencer.course.createNew')}</h1>
          <Button variant="ghost" onClick={() => navigate('/courses')} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('cancel')}
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        {user && (
          <div className="max-w-3xl mx-auto space-y-6">
            <ProjectSelector
              userId={user.id}
              value={selectedProject}
              onChange={setSelectedProject}
              selectedProjectId={selectedProject}
            />
            {selectedProject && (
              <CourseForm onSubmit={handleSubmit} loading={loading} />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default CreateCourse;
