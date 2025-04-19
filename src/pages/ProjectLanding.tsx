
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types/supabase';
import { Spinner } from '@/components/ui/spinner';
import { LandingHeader } from '@/components/landing/LandingHeader';

interface Course {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number | null;
}

const ProjectLanding = () => {
  const { t } = useTranslation();
  const { urlName } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchProjectAndCourses = async () => {
      if (!urlName) {
        setError('Invalid URL');
        setLoading(false);
        return;
      }
      
      try {
        // Fetch the project based on the URL name
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('url_name', urlName)
          .eq('status', true) // Only active projects
          .single();
        
        if (projectError) {
          console.error('Error fetching project:', projectError);
          setError('Project not found');
          setLoading(false);
          return;
        }
        
        setProject(projectData as Project);

        // Fetch courses for this project
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, name, description, price, duration')
          .eq('project_id', projectData.id)
          .eq('status', true); // Only active courses

        if (coursesError) {
          console.error('Error fetching courses:', coursesError);
        } else {
          setCourses(coursesData || []);
        }
      } catch (err) {
        console.error('Exception:', err);
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjectAndCourses();
  }, [urlName]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner size="lg" className="mb-4" />
          <p>{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">{error || 'Project not found'}</h1>
          <p className="mb-4">{t('errors.projectNotFoundOrInactive')}</p>
          <Link to="/" className="text-blue-500 hover:underline">
            {t('navigation.goHome')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader 
        onLoginClick={() => {}} 
        onSignUpClick={() => {}}
        colorScheme={project.color_scheme as 'blue' | 'red' | 'orange' | 'green' || 'blue'}
      />

      <main className="flex-grow">
        {/* Project Hero Section */}
        <section className="relative py-20 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
          {project.landing_image && (
            <div 
              className="absolute inset-0 opacity-20" 
              style={{
                backgroundImage: `url(${project.landing_image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
          )}
          <div className="container mx-auto px-4 relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
              {project.name}
            </h1>
          </div>
        </section>

        {/* Courses Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">{t('courses.available')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div 
                  key={course.id} 
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{course.name}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">${course.price.toFixed(2)}</span>
                      {course.duration && (
                        <span className="text-sm text-gray-500">
                          {course.duration} {t('customer.courses.days')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="px-6 pb-4">
                    <Link 
                      to={`/course/${course.id}`}
                      className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                    >
                      {t('customer.courses.viewDetails')}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            {courses.length === 0 && (
              <p className="text-center text-gray-600">{t('no.courses.available')}</p>
            )}
          </div>
        </section>
      </main>
      
      <footer className={`bg-gray-900 text-white py-8`}>
        <div className="container mx-auto px-4">
          <p className="text-center">
            &copy; {new Date().getFullYear()} {project.name}. {t('landing.rights')}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ProjectLanding;

