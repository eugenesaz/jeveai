
import { Project } from '@/types/supabase';

interface ProjectHeroProps {
  project: Project;
}

export const ProjectHero = ({ project }: ProjectHeroProps) => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background image with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center" 
        style={{
          backgroundImage: project.landing_image 
            ? `url(${project.landing_image})` 
            : 'url(https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&q=80&w=1470&h=950)',
          backgroundPosition: 'center'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-gray-900/50"></div>
      
      {/* Content */}
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-2xl text-white">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            {project.name}
          </h1>
          {project.description && (
            <p className="text-xl md:text-2xl text-gray-200 mb-8 leading-relaxed">
              {project.description}
            </p>
          )}
          {/* Removed Explore Courses and Learn More buttons */}
        </div>
      </div>
    </section>
  );
};
