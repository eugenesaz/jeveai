
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

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
      toast.error(t('auth.errors.missing_fields'));
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Force a slight delay to ensure auth state is fully processed
      setTimeout(() => {
        toast.success(t('auth.success.login'));
        setIsLoginOpen(false);
        setEmail('');
        setPassword('');
      }, 100);
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error instanceof Error ? error.message : t('auth.errors.unknown'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error(t('auth.errors.missing_fields'));
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
      
      toast.success(t('auth.success.signup'));
      setIsSignUpOpen(false);
      setEmail('');
      setPassword('');
      setTelegram('');
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error instanceof Error ? error.message : t('auth.errors.unknown'));
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('auth.login')}</DialogTitle>
            <DialogDescription>
              {t('auth.login_description')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.loading') : t('auth.login')}
            </Button>
            <div className="text-center text-sm">
              <span className="text-gray-500">
                {t('auth.no_account')}{' '}
              </span>
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={toggleDialogs}
              >
                {t('auth.create_account')}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isSignUpOpen} onOpenChange={setIsSignUpOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('auth.signup')}</DialogTitle>
            <DialogDescription>
              {t('auth.signup_description')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSignUp} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="signupEmail">{t('auth.email')}</Label>
              <Input
                id="signupEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signupPassword">{t('auth.password')}</Label>
              <Input
                id="signupPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telegram">
                Telegram Username (optional)
                <span className="text-xs text-gray-500 ml-1">without @</span>
              </Label>
              <Input
                id="telegram"
                type="text"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="yourusername"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.loading') : t('auth.signup')}
            </Button>
            <div className="text-center text-sm">
              <span className="text-gray-500">
                {t('auth.have_account')}{' '}
              </span>
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={toggleDialogs}
              >
                {t('auth.login')}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
