
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

interface ErrorStateProps {
  error: string | null;
}

export const ErrorState = ({ error }: ErrorStateProps) => {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">{error || 'Project not found'}</h1>
        <p className="mb-4">{t('errors.projectNotFoundOrInactive')}</p>
        <Link to="/" className="text-blue-500 hover:underline">
          {t('navigation.goHome')}
        </Link>
      </div>
    </div>
  );
};
