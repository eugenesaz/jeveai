
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { CallToAction } from '@/components/landing/CallToAction';
import { Benefits } from '@/components/landing/Benefits';
import { AuthDialogs } from '@/components/auth/AuthDialogs';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { ArrowRight, MessageSquare, Users, Star } from 'lucide-react';

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isLoading, signOut } = useAuth();

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Check for invalid auth state and force logout if needed
  useEffect(() => {
    if (!isLoading && user?.id && !user.email) {
      console.log('Invalid user state detected, forcing logout');
      signOut();
    }
  }, [isLoading, user, signOut]);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      console.log('User authenticated, redirecting to dashboard...');
      setRedirecting(true);
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 500); // Increased timeout for better state synchronization
      return () => clearTimeout(timer);
    }
  }, [isLoading, user, navigate]);

  if (isLoading || redirecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-purple-50 to-blue-50">
        <Spinner className="h-10 w-10 mb-4" />
        <p className="text-lg">{t(redirecting ? 'landing.redirecting' : 'landing.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <LandingHeader
        onLoginClick={() => setIsLoginOpen(true)}
        onSignUpClick={() => setIsSignUpOpen(true)}
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-purple-900 to-indigo-800 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 text-white">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                {t('landing.hero.title', 'Scale Your Influence Through Personalization')}
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-purple-100">
                {t('landing.hero.subtitle', 'Create hyper-personalized programs that adapt to your customers' individual needs')}
              </p>
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  className="bg-white text-purple-900 hover:bg-purple-50 px-8 py-6 text-lg font-semibold"
                  onClick={() => setIsSignUpOpen(true)}
                >
                  {t('landing.cta.start', 'Get Started')}
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-white border-white hover:bg-white/10 px-8 py-6 text-lg font-semibold"
                  onClick={() => navigate('/projects')}
                >
                  {t('landing.cta.explore', 'Explore Features')} <ArrowRight className="ml-2" />
                </Button>
              </div>
            </div>
            <div className="lg:w-1/2">
              <div className="relative rounded-xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&q=80&w=700&h=500" 
                  alt="Influencer scaling their business" 
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-gray-900">
            {t('landing.value.title', 'Transform How You Connect With Your Audience')}
          </h2>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="bg-purple-50 rounded-xl p-8 text-center hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-800 mb-6">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">{t('landing.value.personalize.title', 'Hyper-Personalized Communication')}</h3>
              <p className="text-gray-600">{t('landing.value.personalize.description', 'Connect with each customer individually through automated but personalized communications')}</p>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-8 text-center hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-800 mb-6">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">{t('landing.value.scale.title', 'Scale Your Impact')}</h3>
              <p className="text-gray-600">{t('landing.value.scale.description', 'Reach more people without sacrificing the quality of your program or your personal touch')}</p>
            </div>
            
            <div className="bg-indigo-50 rounded-xl p-8 text-center hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-800 mb-6">
                <Star className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">{t('landing.value.adapt.title', 'Adaptive Programs')}</h3>
              <p className="text-gray-600">{t('landing.value.adapt.description', 'Tune your offerings to meet the specific needs of each customer for better results')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            {t('landing.testimonials.title', 'Trusted by Influencers Worldwide')}
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-6 italic">"{t('landing.testimonials.quote1', 'I've doubled my client base while actually improving my personalized service. The system adapts to each client's needs automatically.')}"</p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center text-purple-700 font-bold text-lg mr-4">JD</div>
                <div>
                  <p className="font-bold">{t('landing.testimonials.name1', 'Jane Doe')}</p>
                  <p className="text-sm text-gray-500">{t('landing.testimonials.role1', 'Fitness Coach')}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-6 italic">"{t('landing.testimonials.quote2', 'The adaptive programs feature has completely transformed how I deliver value to my clients. The results speak for themselves.')}"</p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg mr-4">MS</div>
                <div>
                  <p className="font-bold">{t('landing.testimonials.name2', 'Mark Smith')}</p>
                  <p className="text-sm text-gray-500">{t('landing.testimonials.role2', 'Business Coach')}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-6 italic">"{t('landing.testimonials.quote3', 'My customers rave about how the program feels like it was made just for them. I've increased retention rates by 70%.')}"</p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-700 font-bold text-lg mr-4">AL</div>
                <div>
                  <p className="font-bold">{t('landing.testimonials.name3', 'Amy Lee')}</p>
                  <p className="text-sm text-gray-500">{t('landing.testimonials.role3', 'Nutrition Expert')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Benefits />
      
      <CallToAction onSignUpClick={() => setIsSignUpOpen(true)} />

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">{t('app.name')}</h3>
              <p className="text-gray-400">{t('landing.footer.description', 'Empowering influencers to scale their business through personalization')}</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t('landing.footer.links', 'Quick Links')}</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">{t('landing.footer.about', 'About Us')}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">{t('landing.footer.features', 'Features')}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">{t('landing.footer.pricing', 'Pricing')}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">{t('landing.footer.contact', 'Contact')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t('landing.footer.legal', 'Legal')}</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">{t('landing.footer.terms', 'Terms of Service')}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">{t('landing.footer.privacy', 'Privacy Policy')}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
            <p>© {new Date().getFullYear()} {t('app.name')}. {t('landing.rights')}</p>
          </div>
        </div>
      </footer>

      <AuthDialogs
        isLoginOpen={isLoginOpen}
        setIsLoginOpen={setIsLoginOpen}
        isSignUpOpen={isSignUpOpen}
        setIsSignUpOpen={setIsSignUpOpen}
      />
    </div>
  );
};

export default Index;
