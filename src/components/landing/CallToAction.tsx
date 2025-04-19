
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface CallToActionProps {
  onSignUpClick: () => void;
  colorScheme?: 'blue' | 'red' | 'orange' | 'green';
}

export const CallToAction = ({ onSignUpClick, colorScheme = 'blue' }: CallToActionProps) => {
  const { t } = useTranslation();
  
  // Get color based on scheme
  const getButtonClass = () => {
    switch (colorScheme) {
      case 'blue': return 'bg-blue-600 hover:bg-blue-700';
      case 'red': return 'bg-red-600 hover:bg-red-700';
      case 'orange': return 'bg-orange-600 hover:bg-orange-700';
      case 'green': return 'bg-green-600 hover:bg-green-700';
      default: return 'bg-purple-600 hover:bg-purple-700';
    }
  };

  const getBgClass = () => {
    switch (colorScheme) {
      case 'blue': return 'bg-blue-100';
      case 'red': return 'bg-red-100';
      case 'orange': return 'bg-orange-100';
      case 'green': return 'bg-green-100';
      default: return 'bg-purple-100';
    }
  };

  return (
    <>
      <section className="py-16 text-center">
        <h1 className="text-5xl font-bold mb-4 text-purple-900">
          {t('influencer.benefits.title')}
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
          {t('influencer.benefits.subtitle')}
        </p>
        <Button 
          size="lg" 
          className={`${getButtonClass()} text-white px-8`}
          onClick={onSignUpClick}
        >
          {t('landing.cta.start')}
        </Button>
      </section>

      <section className={`py-16 text-center ${getBgClass()} rounded-lg p-10 mb-10`}>
        <h2 className="text-3xl font-bold mb-4 text-purple-900">
          {t('landing.cta.ready')}
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          {t('landing.cta.join')}
        </p>
        <Button 
          size="lg" 
          className={`${getButtonClass()} text-white px-8`}
          onClick={onSignUpClick}
        >
          {t('landing.cta.start')}
        </Button>
      </section>
    </>
  );
};
