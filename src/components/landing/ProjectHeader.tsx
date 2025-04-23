
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ProjectLanguageSelector } from '@/components/landing/ProjectLanguageSelector';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { AuthDialogs } from '@/components/auth/AuthDialogs';
import { ArrowLeft, BookOpen, LogOut, LogIn, UserPlus } from 'lucide-react';

interface ProjectHeaderProps {
  projectName: string;
  colorScheme?: string;
  projectUrlName?: string;
}

export const ProjectHeader = ({ projectName, colorScheme = 'blue', projectUrlName }: ProjectHeaderProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
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
    <>
      <header className={`bg-${colorScheme}-500 text-white`}>
        <div className="container mx-auto p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">
            {projectName}
          </h1>
          <div className="flex items-center space-x-4">
            <ProjectLanguageSelector />
            <Button
              variant="outline"
              className={cn("text-white border-white/30 hover:border-white/50 bg-white/10 hover:bg-white/20 transition-all duration-300 ease-in-out flex items-center gap-2")}
              onClick={() => navigate(`/${projectUrlName}`)}
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              {t('Back', 'Back')}
            </Button>
            {user ? (
              <>
                <Button 
                  variant="outline" 
                  className={cn("text-white border-white/30 hover:border-white/50 bg-white/10 hover:bg-white/20 transition-all duration-300 ease-in-out flex items-center gap-2")}
                  onClick={() => navigate('/enrolled-courses')}
                >
                  <BookOpen className="mr-2 w-4 h-4" />
                  {t('navigation.my_courses', 'My courses')}
                </Button>
                <Button 
                  variant="outline" 
                  className={cn("text-white border-white/30 hover:border-white/50 bg-white/10 hover:bg-white/20 transition-all duration-300 ease-in-out flex items-center gap-2")}
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 w-4 h-4" />
                  {t('navigation.logout')}
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  className={cn("text-white border-white/30 hover:border-white/50 bg-white/10 hover:bg-white/20 transition-all duration-300 ease-in-out flex items-center gap-2")}
                  onClick={() => setIsLoginOpen(true)}
                >
                  <LogIn className="mr-2 w-4 h-4" />
                  {t('navigation.login')}
                </Button>
                <Button 
                  variant="default" 
                  className="text-white flex items-center gap-2"
                  onClick={() => setIsSignUpOpen(true)}
                >
                  <UserPlus className="mr-2 w-4 h-4" />
                  {t('navigation.signup')}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <AuthDialogs
        isLoginOpen={isLoginOpen}
        setIsLoginOpen={setIsLoginOpen}
        isSignUpOpen={isSignUpOpen}
        setIsSignUpOpen={setIsSignUpOpen}
      />
    </>
  );
};
