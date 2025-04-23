import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { Mail, Lock } from 'lucide-react';

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
