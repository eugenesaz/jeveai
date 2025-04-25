
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Course } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';
import { FakePaymentDialog } from '@/components/FakePaymentDialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

        <div className="mt-8 flex justify-center">
          <Button
            onClick={handleRenewSubscription}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg shadow-lg"
          >
            {enrollment?.subscriptions?.[0]?.id
              ? t('course.renew_subscription', 'Renew Subscription')
              : t('course.enroll', 'Enroll Now')}
          </Button>
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
