
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('influencer.dashboard.title')}</h1>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => navigate('/')}>
              {t('navigation.home')}
            </Button>
            <Button variant="ghost" onClick={() => navigate('/projects')}>
              {t('navigation.projects')}
            </Button>
            <Button variant="ghost" onClick={signOut}>
              {t('navigation.logout')}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('influencer.dashboard.projects')}</CardTitle>
              <CardDescription>
                {t('influencer.project.createNew')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>{t('influencer.benefits.scaleYourBusiness')}</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => navigate('/projects')}>
                {t('navigation.projects')}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('influencer.dashboard.courses')}</CardTitle>
              <CardDescription>
                {t('influencer.course.createNew')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>{t('influencer.benefits.virtualAssistant')}</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => navigate('/courses')}>
                {t('navigation.courses')}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('influencer.dashboard.customers')}</CardTitle>
              <CardDescription>
                {t('influencer.benefits.hyperPersonalized')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>{t('influencer.benefits.access247')}</p>
            </CardContent>
            <CardFooter>
              <Button disabled>
                {t('coming.soon')}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
