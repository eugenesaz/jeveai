
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Project } from '@/types/supabase';
import { useNavigate } from 'react-router-dom';

interface ProjectTileProps {
  project: Project;
  onCopyUrl: (urlName: string) => void;
}

export const ProjectTile = ({ project, onCopyUrl }: ProjectTileProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const getColorClass = (colorScheme: string | null) => {
    switch (colorScheme) {
      case 'blue': return 'bg-blue-100 border-blue-500';
      case 'red': return 'bg-red-100 border-red-500';
      case 'orange': return 'bg-orange-100 border-orange-500';
      case 'green': return 'bg-green-100 border-green-500';
      default: return 'bg-gray-100 border-gray-500';
    }
  };

  return (
    <Card 
      className={`border-2 ${getColorClass(project.color_scheme)} hover:shadow-lg transition-shadow`}
    >
      <CardHeader>
        <CardTitle>{project.name}</CardTitle>
        <CardDescription>
          {project.status ? t('influencer.project.active') : t('influencer.project.inactive')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {project.landing_image && (
          <div className="w-full h-40 mb-4 overflow-hidden rounded">
            <img 
              src={project.landing_image} 
              alt={project.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <p className="text-sm text-gray-500">
          URL: {window.location.origin}/{project.url_name}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline"
          onClick={() => onCopyUrl(project.url_name)}
        >
          {t('influencer.project.copyUrl')}
        </Button>
        <Button 
          onClick={() => navigate(`/edit-project/${project.id}`)}
        >
          {t('editButton')}
        </Button>
      </CardFooter>
    </Card>
  );
};
