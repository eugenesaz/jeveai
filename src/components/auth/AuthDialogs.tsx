
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

interface AuthDialogsProps {
  isLoginOpen: boolean;
  setIsLoginOpen: (isOpen: boolean) => void;
  isSignUpOpen: boolean;
  setIsSignUpOpen: (isOpen: boolean) => void;
}

export const AuthDialogs = ({
  isLoginOpen,
  setIsLoginOpen,
  isSignUpOpen,
  setIsSignUpOpen
}: AuthDialogsProps) => {
  const { t } = useTranslation();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

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
      
      try {
        const { error } = await signIn(email, password);
        
        if (error) {
          console.error('Login error:', error);
          setAuthError(error.message);
          setLoginLoading(false);
        } else {
          console.log('Login successful, dialog closing');
          setIsLoginOpen(false);
        }
      } catch (err) {
        console.error('Login error:', err);
        setAuthError('An unexpected error occurred');
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
    <>
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
    </>
  );
};
