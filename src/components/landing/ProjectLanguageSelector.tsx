
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Languages } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ProjectLanguageSelector = () => {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    const detectedLang = navigator.language.split('-')[0];
    if (detectedLang && (detectedLang === 'en' || detectedLang === 'ru')) {
      i18n.changeLanguage(detectedLang);
    }
  }, [i18n]);

  return (
    <div className="flex items-center gap-2">
      <Languages className="h-4 w-4 text-white" />
      <Select value={i18n.language} onValueChange={i18n.changeLanguage}>
        <SelectTrigger 
          className={cn(
            "w-[120px] text-white border-white/30 hover:border-white/50 bg-white/10 hover:bg-white/20",
            "transition-all duration-300 ease-in-out"
          )}
        >
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="ru">Русский</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
