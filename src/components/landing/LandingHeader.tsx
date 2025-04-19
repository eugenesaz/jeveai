
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

interface LandingHeaderProps {
  onLoginClick: () => void;
  onSignUpClick: () => void;
}

export const LandingHeader = ({ onLoginClick, onSignUpClick }: LandingHeaderProps) => {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-purple-800">{t('app.name')}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex space-x-1">
            <Button 
              variant={language === 'en' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => changeLanguage('en')}
              className="text-sm"
            >
              EN
            </Button>
            <Button 
              variant={language === 'ru' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => changeLanguage('ru')}
              className="text-sm"
            >
              RU
            </Button>
          </div>
          <Button variant="outline" onClick={onLoginClick}>
            {t('navigation.login')}
          </Button>
          <Button onClick={onSignUpClick}>
            {t('navigation.signup')}
          </Button>
        </div>
      </div>
    </header>
  );
};
