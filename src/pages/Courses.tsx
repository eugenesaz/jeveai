import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Course } from '@/types/supabase';

// Define project type without circular references
interface ProjectDetails {
  name: string;
  color_scheme: string | null;
}

// Define the joined type using a flat structure
interface CourseWithProject {
  id: string;
  name: string;
  description: string | null;
  status: boolean | null;
  type: string | null;
  price: number;
  duration: number | null;
  recurring: boolean | null;
  details: string | null;
  telegram_bot: string | null;
  project_id: string;
  created_at: string | null;
  project: ProjectDetails | null;
}

const Courses = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseWithProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('courses')
          .select(`
            *,
            project:projects(name, color_scheme)
          `)
          .eq('user_id', user.id);

        if (error) {
          throw error;
        }

        if (data) {
          setCourses(data as CourseWithProject[]);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  const getTypeTranslation = (type: string) => {
    return t(`influencer.course.types.${type.toLowerCase()}`) || type;
  };

  const getColorClass = (colorScheme: string | null) => {
    switch (colorScheme) {
      case 'blue':
        return 'bg-blue-50 border-blue-200';
      case 'red':
        return 'bg-red-50 border-red-200';
      case 'orange':
        return 'bg-orange-50 border-orange-200';
      case 'green':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('influencer.course.title')}</h1>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              {t('navigation.dashboard')}
            </Button>
            <Button variant="ghost" onClick={() => navigate('/projects')}>
              {t('navigation.projects')}
            </Button>
            <Button onClick={() => navigate('/create-course')} variant="default">
              {t('influencer.course.createNew')}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-6">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p>Loading courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center p-10">
            <h2 className="text-xl font-semibold mb-4">{t('no.courses')}</h2>
            <Button onClick={() => navigate('/create-course')}>
              {t('influencer.course.createNew')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card 
                key={course.id} 
                className={`border ${getColorClass(course.project?.color_scheme || null)}`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                    <Badge variant={course.status ? "default" : "outline"}>
                      {course.status ? t('influencer.course.active') : t('influencer.course.inactive')}
                    </Badge>
                  </div>
                  <CardDescription>
                    {course.project?.name || 'No Project'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm line-clamp-2">{course.description}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mt-2">
                    <div className="text-gray-500">{t('customer.courses.type')}:</div>
                    <div>{getTypeTranslation(course.type || '')}</div>
                    <div className="text-gray-500">{t('customer.courses.price')}:</div>
                    <div>${course.price.toFixed(2)}</div>
                    <div className="text-gray-500">{t('customer.courses.duration')}:</div>
                    <div>{course.duration === 0 ? t('customer.courses.oneTime') : `${course.duration} ${t('customer.courses.days')}`}</div>
                    <div className="text-gray-500">{t('influencer.course.recurring')}:</div>
                    <div>{course.recurring ? t('influencer.course.yes') : t('influencer.course.no')}</div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/edit-course/${course.id}`)}
                  >
                    {t('edit')}
                  </Button>
                  <Button 
                    variant="default"
                    onClick={() => navigate(`/course/${course.id}`)}
                  >
                    {t('view')}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Courses;
