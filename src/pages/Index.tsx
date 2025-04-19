
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

const Index = () => {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();
  const navigate = useNavigate();
  const { user, signIn, signUp, signInWithGoogle, isLoading } = useAuth();

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  // Use useEffect for redirection after render
  useEffect(() => {
    if (!isLoading && user) {
      navigate('/dashboard');
    }
  }, [isLoading, user, navigate]);

  const handleAuth = async (isSignUp: boolean) => {
    setAuthError('');
    
    if (isSignUp) {
      setSignupLoading(true);
      
      if (password !== confirmPassword) {
        setAuthError(t('errors.passwordMatch'));
        setSignupLoading(false);
        return;
      }
      
      const { error } = await signUp(email, password, 'influencer');
      
      if (error) {
        setAuthError(error.message);
        setSignupLoading(false);
      } else {
        setIsSignUpOpen(false);
        setSignupLoading(false);
        toast({
          title: 'Success',
          description: 'Account created successfully!',
        });
      }
    } else {
      setLoginLoading(true);
      
      const { error } = await signIn(email, password);
      
      if (error) {
        setAuthError(error.message);
        setLoginLoading(false);
      } else {
        setIsLoginOpen(false);
        setLoginLoading(false);
      }
    }
  };

  const handleGoogleAuth = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-purple-800">{t('app.name')}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex space-x-1">
              <Button 
                variant={language === 'en' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => changeLanguage('en')}
                className="text-sm"
              >
                EN
              </Button>
              <Button 
                variant={language === 'ru' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => changeLanguage('ru')}
                className="text-sm"
              >
                RU
              </Button>
            </div>
            <Button variant="outline" onClick={() => setIsLoginOpen(true)}>
              {t('navigation.login')}
            </Button>
            <Button onClick={() => setIsSignUpOpen(true)}>
              {t('navigation.signup')}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        {/* Hero section */}
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
            onClick={() => setIsSignUpOpen(true)}
          >
            {t('get.started')}
          </Button>
        </section>

        {/* Benefits section */}
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

        {/* CTA section */}
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
            onClick={() => setIsSignUpOpen(true)}
          >
            {t('start.for.free')}
          </Button>
        </section>
      </main>

      <footer className="bg-gray-50 border-t border-gray-200 py-8">
        <div className="container mx-auto text-center text-gray-500">
          <p>© 2025 Paradise Knowledge Hub. All rights reserved.</p>
        </div>
      </footer>

      {/* Login Dialog */}
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('navigation.login')}</DialogTitle>
            <DialogDescription>
              {t('auth.hasAccount')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {authError && (
              <p className="text-sm text-red-500">{authError}</p>
            )}
            <Button
              onClick={handleGoogleAuth}
              variant="outline"
              className="w-full"
            >
              {t('auth.googleLogin')}
            </Button>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsLoginOpen(false);
                setIsSignUpOpen(true);
              }}
              className="sm:order-1"
            >
              {t('auth.signupNow')}
            </Button>
            <Button 
              onClick={() => handleAuth(false)} 
              disabled={loginLoading}
              className="sm:order-2"
            >
              {loginLoading ? 'Loading...' : t('navigation.login')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Signup Dialog */}
      <Dialog open={isSignUpOpen} onOpenChange={setIsSignUpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('navigation.signup')}</DialogTitle>
            <DialogDescription>
              {t('auth.noAccount')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="signup-email">{t('auth.email')}</Label>
              <Input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">{t('auth.password')}</Label>
              <Input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t('auth.confirmPassword')}</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {authError && (
              <p className="text-sm text-red-500">{authError}</p>
            )}
            <Button
              onClick={handleGoogleAuth}
              variant="outline"
              className="w-full"
            >
              {t('auth.googleLogin')}
            </Button>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsSignUpOpen(false);
                setIsLoginOpen(true);
              }}
              className="sm:order-1"
            >
              {t('auth.loginNow')}
            </Button>
            <Button 
              onClick={() => handleAuth(true)} 
              disabled={signupLoading}
              className="sm:order-2"
            >
              {signupLoading ? 'Loading...' : t('navigation.signup')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
