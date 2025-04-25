
import { Project } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';

interface ProjectHeroProps {
  project: Project;
}

export const ProjectHero = ({ project }: ProjectHeroProps) => {
  const { t } = useTranslation();
  
  return (
    <section className="relative py-24 overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center transform scale-105 transition-transform duration-1000 hover:scale-100" 
        style={{
          backgroundImage: project.landing_image 
            ? `url(${project.landing_image})` 
            : 'url(https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&q=80&w=1470&h=950)',
          backgroundPosition: 'center'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-gray-900/50"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-2xl text-white">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight animate-fade-in">
            {project.name}
          </h1>
          {project.description && (
            <p className="text-xl md:text-2xl text-gray-200 mb-8 leading-relaxed animate-fade-in delay-100">
              {project.description}
            </p>
          )}
          <div className="flex flex-wrap gap-4 animate-fade-in delay-200">
            <Button 
              className="group bg-white text-gray-900 hover:bg-gray-100 transition-all duration-300"
              onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('project.landing.explore.courses', 'Explore Courses')}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
