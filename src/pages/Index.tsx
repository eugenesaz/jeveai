
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { CallToAction } from '@/components/landing/CallToAction';
import { Benefits } from '@/components/landing/Benefits';
import { AuthDialogs } from '@/components/auth/AuthDialogs';
import { Spinner } from '@/components/ui/spinner';

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
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50">
      <LandingHeader
        onLoginClick={() => setIsLoginOpen(true)}
        onSignUpClick={() => setIsSignUpOpen(true)}
      />

      <main className="container mx-auto p-6">
        <CallToAction onSignUpClick={() => setIsSignUpOpen(true)} />
        <Benefits />
      </main>

      <footer className="bg-gray-50 border-t border-gray-200 py-8">
        <div className="container mx-auto text-center text-gray-500">
          <p>{t('landing.footer')}</p>
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
