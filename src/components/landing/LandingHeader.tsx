
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { ProfileButton } from '@/components/profile/ProfileButton';

interface LandingHeaderProps {
  onLoginClick?: () => void;
  onSignUpClick?: () => void;
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
  colorScheme?: 'blue' | 'red' | 'orange' | 'green';
}

export const LandingHeader = ({ 
  onLoginClick, 
  onSignUpClick,
  title,
  subtitle,
  backgroundImage,
  colorScheme = 'blue'
}: LandingHeaderProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();

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

  // Get color based on scheme
  const getHeaderColorClass = () => {
    switch (colorScheme) {
      case 'blue': return 'bg-blue-500 text-white';
      case 'red': return 'bg-red-500 text-white';
      case 'orange': return 'bg-orange-500 text-white';
      case 'green': return 'bg-green-500 text-white';
      default: return 'bg-white';
    }
  };

  // Default header with login/signup buttons
  return (
    <header className={user ? getHeaderColorClass() : "bg-white shadow-sm"}>
      <div className="container mx-auto p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <h1 className={`text-2xl font-bold ${user ? 'text-white' : 'text-purple-800'}`}>
            {t('app.name')}
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <LanguageSelector />
          
          {user ? (
            <>
              <Link to="/dashboard">
                <Button variant={colorScheme ? "outline" : "outline"} className={colorScheme ? "text-white border-white hover:bg-white/20" : ""}>
                  {t('influencer.dashboard.title')}
                </Button>
              </Link>
              <ProfileButton />
            </>
          ) : (
            <>
              {onLoginClick && (
                <Button variant="outline" onClick={onLoginClick}>
                  {t('navigation.login')}
                </Button>
              )}
              {onSignUpClick && (
                <Button onClick={onSignUpClick}>
                  {t('navigation.signup')}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};
