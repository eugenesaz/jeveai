
import { Button } from '@/components/ui/button';
import { Plus, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const ProjectsHeader = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('influencer.project.title')}</h1>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/enrolled-courses')}
            className="flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Enrolled courses
          </Button>
          <Button 
            onClick={() => navigate('/courses')} 
            variant="ghost"
          >
            {t('navigation.courses')}
          </Button>
          <Button 
            onClick={() => navigate('/create-project')} 
            variant="default"
          >
            {t('influencer.project.createNew')}
          </Button>
        </div>
      </div>
    </header>
  );
};
