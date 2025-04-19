
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useBotNameValidator = () => {
  const [botNameError, setBotNameError] = useState('');

  const validateBotName = async (name: string, originalName?: string) => {
    if (!name) {
      setBotNameError('');
      return '';
    }
    
    // Check for @ symbol
    if (name.includes('@')) {
      const error = 'Bot name should not include @ symbol, it will be added automatically';
      setBotNameError(error);
      return error;
    }
    
    // Check for valid characters
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      const error = 'Bot name can only contain letters, numbers, and underscores';
      setBotNameError(error);
      return error;
    }
    
    // If we're editing and the name hasn't changed, no need to check for duplicates
    if (originalName && name === originalName) {
      setBotNameError('');
      return '';
    }
    
    // Check for duplicate bot names
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
