
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

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

  const getBgGradient = () => {
    switch (colorScheme) {
      case 'blue': return 'from-blue-50 to-indigo-100';
      case 'red': return 'from-red-50 to-pink-100';
      case 'orange': return 'from-orange-50 to-amber-100';
      case 'green': return 'from-green-50 to-emerald-100';
      default: return 'from-purple-50 to-indigo-100';
    }
  };

  return (
    <>
      <section className="py-24 text-center">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            {t('influencer.benefits.title')}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            {t('influencer.benefits.subtitle')}
          </p>
          <Button 
            size="lg" 
            className={`${getButtonClass()} text-white px-8 py-6 text-lg font-medium rounded-lg`}
            onClick={onSignUpClick}
          >
            {t('landing.cta.start')} <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <section className={`py-24 bg-gradient-to-br ${getBgGradient()} rounded-none`}>
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
                  className={`${getButtonClass()} text-white px-8 py-3 text-lg font-medium self-start`}
                  onClick={onSignUpClick}
                >
                  {t('landing.cta.start')}
                </Button>
              </div>
              <div className="bg-cover bg-center hidden md:block" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&q=80&w=800&h=600)' }}>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
