
import { Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const LanguageSelector = () => {
  const { language, changeLanguage } = useLanguage();

  return (
    <Select value={language} onValueChange={changeLanguage}>
      <SelectTrigger className="w-[120px]">
        <SelectValue>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {language === 'en' ? 'English' : 'Русский'}
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">
          <div className="flex items-center gap-2">
            <span>🇺🇸</span>
            English
          </div>
        </SelectItem>
        <SelectItem value="ru">
          <div className="flex items-center gap-2">
            <span>🇷🇺</span>
            Русский
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};
