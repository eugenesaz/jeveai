
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface CallToActionProps {
  onSignUpClick: () => void;
  colorScheme?: 'blue' | 'red' | 'orange' | 'green';
}

export const CallToAction = ({ onSignUpClick, colorScheme = 'blue' }: CallToActionProps) => {
  const { t } = useTranslation();
  
  // Get button color based on scheme
  const getButtonClass = () => {
    return 'bg-gradient-to-r from-ai-blue to-ai-purple text-white hover:opacity-90';
  };

  return (
    <>
      <section className="py-24 text-center bg-gradient-to-tr from-ai-light via-white to-ai-blue/5">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-ai-dark">
            {t('influencer.benefits.title')}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            {t('influencer.benefits.subtitle')}
          </p>
          <Button 
            size="lg" 
            className={`${getButtonClass()} px-8 py-6 text-lg font-medium rounded-lg shadow-md`}
            onClick={onSignUpClick}
          >
            {t('landing.cta.start')} <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-br from-ai-blue/10 via-ai-purple/10 to-ai-pink/10 rounded-none">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-12 md:p-16 flex flex-col justify-center">
                <h2 className="text-3xl font-bold mb-6 text-gray-900">
                  {t('landing.cta.ready')}
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  {t('landing.cta.join')}
                </p>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-ai-blue to-ai-purple text-white hover:opacity-90 shadow-md px-8 py-3 text-lg font-medium self-start"
                  onClick={onSignUpClick}
                >
                  {t('landing.cta.start')}
                </Button>
              </div>
              <div className="bg-cover bg-center hidden md:block" style={{ backgroundImage: 'url(/lovable-uploads/b7617ba3-6580-4f6b-b9b8-f4debb8d3995.png)' }}>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
