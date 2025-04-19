
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { CourseForm } from '@/components/courses/CourseForm';
import { ProjectSelector } from '@/components/courses/ProjectSelector';
import { Button } from '@/components/ui/button';
import { Course } from '@/types/supabase';

const EditCourse = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [userCanEdit, setUserCanEdit] = useState(false);
  
  useEffect(() => {
    const fetchCourse = async () => {
      if (!user || !id) return;
      
      try {
        setLoading(true);
        // Fetch the course details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', id)
          .single();
          
        if (courseError) {
          toast({
            title: t('errors.title'),
            description: courseError.message,
            variant: 'destructive',
          });
          navigate('/courses');
          return;
        }
        
        if (!courseData) {
          toast({
            title: t('errors.title'),
            description: t('errors.courseNotFound'),
            variant: 'destructive',
          });
          navigate('/courses');
          return;
        }
        
        setCourse(courseData);
        setProjectId(courseData.project_id);
        
        // Check if user is the project owner
        const { data: projectData } = await supabase
          .from('projects')
          .select('user_id')
          .eq('id', courseData.project_id)
          .single();
          
        if (projectData && projectData.user_id === user.id) {
          setUserCanEdit(true);
        } else {
          // Check if user has an influencer role for this project
          const { data: roleData } = await supabase
            .from('user_project_roles')
            .select('role')
            .eq('project_id', courseData.project_id)
            .eq('user_id', user.id)
            .eq('role', 'influencer');
            
          if (roleData && roleData.length > 0) {
            setUserCanEdit(true);
          } else {
            toast({
              title: t('errors.title'),
              description: t('errors.notAuthorized'),
              variant: 'destructive',
            });
            navigate('/courses');
          }
        }
      } catch (error) {
        console.error('Error fetching course:', error);
        toast({
          title: t('errors.title'),
          description: t('errors.generic'),
          variant: 'destructive',
        });
        navigate('/courses');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourse();
  }, [user, id, navigate, t]);
  
  const handleSubmit = async (formData: any) => {
    if (!user || !id || !projectId) return;
    
    try {
      setSaving(true);
      
      const updatedCourse = {
        name: formData.name,
        description: formData.description,
        status: formData.isActive,
        type: formData.type,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        recurring: formData.isRecurring,
        details: formData.details,
        telegram_bot: formData.telegramBot || null,
        project_id: projectId,
        ai_instructions: formData.aiInstructions || null,
        materials: formData.materials ? JSON.stringify(formData.materials) : '[]'
      };
      
      const { error } = await supabase
        .from('courses')
        .update(updatedCourse)
        .eq('id', id);
        
      if (error) {
        toast({
          title: t('errors.title'),
          description: error.message,
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: t('success'),
        description: t('influencer.course.updateSuccess'),
      });
      
      navigate('/courses');
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        title: t('errors.title'),
        description: t('errors.generic'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('influencer.course.edit')}</h1>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => navigate('/courses')}>
              {t('navigation.courses')}
            </Button>
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              {t('navigation.dashboard')}
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto p-6">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p>{t('loading')}</p>
          </div>
        ) : course && userCanEdit ? (
          <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl mx-auto">
            <ProjectSelector 
              selectedProjectId={projectId || ''}
              onProjectSelect={setProjectId}
              disabled={true}
            />
            
            <CourseForm 
              onSubmit={handleSubmit}
              loading={saving}
              initialValues={{
                name: course.name,
                description: course.description || '',
                isActive: course.status ?? true,
                type: course.type || 'diet',
                price: String(course.price),
                duration: String(course.duration),
                isRecurring: course.recurring ?? false,
                details: course.details || '',
                telegramBot: course.telegram_bot || '',
                aiInstructions: course.ai_instructions || '',
                materials: course.materials ? JSON.parse(course.materials) : []
              }}
            />
          </div>
        ) : (
          <div className="text-center p-10">
            <p>{t('errors.notAuthorized')}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default EditCourse;
