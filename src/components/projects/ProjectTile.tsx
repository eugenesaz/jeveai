
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Project } from '@/types/supabase';
import { BookText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProjectTileProps {
  project: Project;
  onCopyUrl: (urlName: string) => void;
}

export const ProjectTile = ({ project, onCopyUrl }: ProjectTileProps) => {
  const navigate = useNavigate();

  return (
    <Card className={`border-2 ${getColorClass(project.color_scheme)} hover:shadow-lg transition-shadow`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">{project.name}</CardTitle>
        <CardDescription>
          {project.status ? 'Active' : 'Inactive'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        {project.landing_image && (
          <div className="w-full h-32 mb-2 overflow-hidden rounded">
            <img 
              src={project.landing_image} 
              alt={project.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <p className="text-xs text-gray-500 truncate">
          URL: {window.location.origin}/{project.url_name}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 pt-0">
        <div className="flex w-full gap-2">
          <Button 
            variant="outline"
            onClick={() => onCopyUrl(project.url_name)}
            className="flex-1 text-xs px-1"
            size="sm"
          >
            Copy URL
          </Button>
          <Button 
            onClick={() => navigate(`/edit-project/${project.id}`)}
            className="flex-1 text-xs px-1"
            size="sm"
          >
            Edit
          </Button>
        </div>
        <Button 
          variant="default"
          onClick={() => navigate('/courses', { state: { projectId: project.id } })}
          className="w-full gap-1 text-sm"
        >
          <BookText className="h-4 w-4" />
          Manage Courses
        </Button>
      </CardFooter>
    </Card>
  );
};

const getColorClass = (colorScheme: string | null) => {
  switch (colorScheme) {
    case 'blue': return 'bg-blue-100 border-blue-500';
    case 'red': return 'bg-red-100 border-red-500';
    case 'orange': return 'bg-orange-100 border-orange-500';
    case 'green': return 'bg-green-100 border-green-500';
    default: return 'bg-gray-100 border-gray-500';
  }
};
