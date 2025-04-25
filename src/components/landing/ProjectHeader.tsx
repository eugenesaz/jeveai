
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { ProjectLanguageSelector } from '@/components/landing/ProjectLanguageSelector';
import { cn } from '@/lib/utils';

interface ProjectHeaderProps {
  projectName: string;
  colorScheme: string | null;
  projectUrlName: string;
}

export function ProjectHeader({ projectName, colorScheme, projectUrlName }: ProjectHeaderProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const getHeaderColorClass = (colorScheme: string | null) => {
    switch (colorScheme) {
      case 'blue':
        return 'bg-blue-600';
      case 'red':
        return 'bg-red-600';
      case 'orange':
        return 'bg-orange-500';
      case 'green':
        return 'bg-green-600';
      default:
        return 'bg-purple-600';
    }
  };

  const getTextColorClass = () => {
    return 'text-white';
  };

  return (
    <header className={cn(getHeaderColorClass(colorScheme), "shadow-lg")}>
      <div className="container mx-auto py-3 px-6">
        <div className="flex items-center justify-between">
          <h1 className={cn("text-xl font-bold", getTextColorClass())}>
            {projectName}
          </h1>
          <div className="flex items-center gap-4">
            <ProjectLanguageSelector />
            {user && (
              <Button
                onClick={() => navigate('/enrolled-courses')}
                variant="outline"
                className="text-white border-white/30 hover:bg-white/10 hover:text-white"
                size="sm"
              >
                {t('navigation.my_courses', 'My Courses')}
              </Button>
            )}
            {!user && (
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="text-white border-white/30 hover:bg-white/10 hover:text-white"
                size="sm"
              >
                {t('navigation.login', 'Login')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
