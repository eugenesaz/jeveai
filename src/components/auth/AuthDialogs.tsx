
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { Mail, Lock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { isGoogleUser } from '@/lib/AuthUtils';

interface AuthDialogsProps {
  isLoginOpen: boolean;
  setIsLoginOpen: (value: boolean) => void;
  isSignUpOpen: boolean;
  setIsSignUpOpen: (value: boolean) => void;
}

export const AuthDialogs = ({
  isLoginOpen,
  setIsLoginOpen,
  isSignUpOpen,
  setIsSignUpOpen,
}: AuthDialogsProps) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telegram, setTelegram] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t('auth.errors.missing_fields', 'Please fill in all fields.'));
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      setTimeout(() => {
        toast.success(t('auth.success.login', 'Successfully logged in!'));
        setIsLoginOpen(false);
        setEmail('');
        setPassword('');
      }, 100);
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error instanceof Error ? error.message : t('auth.errors.unknown', 'An unknown error occurred.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t('auth.errors.missing_fields', 'Please fill in all fields.'));
      return;
    }
    setLoading(true);
    try {
      // Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            telegram: telegram || null,
          },
        },
      });
      if (signUpError) throw signUpError;

      // Create profile
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: email,
            telegram: telegram || null,
            role: 'customer',
          });
        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }
      toast.success(t('auth.success.signup', 'Successfully signed up!'));
      setIsSignUpOpen(false);
      setEmail('');
      setPassword('');
      setTelegram('');
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error instanceof Error ? error.message : t('auth.errors.unknown', 'An unknown error occurred.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      console.log('Initiating Google sign in from AuthDialogs with redirectTo:', window.location.origin);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: window.location.origin
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Google auth error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : t('auth.errors.google', 'Failed to sign in with Google. Please try again.')
      );
      setLoading(false);
    }
    // Note: We don't set loading to false in the finally block because 
    // the page will redirect to Google's auth page
  };

  const toggleDialogs = () => {
    setIsLoginOpen(!isLoginOpen);
    setIsSignUpOpen(!isSignUpOpen);
    setEmail('');
    setPassword('');
    setTelegram('');
  };

  return (
    <>
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent className="sm:max-w-[410px] rounded-2xl glass-morphism bg-white/80 dark:bg-dark-charcoal/80 shadow-xl border-0 p-0 overflow-hidden">
          <div className="p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center text-purple-800 mb-2">
                {t('navigation.login', 'Login')}
              </DialogTitle>
              <DialogDescription className="text-center mb-4 text-gray-500">
                {t('auth.login_description', 'Sign in with your email and password below.')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email" className="block mb-1 text-sm text-gray-700">{t('auth.email', 'Email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-purple-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 text-base text-gray-800"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="password" className="block mb-1 text-sm text-gray-700">{t('auth.password', 'Password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-purple-400" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder={t('auth.password', 'Password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11 text-base text-gray-800"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full mt-2 bg-purple-800 hover:bg-purple-700 text-white font-semibold rounded-lg h-11 text-base transition" disabled={loading}>
                {loading ? t('loading', 'Loading...') : t('navigation.login', 'Login')}
              </Button>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-dark-charcoal px-2 text-gray-500">
                    {t('auth.or', 'OR')}
                  </span>
                </div>
              </div>
              
              <Button 
                type="button" 
                variant="outline" 
                className="w-full h-11 text-base flex items-center justify-center gap-2"
                onClick={handleGoogleAuth}
                disabled={loading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                </svg>
                {t('auth.login_with_google', 'Login with Google')}
              </Button>
              
              <div className="text-center text-sm mt-3">
                <span className="text-gray-500">
                  {t('auth.no_account', "Don't have an account?")}&nbsp;
                </span>
                <button
                  type="button"
                  className="text-primary underline underline-offset-2 hover:text-purple-600 transition"
                  onClick={toggleDialogs}
                >
                  {t('navigation.signup', 'Sign Up')}
                </button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSignUpOpen} onOpenChange={setIsSignUpOpen}>
        <DialogContent className="sm:max-w-[410px] rounded-2xl glass-morphism bg-white/80 dark:bg-dark-charcoal/80 shadow-xl border-0 p-0 overflow-hidden">
          <div className="p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center text-purple-800 mb-2">
                {t('navigation.signup', 'Sign Up')}
              </DialogTitle>
              <DialogDescription className="text-center mb-4 text-gray-500">
                {t('auth.signup_description', 'Create your account by filling the form below.')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <Label htmlFor="signupEmail" className="block mb-1 text-sm text-gray-700">{t('auth.email', 'Email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-purple-400" />
                  <Input
                    id="signupEmail"
                    type="email"
                    placeholder="your@email.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 text-base text-gray-800"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="signupPassword" className="block mb-1 text-sm text-gray-700">{t('auth.password', 'Password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-purple-400" />
                  <Input
                    id="signupPassword"
                    type="password"
                    placeholder={t('auth.password', 'Password')}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11 text-base text-gray-800"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="telegram" className="block mb-1 text-sm text-gray-700">
                  {t('profile.telegram', 'Telegram')}
                  <span className="text-xs text-gray-400 ml-1">{t('auth.telegram_optional', 'without @')}</span>
                </Label>
                <Input
                  id="telegram"
                  type="text"
                  placeholder={t('auth.telegram_placeholder', 'yourusername')}
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  className="h-11 text-base text-gray-800"
                />
              </div>
              <Button type="submit" className="w-full mt-2 bg-purple-800 hover:bg-purple-700 text-white font-semibold rounded-lg h-11 text-base transition" disabled={loading}>
                {loading ? t('loading', 'Loading...') : t('navigation.signup', 'Sign Up')}
              </Button>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-dark-charcoal px-2 text-gray-500">
                    {t('auth.or', 'OR')}
                  </span>
                </div>
              </div>
              
              <Button 
                type="button"
                variant="outline"
                className="w-full h-11 text-base flex items-center justify-center gap-2"
                onClick={handleGoogleAuth}
                disabled={loading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                </svg>
                {t('auth.signup_with_google', 'Sign up with Google')}
              </Button>
              
              <div className="text-center text-sm mt-3">
                <span className="text-gray-500">
                  {t('auth.hasAccount', "Already have an account?")}&nbsp;
                </span>
                <button
                  type="button"
                  className="text-primary underline underline-offset-2 hover:text-purple-600 transition"
                  onClick={toggleDialogs}
                >
                  {t('navigation.login', 'Login')}
                </button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
