
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, Home, List, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

export const ProjectsHeader = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

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
    <header className="bg-gradient-to-r from-ai-blue to-ai-purple text-white shadow-sm">
      <div className="container mx-auto p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('projects.title', 'Projects')}</h1>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/enrolled-courses')}
            className="flex items-center gap-2 text-white border-white/30 bg-white/20 hover:bg-white/30 hover:text-white"
          >
            <BookOpen className="w-4 h-4" />
            {t('navigation.my_courses', 'My courses')}
          </Button>
          <Button 
            onClick={() => navigate('/courses')} 
            variant="outline"
            className="flex items-center gap-2 text-white border-white/30 bg-white/20 hover:bg-white/30 hover:text-white"
          >
            <List className="w-4 h-4" />
            {t('navigation.courses')}
          </Button>
          <Button 
            onClick={handleLogout} 
            variant="outline"
            className="flex items-center gap-2 text-white border-white/30 bg-white/20 hover:bg-white/30 hover:text-white"
          >
            <LogOut className="w-4 h-4" />
            {t('navigation.logout')}
          </Button>
          <Button 
            onClick={() => navigate('/create-project')} 
            variant="default"
            className="flex items-center gap-2 bg-white text-ai-purple hover:bg-ai-light"
          >
            <Plus className="w-4 h-4" />
            {t('influencer.project.createNew')}
          </Button>
        </div>
      </div>
    </header>
  );
};
