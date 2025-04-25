
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">
        <div className="container mx-auto p-6 flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold">{course?.name}</h1>
          <Button 
            variant="outline" 
            className="text-white border-white/30 bg-white/20 hover:bg-white/30 hover:text-white" 
            onClick={handleGoBack}
          >
            {t('go.back', 'Back')}
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{t('course.details', 'Course Details')}</h2>
          <div className="prose prose-sm md:prose-base lg:prose-lg max-w-none">
            <p>{course?.description}</p>
            <p>{course?.details}</p>
            <p>Price: ${course?.price}</p>
            {course?.duration && <p>{t('course.duration', 'Duration')}: {course?.duration} hours</p>}
          </div>
        </section>

        {enrollment && (
          <>
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">{t('course.subscriptions', 'Your Subscriptions')}</h2>
              {enrollment.subscriptions && enrollment.subscriptions.length > 0 ? (
                <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
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
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
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

            {course.telegram_bot && (
              <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">{t('course.access', 'How to Access the Course')}</h2>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="font-medium text-lg mb-2">{t('course.telegram_instructions', 'Telegram Bot Instructions')}</h3>
                  <ol className="list-decimal pl-5 mb-4 space-y-2">
                    <li>{t('course.telegram_step1', 'Go to Telegram and search for the bot:')} <strong>@{course.telegram_bot}</strong></li>
                    <li>{t('course.telegram_step2', 'Start a conversation with the bot by clicking the Start button')}</li>
                    <li>{t('course.telegram_step3', 'The bot will verify your subscription status automatically')}</li>
                    <li>{t('course.telegram_step4', 'Follow the instructions from the bot to access course materials')}</li>
                  </ol>
                  <p className="text-sm text-gray-500">
                    {t('course.telegram_note', 'Note: Make sure your Telegram username is added to your profile for verification purposes.')}
                  </p>
                </div>
              </section>
            )}
          </>
        )}

        <div className="mt-8 flex justify-center">
          {!hasActiveSubscription && (
            <Button
              onClick={handleRenewSubscription}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg shadow-lg"
            >
              {enrollment?.subscriptions?.length > 0
                ? t('course.renew_subscription', 'Renew Subscription')
                : t('course.enroll', 'Enroll Now')}
            </Button>
          )}
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
