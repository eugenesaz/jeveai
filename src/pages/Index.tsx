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
import { checkAuthUrlErrors, clearAuthUrlParams, handleAuthResponse, checkAndFixSupabaseConfig, getAndClearSavedRedirectData } from '@/lib/AuthUtils';
import { ArrowRight, Brain, Users, Sparkles, Star } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isLoading, signOut } = useAuth();

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [processingAuth, setProcessingAuth] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      setProcessingAuth(true);
      
      await checkAndFixSupabaseConfig();
      
      if (window.location.hash) {
        console.log('Checking URL hash for auth tokens:', window.location.hash.substring(0, 20) + '...');
        
        if (window.location.hash.includes('access_token')) {
          console.log('Detected auth tokens in URL hash, handling authentication...');
          const success = await handleAuthResponse();
          if (success) {
            toast.success('Successfully logged in with Google');
            // We'll navigate in the next useEffect when user is available
          }
        } else {
          console.log('URL hash present but no access token found');
        }
      }
      
      const { hasError, errorMessage } = checkAuthUrlErrors();
      if (hasError) {
        toast.error(errorMessage || 'Authentication error occurred');
        clearAuthUrlParams();
      }
      
      if (window.location.search || window.location.hash) {
        console.log('Cleaning URL params and hash');
        clearAuthUrlParams();
      }
      
      setProcessingAuth(false);
    };
    
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading && user?.id && !user.email) {
      console.log('Invalid user state detected, forcing logout');
      signOut();
    }
  }, [isLoading, user, signOut]);

  useEffect(() => {
    if (!isLoading && !processingAuth && user) {
      console.log('User authenticated, checking for redirect data...');
      setRedirecting(true);
      
      const savedRedirectData = getAndClearSavedRedirectData();
      
      const timer = setTimeout(() => {
        if (savedRedirectData.path) {
          console.log('Redirecting to saved path:', savedRedirectData.path);
          
          if (savedRedirectData.courseId && savedRedirectData.action === 'enroll') {
            navigate(`/course/${savedRedirectData.courseId}`);
          } else {
            navigate(savedRedirectData.path);
          }
        } else {
          console.log('No saved path found, redirecting to dashboard...');
          navigate('/dashboard');
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, processingAuth, user, navigate]);

  if (isLoading || processingAuth || redirecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-ai-light">
        <Spinner className="h-10 w-10 mb-4 text-ai-purple" />
        <p className="text-lg text-ai-dark">
          {t(
            redirecting 
              ? 'landing.redirecting' 
              : processingAuth 
                ? 'landing.processing_auth' 
                : 'landing.loading'
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ai-light">
      <LandingHeader
        onLoginClick={() => setIsLoginOpen(true)}
        onSignUpClick={() => setIsSignUpOpen(true)}
      />

      <section className="relative bg-gradient-to-br from-ai-blue via-ai-purple to-ai-pink py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M 8 0 L 0 0 0 8" fill="none" stroke="white" strokeWidth="0.5" opacity="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 text-white">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                {t('landing.hero.title', 'Create your digital business')}
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-white/90">
                {t('landing.hero.subtitle', 'Create hyper-personalized programs that adapt to your customers\' individual needs')}
              </p>
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  className="bg-white text-ai-purple hover:bg-ai-light hover:text-ai-dark px-8 py-6 text-lg font-semibold shadow-lg transition-all duration-300"
                  onClick={() => setIsSignUpOpen(true)}
                >
                  {t('landing.cta.start', 'Get Started')}
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  className="text-white border-white bg-transparent hover:bg-white/10 px-8 py-6 text-lg font-semibold transition-all duration-300"
                  onClick={() =>
                    document.getElementById("features-section")?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  {t('landing.cta.explore', 'Explore Features')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="lg:w-1/2">
              <div className="relative rounded-xl overflow-hidden shadow-2xl animate-float">
                <img 
                  src="/lovable-uploads/b7617ba3-6580-4f6b-b9b8-f4debb8d3995.png" 
                  alt="AI digital persona interacting with customers" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ai-purple/20 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features-section" className="py-20 bg-white">
        <div className="container mx-auto px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-ai-dark">Platform Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 text-center">
            <div className="bg-gradient-to-br from-ai-blue/10 to-ai-pink/10 rounded-2xl p-7 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-ai-blue/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-ai-dark" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-ai-dark">Create a virtual copy of yourself</h3>
              <p className="text-gray-600">Train your AI-powered digital persona and let it answer questions just like you do.</p>
            </div>
            <div className="bg-gradient-to-br from-ai-blue/10 to-ai-pink/10 rounded-2xl p-7 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-ai-purple/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-ai-dark" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-ai-dark">Let customers access you 24/7</h3>
              <p className="text-gray-600">Your digital self is always available to help your clients anytime, anywhere.</p>
            </div>
            <div className="bg-gradient-to-br from-ai-blue/10 to-ai-pink/10 rounded-2xl p-7 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-ai-pink/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-ai-dark" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-ai-dark">Monetize your knowledge</h3>
              <p className="text-gray-600">Offer digital products, courses and subscriptions directly through your platform.</p>
            </div>
            <div className="bg-gradient-to-br from-ai-blue/10 to-ai-pink/10 rounded-2xl p-7 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-ai-glow/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-ai-dark" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-ai-dark">Scale your business</h3>
              <p className="text-gray-600">Grow beyond geography, language, and channels with automated, multilingual support.</p>
            </div>
          </div>
        </div>
      </section>

      <Benefits />
      
      <CallToAction onSignUpClick={() => setIsSignUpOpen(true)} />

      <footer className="bg-ai-dark text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Jeve.ai</h3>
              <p className="text-gray-300">{t('landing.footer.description', 'Empowering influencers to scale their business through personalization')}</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t('landing.footer.links', 'Quick Links')}</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">{t('landing.footer.about', 'About Us')}</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">{t('landing.footer.features', 'Features')}</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">{t('landing.footer.pricing', 'Pricing')}</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">{t('landing.footer.contact', 'Contact')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t('landing.footer.legal', 'Legal')}</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">{t('landing.footer.terms', 'Terms of Service')}</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">{t('landing.footer.privacy', 'Privacy Policy')}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} Jeve.ai. {t('landing.rights')}</p>
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
