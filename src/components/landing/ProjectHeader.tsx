import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ProjectLanguageSelector } from '@/components/landing/ProjectLanguageSelector';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

interface ProjectHeaderProps {
  projectName: string;
  colorScheme?: string;
}

export const ProjectHeader = ({ projectName, colorScheme = 'blue' }: ProjectHeaderProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success(t('navigation.logout_success'));
    } catch (error) {
      toast.error(t('navigation.logout_error'));
      console.error('Logout error:', error);
    }
  };

  return (
    <header className={`bg-${colorScheme}-500 text-white`}>
      <div className="container mx-auto p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">
          {projectName}
        </h1>
        <div className="flex items-center space-x-4">
          <ProjectLanguageSelector />
          {user ? (
            <>
              <Button 
                variant="outline" 
                className={cn(
                  "text-white border-white/30 hover:border-white/50 bg-white/10 hover:bg-white/20",
                  "transition-all duration-300 ease-in-out"
                )}
                onClick={handleLogout}
              >
                {t('navigation.logout')}
              </Button>
            </>
          ) : (
            <>
              <Link to="/">
                <Button 
                  variant="outline" 
                  className={cn(
                    "text-white border-white/30 hover:border-white/50 bg-white/10 hover:bg-white/20",
                    "transition-all duration-300 ease-in-out"
                  )}
                >
                  {t('navigation.login')}
                </Button>
              </Link>
              <Link to="/">
                <Button variant="default" className="text-white">
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
