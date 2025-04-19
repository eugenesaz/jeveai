
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface CallToActionProps {
  onSignUpClick: () => void;
}

export const CallToAction = ({ onSignUpClick }: CallToActionProps) => {
  const { t } = useTranslation();

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
          className="bg-purple-600 hover:bg-purple-700 text-white px-8"
          onClick={onSignUpClick}
        >
          {t('get.started')}
        </Button>
      </section>

      <section className="py-16 text-center bg-purple-100 rounded-lg p-10 mb-10">
        <h2 className="text-3xl font-bold mb-4 text-purple-900">
          {t('ready.to.start')}
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Join thousands of influencers who are already scaling their business with Paradise.
        </p>
        <Button 
          size="lg" 
          className="bg-purple-600 hover:bg-purple-700 text-white px-8"
          onClick={onSignUpClick}
        >
          {t('start.for.free')}
        </Button>
      </section>
    </>
  );
};
