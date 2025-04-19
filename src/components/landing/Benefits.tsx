
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';

export const Benefits = () => {
  const { t } = useTranslation();

  return (
    <section className="py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <Card className="border border-purple-100 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-8">
            <div className="mb-6 text-purple-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" x2="12" y1="19" y2="22"></line>
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-purple-900">
              {t('influencer.benefits.virtualAssistant')}
            </h3>
            <p className="text-gray-600">
              Train your AI assistant with your expertise to help followers even when you're not available.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-purple-100 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-8">
            <div className="mb-6 text-purple-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 20h.01"></path>
                <path d="M7 20v-4"></path>
                <path d="M12 20v-8"></path>
                <path d="M17 20V8"></path>
                <path d="M22 4v16"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-purple-900">
              {t('influencer.benefits.scaleYourBusiness')}
            </h3>
            <p className="text-gray-600">
              Reach more followers and scale your business with cutting-edge AI technology.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-purple-100 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-8">
            <div className="mb-6 text-purple-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-purple-900">
              {t('influencer.benefits.access247')}
            </h3>
            <p className="text-gray-600">
              Your followers get access to your knowledge and advice 24/7, no matter where they are.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-purple-100 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-8">
            <div className="mb-6 text-purple-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line>
                <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line>
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-purple-900">
              {t('influencer.benefits.hyperPersonalized')}
            </h3>
            <p className="text-gray-600">
              Offer personalized experiences based on each follower's unique needs and goals.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
