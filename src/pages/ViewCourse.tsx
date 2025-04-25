
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Course } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';
import { FakePaymentDialog } from '@/components/FakePaymentDialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { formatDate, isSubscriptionActive } from '@/utils/subscriptionUtils';
import { MessageSquare, ArrowLeft } from 'lucide-react';

export default function ViewCourse() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      if (!id) throw new Error('No course ID provided');
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Course;
    }
  });

  const { data: enrollment, isLoading: enrollmentLoading } = useQuery({
    queryKey: ['enrollment', id],
    enabled: !!user && !!id,
    queryFn: async () => {
      if (!user || !id) return null;
      const { data, error } = await supabase
        .from('enrollments')
        .select('id, subscriptions(*)')
        .eq('course_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }
  });

  // Check if there's an active subscription
  const hasActiveSubscription = enrollment?.subscriptions?.some(sub => 
    isSubscriptionActive(sub)
  );

  // Debug logs to help diagnose the issue
  console.log("User:", user?.id);
  console.log("Enrollment:", enrollment);
  console.log("Has active subscription:", hasActiveSubscription);
  console.log("Subscriptions:", enrollment?.subscriptions);

  const handleRenewSubscription = () => {
    if (!user) {
      toast.error(t('auth.required', 'Please sign in to enroll in courses'));
      return;
    }
    setIsPaymentOpen(true);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (courseLoading || enrollmentLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-dots loading-lg"></span>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t('course.not_found', 'Course Not Found')}</h2>
          <Button onClick={() => navigate('/')}>{t('go.home', 'Go Home')}</Button>
        </div>
      </div>
    );
  }

  // Determine if we should show the enrollment/subscription button
  const shouldShowSubscriptionButton = !hasActiveSubscription;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">
        <div className="container mx-auto p-6">
          <Button 
            variant="outline" 
            className="mb-4 text-white border-white/30 bg-white/20 hover:bg-white/30 hover:text-white" 
            onClick={handleGoBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('go.back', 'Back')}
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold mt-4">{course?.name}</h1>
          <p className="text-lg text-white/80 mt-2">{course?.description}</p>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <section className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl font-semibold mb-6">{t('course.details', 'Course Details')}</h2>
              <div className="prose prose-sm md:prose-base lg:prose-lg max-w-none">
                <p className="text-gray-600">{course?.details}</p>
                <div className="flex flex-wrap gap-4 mt-6">
                  <div className="bg-blue-50 rounded-lg px-4 py-2">
                    <span className="text-blue-600 font-medium">${course?.price}</span>
                  </div>
                  {course?.duration && (
                    <div className="bg-purple-50 rounded-lg px-4 py-2">
                      <span className="text-purple-600 font-medium">
                        {course?.duration} {t('course.days', 'days')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {enrollment && (
              <section className="bg-white rounded-2xl shadow-sm p-8">
                <h2 className="text-2xl font-semibold mb-6">{t('course.subscriptions', 'Your Subscriptions')}</h2>
                {enrollment.subscriptions && enrollment.subscriptions.length > 0 ? (
                  <div className="overflow-hidden mb-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('subscription.begin_date', 'Start Date')}</TableHead>
                          <TableHead>{t('subscription.end_date', 'End Date')}</TableHead>
                          <TableHead>{t('subscription.status', 'Status')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {enrollment.subscriptions.map((subscription) => {
                          const active = isSubscriptionActive(subscription);
                          return (
                            <TableRow key={subscription.id}>
                              <TableCell>{formatDate(subscription.begin_date)}</TableCell>
                              <TableCell>
                                {subscription.end_date ? formatDate(subscription.end_date) : t('subscription.unlimited', 'Unlimited')}
                              </TableCell>
                              <TableCell>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {active ? t('subscription.active', 'Active') : t('subscription.expired', 'Expired')}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-gray-500">{t('subscription.none', 'You have not subscribed to this course yet.')}</p>
                )}
              </section>
            )}
          </div>

          <div className="md:col-span-1">
            {course.telegram_bot && (
              <section className="bg-white rounded-2xl shadow-sm p-6 sticky top-6">
                <h2 className="text-xl font-semibold mb-4">{t('course.access', 'How to Access')}</h2>
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                      <h3 className="font-medium text-blue-900">
                        {t('course.telegram_instructions', 'Telegram Bot')}
                      </h3>
                    </div>
                    <a 
                      href={`https://t.me/${course.telegram_bot}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-medium block mb-4"
                    >
                      @{course.telegram_bot}
                    </a>
                    <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-600">
                      <li>{t('course.telegram_step1', 'Search for the bot on Telegram')}</li>
                      <li>{t('course.telegram_step2', 'Click Start to begin')}</li>
                      <li>{t('course.telegram_step3', 'Your subscription will be verified automatically')}</li>
                      <li>{t('course.telegram_step4', 'Follow the bot instructions')}</li>
                    </ol>
                  </div>

                  {shouldShowSubscriptionButton && (
                    <Button
                      onClick={handleRenewSubscription}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 py-6 rounded-xl shadow-lg"
                    >
                      {enrollment?.subscriptions && enrollment.subscriptions.length > 0
                        ? t('course.renew_subscription', 'Renew Subscription')
                        : t('course.enroll', 'Enroll Now')}
                    </Button>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      <FakePaymentDialog
        open={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        course={course}
        userId={user?.id || null}
      />
    </div>
  );
}
