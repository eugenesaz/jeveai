import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { ProjectLanguageSelector } from '@/components/landing/ProjectLanguageSelector';
import { cn } from '@/lib/utils';
import { LogOut } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface ProjectHeaderProps {
  projectName: string;
  colorScheme: string | null;
  projectUrlName: string;
}

export function ProjectHeader({ projectName, colorScheme, projectUrlName }: ProjectHeaderProps) {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
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

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success(t('navigation.logout_success', 'Successfully logged out!'));
      navigate('/');
    } catch (error) {
      toast.error(t('navigation.logout_error', 'Logout failed!'));
      console.error('Logout error:', error);
    }
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
            {user ? (
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => navigate('/enrolled-courses')}
                  variant="outline"
                  className="text-white border-white/30 bg-white/10 hover:bg-white/20 hover:text-white"
                  size="sm"
                >
                  {t('navigation.my_courses', 'My Courses')}
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="text-white border-white/30 bg-white/10 hover:bg-white/20 hover:text-white"
                  size="sm"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('navigation.logout', 'Logout')}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="text-white border-white/30 bg-white/10 hover:bg-white/20 hover:text-white"
                  size="sm"
                >
                  {t('navigation.login', 'Login')}
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="text-white border-white/30 bg-white/10 hover:bg-white/20 hover:text-white"
                  size="sm"
                >
                  {t('navigation.signup', 'Sign Up')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
