
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ProjectLanguageSelector } from '@/components/landing/ProjectLanguageSelector';
import { useAuth } from '@/contexts/AuthContext';

interface ProjectHeaderProps {
  projectName: string;
  colorScheme?: string;
}

export const ProjectHeader = ({ projectName, colorScheme = 'blue' }: ProjectHeaderProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <header className={`bg-${colorScheme}-500 text-white`}>
      <div className="container mx-auto p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">
          {projectName}
        </h1>
        <div className="flex items-center space-x-4">
          <ProjectLanguageSelector />
          {!user && (
            <>
              <Link to="/">
                <Button variant="outline" className="text-white border-white hover:bg-white/20">
                  {t('navigation.login')}
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline" className="text-white border-white hover:bg-white/20">
                  {t('navigation.signup')}
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
