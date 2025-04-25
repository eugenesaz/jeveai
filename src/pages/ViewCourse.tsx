
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
import { MessageSquare, Check, Star } from 'lucide-react';
import { TelegramWarning } from '@/components/profile/TelegramWarning';

interface CourseWithDates extends Course {
  begin_date?: string;
  end_date?: string;
  project_url_name?: string;
}

interface EnrollmentInfo {
  is_enrolled: boolean;
  begin_date?: string;
  end_date?: string;
}

interface SubscriptionHistory {
  id: string;
  begin_date: string;
  end_date: string | null;
  is_paid: boolean;
  is_active: boolean;
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
  const [projectUrlName, setProjectUrlName] = useState<string | null>(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState<SubscriptionHistory[]>([]);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  const isFromProjectLanding = location.state?.fromProjectLanding || false;

  useEffect(() => {
    const fetchCourseAndEnrollment = async () => {
      if (!id) return;

      try {
        // First fetch the course data
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', id)
          .single();

        if (courseError) {
          throw courseError;
        }

        // Create a copy of courseData to add project_url_name
        const courseWithProjectUrl: CourseWithDates = {
          ...courseData as Course
        };

        // Then fetch the associated project to get its URL name
        if (courseData.project_id) {
          const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .select('url_name')
            .eq('id', courseData.project_id)
            .single();
            
          if (!projectError && projectData) {
            setProjectUrlName(projectData.url_name);
            // Add the project's URL name to the course data
            courseWithProjectUrl.project_url_name = projectData.url_name;
          }
        }

        setCourse(courseWithProjectUrl);
        
        if (user) {
          // Fetch all enrollments for this course to track subscription history
          const { data: enrollmentsData, error: enrollmentsError } = await supabase
            .from('enrollments')
            .select('*')
            .eq('user_id', user.id)
            .eq('course_id', id)
            .order('begin_date', { ascending: false });
            
          if (!enrollmentsError && enrollmentsData) {
            const now = new Date();
            const history: SubscriptionHistory[] = enrollmentsData.map(enrollment => {
              const beginDate = enrollment.begin_date ? new Date(enrollment.begin_date) : null;
              const endDate = enrollment.end_date ? new Date(enrollment.end_date) : null;
              const isActive = enrollment.is_paid && 
                beginDate !== null && 
                (endDate === null || now <= endDate);
                
              return {
                id: enrollment.id,
                begin_date: enrollment.begin_date || '',
                end_date: enrollment.end_date,
                is_paid: !!enrollment.is_paid,
                is_active: isActive
              };
            });
            
            setSubscriptionHistory(history);
            
            // Check if there's any active subscription
            const activeSubscription = history.find(sub => sub.is_active);
            setHasActiveSubscription(!!activeSubscription);
            
            if (activeSubscription) {
              setEnrollmentInfo({
                is_enrolled: true,
                begin_date: activeSubscription.begin_date,
                end_date: activeSubscription.end_date || undefined
              });
            }
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
    if (projectUrlName) {
      navigate(`/${projectUrlName}`);
    } else if (course?.project_id) {
      navigate(`/projects`);
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
        <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">
          <div className="container mx-auto p-6 flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold">{course?.name}</h1>
            <Button variant="outline" className="text-white border-white hover:bg-white/10" onClick={handleGoBack}>
              Back
            </Button>
          </div>
        </header>

        <main className="container mx-auto py-12 px-4">
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
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-10">
                  <div className="p-8 md:p-10">
                    <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">Course Information</h2>
                    
                    {/* Subscription history section */}
                    <div className="mb-10">
                      <h3 className="text-xl font-semibold mb-4 text-gray-900">Your Subscription History</h3>
                      <div className="bg-gray-50 p-6 rounded-lg">
                        {subscriptionHistory.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                <tr>
                                  <th className="px-6 py-3">Begin Date</th>
                                  <th className="px-6 py-3">End Date</th>
                                  <th className="px-6 py-3">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {subscriptionHistory.map((sub) => (
                                  <tr key={sub.id} className="bg-white border-b">
                                    <td className="px-6 py-4">
                                      {sub.begin_date ? new Date(sub.begin_date).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                      {sub.end_date ? new Date(sub.end_date).toLocaleDateString() : 'Unlimited'}
                                    </td>
                                    <td className="px-6 py-4">
                                      {sub.is_active ? (
                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                          Active
                                        </span>
                                      ) : (
                                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                                          Expired
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-gray-600">No subscription history found.</p>
                        )}
                        
                        {!hasActiveSubscription && (
                          <div className="mt-6">
                            <Button 
                              onClick={handleEnroll} 
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Subscribe
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {course?.description && (
                      <div className="mb-10">
                        <h3 className="text-xl font-semibold mb-4 text-gray-900">Description</h3>
                        <div className="bg-gray-50 p-6 rounded-lg">
                          <p className="text-gray-700">{course.description}</p>
                        </div>
                      </div>
                    )}
                    
                    {course?.telegram_bot && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-100 mb-10">
                        <div className="flex items-start gap-6">
                          <div className="bg-blue-100 rounded-full p-4">
                            <MessageSquare className="h-12 w-12 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold mb-4 text-gray-900">How to Get Started</h3>
                            <p className="text-gray-600 mb-6">This course includes a Telegram bot assistant. Connect with the bot to get additional support and materials.</p>
                            
                            <Alert className="mb-6 border-blue-200 bg-blue-50">
                              <AlertTitle className="text-blue-800 font-semibold">Instructions:</AlertTitle>
                              <AlertDescription className="text-blue-700">
                                <ol className="list-decimal list-inside space-y-2 mt-2">
                                  <li>Click the button below to open Telegram</li>
                                  <li>Send any message to the bot to activate it</li>
                                  <li>The bot will verify your enrollment automatically</li>
                                </ol>
                              </AlertDescription>
                            </Alert>
                            
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white flex gap-2 items-center" asChild>
                              <a href={`https://t.me/${course.telegram_bot}`} target="_blank" rel="noopener noreferrer">
                                <MessageSquare className="h-4 w-4" />
                                Connect to Telegram Bot
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {course?.details && (
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="p-8 md:p-10">
                      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">Course Details</h2>
                      <div className="prose max-w-none">
                        <ReactMarkdown>{course.details}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="container mx-auto p-6 py-10 md:py-16">
            <Button variant="ghost" className="text-white mb-6 hover:bg-white/10" onClick={handleGoBack}>
              ← {t('go.back')}
            </Button>
            
            <div className="max-w-4xl">
              <h1 className="text-3xl md:text-5xl font-bold mb-4">{course.name}</h1>
              <p className="text-xl text-blue-100 mb-6">{course.description}</p>
              
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full flex items-center">
                  <Star className="h-5 w-5 mr-2 text-yellow-300" />
                  <span>{getTypeTranslation(course.type)}</span>
                </div>
              </div>
              
              <Button 
                onClick={handleEnroll}
                className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-6 text-lg font-semibold rounded-lg shadow-lg"
              >
                {user ? t('customer.courses.subscribe', 'Subscribe') : t('customer.courses.enroll', 'Enroll')}
                <span className="ml-2 font-bold">${course.price.toFixed(2)}</span>
              </Button>
            </div>
          </div>
        </div>

        <main className="container mx-auto py-16 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Subscription History for existing users */}
            {user && subscriptionHistory.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-12">
                <div className="p-8 md:p-10">
                  <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">Your Subscription History</h2>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                        <tr>
                          <th className="px-6 py-3">Begin Date</th>
                          <th className="px-6 py-3">End Date</th>
                          <th className="px-6 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subscriptionHistory.map((sub) => (
                          <tr key={sub.id} className="bg-white border-b">
                            <td className="px-6 py-4">
                              {sub.begin_date ? new Date(sub.begin_date).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-6 py-4">
                              {sub.end_date ? new Date(sub.end_date).toLocaleDateString() : 'Unlimited'}
                            </td>
                            <td className="px-6 py-4">
                              {sub.is_active ? (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                  Active
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                                  Expired
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            
            {/* How to use this course section */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-12">
              <div className="p-8 md:p-10">
                <h2 className="text-2xl md:text-3xl font-bold mb-8 text-gray-900">{t('course.how.to.use', "How to Use This Course")}</h2>
                
                <div className="grid gap-6">
                  <div className="flex items-start">
                    <Check className="h-6 w-6 text-green-500 mr-3 mt-0.5" />
                    <p className="text-gray-700">{t('course.instructions.1', 'Subscribe to get immediate access to all materials')}</p>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-6 w-6 text-green-500 mr-3 mt-0.5" />
                    <p className="text-gray-700">{t('course.instructions.2', 'Connect with the Telegram bot for personalized assistance')}</p>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-6 w-6 text-green-500 mr-3 mt-0.5" />
                    <p className="text-gray-700">{t('course.instructions.3', 'Access course materials anytime through your subscription')}</p>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-6 w-6 text-green-500 mr-3 mt-0.5" />
                    <p className="text-gray-700">{t('course.instructions.4', 'Renew your subscription when it expires to maintain access')}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Course Information */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-12">
              <div className="p-8 md:p-10">
                <h2 className="text-2xl md:text-3xl font-bold mb-8 text-gray-900">{t('course.information', "Course Information")}</h2>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">{t('course.includes', "This Course Includes")}</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-3" />
                        <p className="text-gray-700">{t('course.includes.1', 'Personalized assessment')}</p>
                      </div>
                      <div className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-3" />
                        <p className="text-gray-700">{t('course.includes.2', 'Customized program')}</p>
                      </div>
                      <div className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-3" />
                        <p className="text-gray-700">{t('course.includes.3', 'Regular checkpoints')}</p>
                      </div>
                      {course.telegram_bot && (
                        <div className="flex items-center">
                          <Check className="h-5 w-5 text-green-500 mr-3" />
                          <p className="text-gray-700">{t('course.includes.telegram', 'Telegram bot support')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">{t('course.details', "Details")}</h3>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="text-gray-500 w-32">{t('customer.courses.price')}:</div>
                        <div className="font-semibold">${course.price.toFixed(2)}</div>
                      </div>
                      <div className="flex items-start">
                        <div className="text-gray-500 w-32">{t('customer.courses.duration')}:</div>
                        <div className="font-semibold">
                          {course.duration === 0 
                            ? t('customer.courses.oneTime') 
                            : `${course.duration} ${t('customer.courses.days')}`}
                        </div>
                      </div>
                      {course.telegram_bot && (
                        <div className="flex items-start">
                          <div className="text-gray-500 w-32">{t('influencer.course.telegramBot')}:</div>
                          <div className="font-semibold">@{course.telegram_bot}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {course.details && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-8 md:p-10">
                  <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">{t('course.detailed.description', "Detailed Description")}</h2>
                  <div className="prose max-w-none">
                    <ReactMarkdown>{course.details}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
            
            {/* Fixed CTA on the bottom for mobile */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-200 shadow-lg">
              <Button 
                onClick={handleEnroll}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4"
              >
                {user ? t('customer.courses.subscribe', 'Subscribe') : t('customer.courses.enroll', 'Enroll')}
                <span className="ml-2 font-bold">${course.price.toFixed(2)}</span>
              </Button>
            </div>
          </div>
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
