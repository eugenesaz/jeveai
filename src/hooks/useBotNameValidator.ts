
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useBotNameValidator = () => {
  const [botNameError, setBotNameError] = useState('');

  const validateBotName = async (name: string) => {
    if (!name) return '';
    if (!/^[a-zA-Z0-9_@]+$/.test(name)) {
      const error = 'Bot name can only contain letters, numbers, underscores, and @ symbol';
      setBotNameError(error);
      return error;
    }
    
    const { data } = await supabase
      .from('courses')
      .select('telegram_bot')
      .eq('telegram_bot', name)
      .single();
    
    if (data) {
      const error = 'This bot name is already taken';
      setBotNameError(error);
      return error;
    }

    setBotNameError('');
    return '';
  };

  return { botNameError, validateBotName };
};
