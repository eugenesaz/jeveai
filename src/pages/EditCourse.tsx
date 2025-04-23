
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { CourseForm } from '@/components/courses/CourseForm';
import { ProjectSelector } from '@/components/courses/ProjectSelector';
import { Button } from '@/components/ui/button';
import { Course } from '@/types/supabase';
import { ArrowLeft } from 'lucide-react';

const EditCourse = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [course, setCourse] = useState<Course>({
    id: '',
    name: '',
    description: '',
    status: true,
    type: '',
    price: 0,
    duration: 0,
    recurring: false,
    details: '',
    telegram_bot: '',
    project_id: '',
    created_at: '',
    ai_instructions: '',
    materials: '',
    course_plan: '',
  });
  const [userCanEdit, setUserCanEdit] = useState(false);
  
  useEffect(() => {
    const fetchCourse = async () => {
      if (!user || !id) return;
      
      try {
        setLoading(true);
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', id)
          .single();
          
        if (courseError) {
          toast.error(courseError.message);
          navigate('/courses');
          return;
        }
        
        if (!courseData) {
          toast.error(t('errors.courseNotFound', 'Course not found'));
          navigate('/courses');
          return;
        }
        
        setCourse({
          ...courseData,
          ai_instructions: courseData.ai_instructions || null,
          materials: courseData.materials || null,
        });
        setProjectId(courseData.project_id);
        
        const { data: projectData } = await supabase
          .from('projects')
          .select('user_id')
          .eq('id', courseData.project_id)
          .single();
          
        if (projectData && projectData.user_id === user.id) {
          setUserCanEdit(true);
        } else {
          const { data: roleData } = await supabase
            .from('user_project_roles')
            .select('role')
            .eq('project_id', courseData.project_id)
            .eq('user_id', user.id)
            .eq('role', 'influencer');
            
          if (roleData && roleData.length > 0) {
            setUserCanEdit(true);
          } else {
            toast.error(t('errors.notAuthorized', 'You are not authorized to edit this course'));
            navigate('/courses');
          }
        }
      } catch (error) {
        console.error('Error fetching course:', error);
        toast.error(t('errors.generic', 'An error occurred'));
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
        course_plan: formData.coursePlan || null,
        materials: formData.materials ? JSON.stringify(formData.materials) : null
      };
      
      const { error } = await supabase
        .from('courses')
        .update(updatedCourse)
        .eq('id', id);
        
      if (error) {
        toast.error(error.message);
        return;
      }
      
      toast.success(t('influencer.course.updateSuccess', 'Course updated successfully'));
      navigate('/courses');
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error(t('errors.generic', 'An error occurred'));
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('influencer.course.edit', 'Edit Course')}</h1>
          <Button variant="ghost" onClick={() => navigate('/courses')} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('navigation.courses', 'Courses')}
          </Button>
        </div>
      </header>
      
      <main className="container mx-auto py-8 px-4">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p>{t('loading', 'Loading...')}</p>
          </div>
        ) : course && userCanEdit ? (
          <div className="max-w-3xl mx-auto space-y-6">
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
                coursePlan: course.course_plan || '',
                materials: course.materials ? JSON.parse(course.materials) : []
              }}
            />
          </div>
        ) : (
          <div className="text-center p-10">
            <p>{t('errors.notAuthorized', 'You are not authorized to edit this course')}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default EditCourse;
