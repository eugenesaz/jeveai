
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from '@/components/LanguageSelector';

interface LandingHeaderProps {
  onLoginClick: () => void;
  onSignUpClick: () => void;
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
}

export const LandingHeader = ({ 
  onLoginClick, 
  onSignUpClick,
  title,
  subtitle,
  backgroundImage
}: LandingHeaderProps) => {
  const { t } = useTranslation();

  // If title and subtitle are provided, render a different header style
  if (title && subtitle) {
    return (
      <div 
        className="py-20 bg-center bg-cover bg-no-repeat"
        style={{ 
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
          backgroundColor: backgroundImage ? undefined : '#f9fafb'
        }}
      >
        <div className="container mx-auto text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            {title}
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            {subtitle}
          </p>
        </div>
      </div>
    );
  }

  // Default header with login/signup buttons
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-purple-800">{t('app.name')}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <LanguageSelector />
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
