
import { Project } from '@/types/supabase';

interface ProjectHeroProps {
  project: Project;
}

export const ProjectHero = ({ project }: ProjectHeroProps) => {
  return (
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
  );
};
