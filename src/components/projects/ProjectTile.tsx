
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Project } from '@/types/supabase';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Copy, Share2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import { ShareProjectModal } from './ShareProjectModal';

interface ProjectTileProps {
  project: Project;
  onCopyUrl: (urlName: string) => void;
}

export const ProjectTile = ({ project, onCopyUrl }: ProjectTileProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const getColorClass = (colorScheme: string | null) => {
    switch (colorScheme) {
      case 'blue': return 'bg-blue-100 border-blue-500';
      case 'red': return 'bg-red-100 border-red-500';
      case 'orange': return 'bg-orange-100 border-orange-500';
      case 'green': return 'bg-green-100 border-green-500';
      case 'purple': return 'bg-purple-100 border-purple-500';
      case 'indigo': return 'bg-indigo-100 border-indigo-500';
      case 'pink': return 'bg-pink-100 border-pink-500';
      case 'teal': return 'bg-teal-100 border-teal-500';
      default: return 'bg-gray-100 border-gray-500';
    }
  };

  const projectUrl = `${window.location.origin}/${project.url_name}`;

  // Handler for copying project id
  const handleCopyProjectId = () => {
    navigator.clipboard.writeText(project.id);
    toast({
      title: 'Project ID Copied',
      description: t('Project ID has been copied to clipboard'),
    });
  };
  
  // Add share button if the project is owned by the current user (not shared)
  const isSharedProject = project.isShared || false;

  return (
    <>
      <Card 
        className={`border-2 ${getColorClass(project.color_scheme)} hover:shadow-lg transition-shadow relative`}
      >
        {isSharedProject && (
          <div className="absolute top-0 right-0 bg-blue-500 text-white px-2 py-1 text-xs rounded-bl-md">
            {t('Shared')}
          </div>
        )}
        
        <CardHeader>
          <CardTitle>{project.name}</CardTitle>
          <CardDescription>
            {project.status ? t('influencer.project.active') : t('influencer.project.inactive')}
            {isSharedProject && project.ownerEmail && (
              <div className="mt-1 text-sm text-blue-600">
                {t('Shared by')}: {project.ownerEmail}
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {project.landing_image && project.landing_image.trim() !== '' ? (
            <div className="w-full h-40 mb-4 overflow-hidden rounded">
              <img 
                src={project.landing_image} 
                alt={project.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-40 mb-4 overflow-hidden rounded bg-gray-200 flex items-center justify-center">
              <p className="text-gray-500">No image available</p>
            </div>
          )}
          <p className="text-sm text-gray-500">
            URL: <a 
              href={projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {projectUrl}
            </a>
          </p>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button 
            variant="outline"
            onClick={() => onCopyUrl(project.url_name)}
          >
            {t('influencer.project.copyUrl')}
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate(`/courses?projectId=${project.id}`)}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            {t('navigation.courses')}
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate(`/manage-knowledge/${project.id}`)}
          >
            <FileText className="mr-2 h-4 w-4" />
            {t('project.manageKnowledge')}
          </Button>
          {!isSharedProject && (
            <Button
              variant="outline"
              onClick={() => setShareModalOpen(true)}
            >
              <Share2 className="mr-2 h-4 w-4" />
              {t('Share')}
            </Button>
          )}
          {!isSharedProject && (
            <Button 
              onClick={() => navigate(`/edit-project/${project.id}`)}
            >
              {t('editButton')}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={handleCopyProjectId}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            {t('Copy Project ID')}
          </Button>
        </CardFooter>
      </Card>
      
      <ShareProjectModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        projectId={project.id}
        projectName={project.name}
      />
    </>
  );
};
