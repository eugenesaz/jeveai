
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import { Course } from '@/types/supabase';
import { AuthDialogs } from '@/components/auth/AuthDialogs';
import { toast } from '@/components/ui/use-toast';

interface CourseWithDates extends Course {
  begin_date?: string;
  end_date?: string;
}

const ViewCourse = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { user, userRole, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseWithDates | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  const isFromProjectLanding = location.state?.fromProjectLanding || false;

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setCourse(data as CourseWithDates);
        }
      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  const getTypeTranslation = (type: string) => {
    return t(`influencer.course.types.${type.toLowerCase()}`) || type;
  };

  const handleEnroll = async () => {
    if (!user) {
      setIsLoginOpen(true);
      return;
    }

    try {
      toast({
        title: t('info.coming_soon'),
        description: "Payment integration coming soon",
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to process payment',
        variant: 'destructive',
      });
    }
  };

  const handleGoBack = () => {
    if (isFromProjectLanding) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading course...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">Course not found</h1>
        <Button onClick={handleGoBack}>Go Back</Button>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="container mx-auto p-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">{course.name}</h1>
            <Button variant="ghost" onClick={handleGoBack}>
              {t('go.back')}
            </Button>
          </div>
        </header>

        <main className="container mx-auto p-6">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>{course.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-lg">{course.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">{t('customer.courses.type')}</h3>
                    <p className="text-lg">{getTypeTranslation(course.type)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">{t('customer.courses.duration')}</h3>
                    <p className="text-lg">
                      {course.duration === 0 
                        ? t('customer.courses.oneTime') 
                        : `${course.duration} ${t('customer.courses.days')}`}
                    </p>
                  </div>

                  {userRole === 'customer' && course.begin_date && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">{t('begin.date')}</h3>
                      <p className="text-lg">{new Date(course.begin_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">{t('customer.courses.price')}</h3>
                    <p className="text-lg">${course.price.toFixed(2)}</p>
                  </div>
                  
                  {userRole === 'customer' && course.duration > 0 && course.end_date && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">{t('end.date')}</h3>
                      <p className="text-lg">{new Date(course.end_date).toLocaleDateString()}</p>
                    </div>
                  )}

                  {course.telegram_bot && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">{t('influencer.course.telegramBot')}</h3>
                      <p className="text-lg">@{course.telegram_bot}</p>
                    </div>
                  )}
                </div>
              </div>

              {course.details && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2">{t('influencer.course.details')}</h3>
                  <div className="prose max-w-none bg-white p-6 rounded-md border">
                    <ReactMarkdown>{course.details}</ReactMarkdown>
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-center">
                <Button 
                  onClick={handleEnroll}
                  className="px-8 py-6 text-lg bg-blue-600 hover:bg-blue-700"
                >
                  {user ? t('customer.courses.pay_and_enroll', 'Pay & Enroll') : t('customer.courses.enroll', 'Enroll')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      <AuthDialogs
        isLoginOpen={isLoginOpen}
        setIsLoginOpen={setIsLoginOpen}
        isSignUpOpen={isSignUpOpen}
        setIsSignUpOpen={setIsSignUpOpen}
      />
    </>
  );
};

export default ViewCourse;
