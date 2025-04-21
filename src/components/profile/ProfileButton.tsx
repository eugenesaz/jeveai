
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Spinner } from '@/components/ui/spinner';

export const ProfileButton = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [telegramName, setTelegramName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleOpenDialog = async () => {
    setIsOpen(true);

    if (user) {
      setLoading(true);
      try {
        // First check if profile exists
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('telegram')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError);
          throw profileError;
        }

        // If profile exists, set the telegram name
        if (profileData) {
          setTelegramName(profileData.telegram || '');
        } else {
          setTelegramName('');
          // Create profile if it doesn't exist
          console.log('Creating profile for user:', user.id);
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email
            });
          
          if (createError) {
            console.error('Error creating profile:', createError);
          }
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        setTelegramName('');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // First check if profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
      
      let updateError;
      
      // If profile exists, update it
      if (profileData) {
        const { error } = await supabase
          .from('profiles')
          .update({
            telegram: telegramName,
            email: user.email
          })
          .eq('id', user.id);
        
        updateError = error;
      } else {
        // Create profile if it doesn't exist
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            telegram: telegramName
          });
        
        updateError = error;
      }

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw updateError;
      }

      toast({
        title: t('profile.successTitle', { defaultValue: 'Success' }),
        description: t('profile.successDesc', { defaultValue: 'Profile updated successfully' }),
      });

      setIsOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: t('profile.errorTitle', { defaultValue: 'Error' }),
        description: t('profile.errorDesc', { defaultValue: 'Failed to update profile' }),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const getInitials = () => {
    const email = user.email || '';
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <Button
        variant="ghost"
        className="rounded-full p-0 h-10 w-10 overflow-hidden"
        onClick={handleOpenDialog}
        aria-label={t('profile.openProfile', { defaultValue: 'Open Profile' })}
      >
        <Avatar>
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('profile.title', { defaultValue: 'Profile' })}</DialogTitle>
            <DialogDescription>
              {t('profile.updateInfo', { defaultValue: 'Update your profile information' })}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('profile.email', { defaultValue: 'Email' })}</Label>
                <Input
                  id="email"
                  value={user.email || ''}
                  readOnly
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telegram">{t('profile.telegram', { defaultValue: 'Telegram' })}</Label>
                <Input
                  id="telegram"
                  value={telegramName}
                  onChange={(e) => setTelegramName(e.target.value)}
                  placeholder={t('profile.telegramPlaceholder', { defaultValue: 'Your Telegram username' })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              {t('cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Spinner className="mr-2 h-4 w-4" /> : null}
              {t('save', { defaultValue: 'Save' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
