
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ProjectLanguageSelector } from '@/components/landing/ProjectLanguageSelector';
import { Benefits } from '@/components/landing/Benefits';
import { CallToAction } from '@/components/landing/CallToAction';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Project } from '@/types/supabase';
import { Spinner } from '@/components/ui/spinner';

const ProjectLanding = () => {
  const { t } = useTranslation();
  const { urlName } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchProject = async () => {
      if (!urlName) {
        setError('Invalid URL');
        setLoading(false);
        return;
      }
      
      try {
        // Fetch the project based on the URL name
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('url_name', urlName)
          .eq('status', true) // Only active projects
          .single();
        
        if (error) {
          console.error('Error fetching project:', error);
          setError('Project not found');
          setLoading(false);
          return;
        }
        
        setProject(data as Project);
      } catch (err) {
        console.error('Exception fetching project:', err);
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProject();
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

  // Get color scheme classes based on project settings
  const getColorClass = () => {
    switch (project.color_scheme) {
      case 'blue': return 'bg-blue-500 text-white';
      case 'red': return 'bg-red-500 text-white';
      case 'orange': return 'bg-orange-500 text-white';
      case 'green': return 'bg-green-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getBgClass = () => {
    switch (project.color_scheme) {
      case 'blue': return 'bg-blue-50';
      case 'red': return 'bg-red-50';
      case 'orange': return 'bg-orange-50';
      case 'green': return 'bg-green-50';
      default: return 'bg-blue-50';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Project header - Now using the LandingHeader component */}
      <LandingHeader 
        onLoginClick={() => {}} 
        onSignUpClick={() => {}}
        colorScheme={project.color_scheme as 'blue' | 'red' | 'orange' | 'green' || 'blue'}
      />

      {/* Project content */}
      <main className="flex-grow">
        {/* Hero section */}
        <LandingHeader 
          title={project.name}
          subtitle={t('landing.subtitle')}
          backgroundImage={project.landing_image || undefined}
        />
        
        {/* Benefits section */}
        <section className={`py-16 ${getBgClass()}`}>
          <Benefits />
        </section>
        
        {/* Call to action section */}
        <CallToAction 
          onSignUpClick={() => {}}
          colorScheme={project.color_scheme as 'blue' | 'red' | 'orange' | 'green' || 'blue'}
        />
      </main>
      
      {/* Footer */}
      <footer className={`${getColorClass()} py-8`}>
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
