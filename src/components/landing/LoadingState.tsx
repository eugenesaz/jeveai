
import { useTranslation } from 'react-i18next';
import { Spinner } from '@/components/ui/spinner';

export const LoadingState = () => {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Spinner size="lg" className="mb-4" />
        <p>{t('loading')}</p>
      </div>
    </div>
  );
};
