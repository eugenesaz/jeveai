import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types/supabase';
import { LoadingState } from '@/components/landing/LoadingState';
import { ErrorState } from '@/components/landing/ErrorState';
import { ProjectHeader } from '@/components/landing/ProjectHeader';
import { ProjectHero } from '@/components/landing/ProjectHero';
import { CourseGrid } from '@/components/landing/CourseGrid';
import { useAuth } from '@/contexts/AuthContext';

interface Course {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number | null;
  project_id: string;
}

const ProjectLanding = () => {
  const { t } = useTranslation();
  const { urlName } = useParams();
  const navigate = useNavigate();
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
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('url_name', urlName)
          .eq('status', true)
          .single();
        
        if (projectError) {
          console.error('Error fetching project:', projectError);
          setError('Project not found');
          setLoading(false);
          return;
        }
        
        setProject(projectData as Project);

        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, name, description, price, duration, project_id')
          .eq('project_id', projectData.id)
          .eq('status', true);

        if (coursesError) {
          console.error('Error fetching courses:', coursesError);
        } else {
          const filteredCourses = coursesData?.filter(course => course.project_id === projectData.id) || [];
          console.log('Filtered courses for project', projectData.id, ':', filteredCourses);
          setCourses(filteredCourses);
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

  if (loading) return <LoadingState />;
  if (error || !project) return <ErrorState error={error} />;

  return (
    <div className="min-h-screen flex flex-col">
      <ProjectHeader projectName={project.name} colorScheme={project.color_scheme} />
      <main className="flex-grow">
        <ProjectHero project={project} />
        <CourseGrid courses={courses} projectId={project.id} />
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
