
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

  useEffect(() => {
    if (!isLoading && user?.id && !user.email) {
      console.log('Invalid user state detected, forcing logout');
      signOut();
    }
  }, [isLoading, user, signOut]);

  useEffect(() => {
    if (!isLoading && user) {
      console.log('User authenticated, redirecting to dashboard...');
      setRedirecting(true);
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, user, navigate]);

  // Clear any stale auth tokens on initial load that might be causing issues
  useEffect(() => {
    // This helps clear any problematic states that might have happened
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    if (errorParam || errorDescription) {
      console.error('Auth error detected:', errorParam, errorDescription);
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
    }
  }, []);

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
        title={undefined}
        subtitle={undefined}
        backgroundImage={undefined}
        colorScheme={"blue"}
      />

      <section className="relative bg-gradient-to-r from-purple-900 to-indigo-800 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 text-white">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                {t('landing.hero.title', 'Create your digital business')}
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-purple-100">
                {t('landing.hero.subtitle', 'Create hyper-personalized programs that adapt to your customers\' individual needs')}
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
                  className="text-purple-900 border-white bg-white hover:bg-gray-100 px-8 py-6 text-lg font-semibold"
                  onClick={() =>
                    document.getElementById("features-section")?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  {t('landing.cta.explore', 'Explore Features')}
                  <span className="ml-2">
                    <svg className="inline-block h-5 w-5" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                  </span>
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

      <section id="features-section" className="py-20 bg-white">
        <div className="container mx-auto px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">Platform Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 text-center">
            <div className="bg-purple-50 rounded-2xl p-7 shadow hover-scale transition">
              <svg className="mx-auto mb-4 h-10 w-10 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" /><path d="M9.09 9.05a6.37 6.37 0 0 1 5.82 0"/><path d="M7.41 13.67A7.35 7.35 0 0 1 12 12.49a7.35 7.35 0 0 1 4.59 1.18"/>
              </svg>
              <h3 className="font-bold text-lg mb-2">Create a virtual copy of yourself</h3>
              <p className="text-gray-600">Train your AI-powered digital persona and let it answer questions just like you do.</p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-7 shadow hover-scale transition">
              <svg className="mx-auto mb-4 h-10 w-10 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" /><path d="M8 15V9a4 4 0 1 1 8 0v6"/><path d="M9 21V9h6v12"/>
              </svg>
              <h3 className="font-bold text-lg mb-2">Let customers access you 24/7</h3>
              <p className="text-gray-600">Your digital self is always available to help your clients anytime, anywhere.</p>
            </div>
            <div className="bg-green-50 rounded-2xl p-7 shadow hover-scale transition">
              <svg className="mx-auto mb-4 h-10 w-10 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 3v4" /><path d="M8 3v4" />
              </svg>
              <h3 className="font-bold text-lg mb-2">Monetize your knowledge</h3>
              <p className="text-gray-600">Offer digital products, courses and subscriptions directly through your platform.</p>
            </div>
            <div className="bg-orange-50 rounded-2xl p-7 shadow hover-scale transition">
              <svg className="mx-auto mb-4 h-10 w-10 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" x2="12" y1="19" y2="22"></line>
              </svg>
              <h3 className="font-bold text-lg mb-2">Scale your business</h3>
              <p className="text-gray-600">Grow beyond geography, language, and channels with automated, multilingual support.</p>
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
