import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import { Course } from '@/types/supabase';
import { AuthDialogs } from '@/components/auth/AuthDialogs';
import { toast } from '@/components/ui/use-toast';
import { FakePaymentDialog } from "@/components/FakePaymentDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MessageSquare } from 'lucide-react';
import { TelegramWarning } from '@/components/profile/TelegramWarning';

interface CourseWithDates extends Course {
  begin_date?: string;
  end_date?: string;
}

interface EnrollmentInfo {
  is_enrolled: boolean;
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
  const [enrollmentInfo, setEnrollmentInfo] = useState<EnrollmentInfo>({ is_enrolled: false });
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [userTelegram, setUserTelegram] = useState<string | null>(null);

  const isFromProjectLanding = location.state?.fromProjectLanding || false;

  useEffect(() => {
    const fetchCourseAndEnrollment = async () => {
      if (!id) return;

      try {
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', id)
          .single();

        if (courseError) {
          throw courseError;
        }

        setCourse(courseData as CourseWithDates);
        
        if (user) {
          const { data: enrollmentData, error: enrollmentError } = await supabase
            .from('enrollments')
            .select('*')
            .eq('user_id', user.id)
            .eq('course_id', id)
            .eq('is_paid', true)
            .single();
            
          if (!enrollmentError && enrollmentData) {
            setEnrollmentInfo({
              is_enrolled: true,
              begin_date: enrollmentData.begin_date,
              end_date: enrollmentData.end_date
            });
          }

          const { data: profileData } = await supabase
            .from('profiles')
            .select('telegram')
            .eq('id', user.id)
            .single();
            
          if (profileData) {
            setUserTelegram(profileData.telegram);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseAndEnrollment();
  }, [id, user]);

  const getTypeTranslation = (type: string) => {
    return t(`influencer.course.types.${type.toLowerCase()}`) || type;
  };

  const handleEnroll = async () => {
    if (!user) {
      setIsLoginOpen(true);
      return;
    }
    setIsPaymentOpen(true);
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

  if (enrollmentInfo.is_enrolled) {
    const needsTelegramUsername = course?.telegram_bot && !userTelegram;

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="container mx-auto p-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">{course?.name}</h1>
            <Button variant="outline" onClick={() => navigate('/enrolled-courses')}>
              Back to My Courses
            </Button>
          </div>
        </header>

        <main className="container mx-auto py-8">
          {needsTelegramUsername && user && (
            <TelegramWarning 
              userId={user.id}
              onUpdate={() => {
                if (user) {
                  supabase
                    .from('profiles')
                    .select('telegram')
                    .eq('id', user.id)
                    .single()
                    .then(({ data }) => {
                      if (data) setUserTelegram(data.telegram);
                    });
                }
              }}
            />
          )}

          {!needsTelegramUsername && (
            <>
              <Card className="mb-8">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Course Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Begin Date</p>
                      <p className="text-lg">{enrollmentInfo.begin_date ? new Date(enrollmentInfo.begin_date).toLocaleDateString() : '-'}</p>
                    </div>
                    {enrollmentInfo.end_date && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">End Date</p>
                        <p className="text-lg">{new Date(enrollmentInfo.end_date).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                  
                  {course.description && (
                    <div className="mb-6">
                      <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
                      <p className="text-lg">{course.description}</p>
                    </div>
                  )}
                  
                  {course.telegram_bot && (
                    <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-4">
                        <MessageSquare className="h-10 w-10 text-blue-500" />
                        <div>
                          <h3 className="text-xl font-bold mb-2">Telegram Bot Support</h3>
                          <p className="mb-4">This course includes a Telegram bot assistant. Connect with the bot to get additional support and materials.</p>
                          
                          <Alert className="mb-4">
                            <AlertTitle>Instructions:</AlertTitle>
                            <AlertDescription>
                              1. Click the link below to open Telegram<br />
                              2. Send any message to the bot to activate it<br />
                              3. The bot will verify your enrollment automatically
                            </AlertDescription>
                          </Alert>
                          
                          <Button className="flex gap-2 items-center" asChild>
                            <a href={`https://t.me/${course.telegram_bot}`} target="_blank" rel="noopener noreferrer">
                              <MessageSquare className="h-4 w-4" />
                              Connect to Telegram Bot
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {course.details && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-bold mb-4">Course Details</h2>
                    <div className="prose max-w-none">
                      <ReactMarkdown>{course.details}</ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </main>
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
            <CardContent className="space-y-6 p-6">
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
      <FakePaymentDialog
        open={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        course={course}
        userId={user?.id ?? null}
      />
    </>
  );
};

export default ViewCourse;
