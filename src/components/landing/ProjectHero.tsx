
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
            : 'url(/lovable-uploads/b7617ba3-6580-4f6b-b9b8-f4debb8d3995.png)',
          backgroundPosition: 'center'
        }}
      />
      
      {/* Overlay with gradient matching the new color scheme */}
      <div className="absolute inset-0 bg-gradient-to-r from-ai-dark/90 to-ai-dark/50"></div>
      
      {/* Add a grid pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M 8 0 L 0 0 0 8" fill="none" stroke="white" strokeWidth="0.5" opacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
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
              className="group bg-gradient-to-r from-ai-blue to-ai-purple text-white hover:opacity-90 shadow-lg transition-all duration-300"
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
