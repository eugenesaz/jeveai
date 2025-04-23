
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
import { MessageSquare, Users, Star } from 'lucide-react';

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
      <ProjectHeader projectName={project.name} colorScheme={project.color_scheme} projectUrlName={project.url_name} />
      <main className="flex-grow">
        {/* Project Hero with Image at the Top */}
        <ProjectHero project={project} />
        
        {/* Available Courses */}
        <CourseGrid courses={courses} projectId={project.id} />
        
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-gray-900">
              {t('project.landing.benefits.title', 'What You\'ll Gain')}
            </h2>

            <div className="grid md:grid-cols-3 gap-10">
              <div className="bg-purple-50 rounded-xl p-8 text-center hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-800 mb-6">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">{t('project.landing.benefits.personalized.title', 'Personalized Guidance')}</h3>
                <p className="text-gray-600">{t('project.landing.benefits.personalized.description', 'Receive customized support tailored to your specific goals and challenges')}</p>
              </div>
              
              <div className="bg-blue-50 rounded-xl p-8 text-center hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-800 mb-6">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">{t('project.landing.benefits.community.title', 'Community Support')}</h3>
                <p className="text-gray-600">{t('project.landing.benefits.community.description', 'Join a community of like-minded individuals on similar journeys')}</p>
              </div>
              
              <div className="bg-indigo-50 rounded-xl p-8 text-center hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-800 mb-6">
                  <Star className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">{t('project.landing.benefits.results.title', 'Proven Results')}</h3>
                <p className="text-gray-600">{t('project.landing.benefits.results.description', 'Follow systems and approaches that have been proven to deliver transformative outcomes')}</p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
              {t('project.landing.testimonials.title', 'What Others Are Saying')}
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-md">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 mb-6 italic">"{t('project.landing.testimonials.quote1', 'This program has completely transformed my approach. The personalized guidance was exactly what I needed to make real progress.')}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center text-purple-700 font-bold text-lg mr-4">SR</div>
                  <div>
                    <p className="font-bold">{t('project.landing.testimonials.name1', 'Sarah R.')}</p>
                    <p className="text-sm text-gray-500">{t('project.landing.testimonials.date1', 'Joined 3 months ago')}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-md">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 mb-6 italic">"{t('project.landing.testimonials.quote2', 'I\'ve tried many other programs before, but the level of personalization and care in this one is unmatched. I\'m seeing results I never thought possible.')}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg mr-4">JT</div>
                  <div>
                    <p className="font-bold">{t('project.landing.testimonials.name2', 'James T.')}</p>
                    <p className="text-sm text-gray-500">{t('project.landing.testimonials.date2', 'Joined 6 months ago')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">{project.name}</h3>
              <p className="text-gray-400">{project.description || t('landing.footer.description', 'Personalized guidance to help you achieve your goals')}</p>
            </div>
            <div className="md:text-right">
              <h4 className="font-bold mb-4">{t('project.landing.footer.connect', 'Connect With Us')}</h4>
              <div className="flex md:justify-end gap-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.504.344-1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
            <p>© {new Date().getFullYear()} {project.name}. {t('landing.rights')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProjectLanding;
