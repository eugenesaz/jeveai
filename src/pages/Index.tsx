
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { CallToAction } from '@/components/landing/CallToAction';
import { Benefits } from '@/components/landing/Benefits';
import { AuthDialogs } from '@/components/auth/AuthDialogs';

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  useEffect(() => {
    console.log('Index page useEffect:', { isLoading, user: user?.id });
    
    if (!isLoading && user) {
      console.log('Redirecting to dashboard...');
      navigate('/dashboard');
    }
  }, [isLoading, user, navigate]);

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
          <p>© 2025 Paradise Knowledge Hub. All rights reserved.</p>
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
