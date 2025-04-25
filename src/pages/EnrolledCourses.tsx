import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Course } from '@/types/supabase';
import { Calendar, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getActiveSubscription, formatDate } from '@/utils/subscriptionUtils';
import { FakePaymentDialog } from "@/components/FakePaymentDialog";

interface EnrolledCourseData extends Course {
  subscription_active: boolean;
  subscription_begin?: string | null;
  subscription_end?: string | null;
}

const EnrolledCourses = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseForPayment, setSelectedCourseForPayment] = useState<Course | null>(null);

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      if (!user) return;

      try {
        // Get enrollments without trying to access begin_date
        const { data: enrollments, error: enrollmentError } = await supabase
          .from('enrollments')
          .select('id, course_id')
          .eq('user_id', user.id);

        if (enrollmentError) throw enrollmentError;
        if (!enrollments || enrollments.length === 0) {
          setLoading(false);
          return;
        }

        // Get all courses data
        const courseIds = enrollments.map(enrollment => enrollment.course_id);
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .in('id', courseIds);

        if (coursesError) throw coursesError;

        // For each enrollment, get the subscription data and merge with course data
        const coursesWithSubscription = await Promise.all(
          enrollments.map(async (enrollment) => {
            const { data: subscriptions, error: subscriptionsError } = await supabase
              .from('subscriptions')
              .select('*')
              .eq('enrollment_id', enrollment.id)
              .order('begin_date', { ascending: false });

            if (subscriptionsError) throw subscriptionsError;
            
            const course = coursesData?.find(c => c.id === enrollment.course_id);
            if (!course) return null;
            
            const activeSubscription = getActiveSubscription(subscriptions || []);
            
            return {
              ...course,
              subscription_active: !!activeSubscription?.is_active,
              subscription_begin: activeSubscription?.begin_date,
              subscription_end: activeSubscription?.end_date
            };
          })
        );

        setEnrolledCourses(coursesWithSubscription.filter(Boolean) as EnrolledCourseData[]);
      } catch (error) {
        console.error('Error fetching enrolled courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, [user]);

  const handleViewCourse = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  const handleRenewSubscription = (course: Course) => {
    setSelectedCourseForPayment(course);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-800">{t('customer.courses.myEnrollments')}</h1>
        </div>
      </header>

      <main className="container mx-auto py-10 px-4">
        {enrolledCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((course) => {
              const activeSubscription = {
                is_active: course.subscription_active,
                begin_date: course.subscription_begin,
                end_date: course.subscription_end
              };

              return (
                <Card key={course.id} className="overflow-hidden transition-all hover:shadow-lg">
                  <div className="p-6">
                    <div className="flex flex-col h-full">
                      <div>
                        <h2 className="text-xl font-semibold mb-2">{course.name}</h2>
                        <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-2 text-blue-500" />
                          <span className="text-gray-500 mr-2">{t('customer.courses.type')}:</span>
                          <span className="font-medium">{course.type || t('common.notSpecified')}</span>
                        </div>

                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                          <span className="text-gray-500 mr-2">{t('customer.courses.subscription')}:</span>
                          <Badge variant={activeSubscription.is_active ? "success" : "outline"} className="ml-auto">
                            {activeSubscription.is_active ? 
                              t('customer.courses.active') : 
                              t('customer.courses.expired')}
                          </Badge>
                        </div>

                        {activeSubscription.begin_date && (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-blue-500 opacity-0" />
                            <span className="text-gray-500 mr-2">{t('customer.courses.startDate')}:</span>
                            <span className="font-medium">{formatDate(activeSubscription.begin_date)}</span>
                          </div>
                        )}

                        {activeSubscription.end_date && (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-blue-500 opacity-0" />
                            <span className="text-gray-500 mr-2">{t('customer.courses.endDate')}:</span>
                            <span className="font-medium">{formatDate(activeSubscription.end_date)}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 flex gap-3 justify-end">
                        {!activeSubscription.is_active && (
                          <Button 
                            onClick={() => handleRenewSubscription(course)}
                            variant="outline"
                            size="sm"
                            className="text-blue-600 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                          >
                            {t('customer.courses.renew')}
                          </Button>
                        )}
                        <Button 
                          onClick={() => handleViewCourse(course.id)}
                          variant="default"
                          size="sm"
                        >
                          {t('common.view')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">{t('customer.courses.noEnrollments')}</h2>
            <p className="text-gray-500 mb-8">{t('customer.courses.noEnrollmentsDescription')}</p>
            <Button onClick={() => navigate('/projects')}>{t('customer.courses.browseCourses')}</Button>
          </div>
        )}
      </main>

      <FakePaymentDialog
        open={!!selectedCourseForPayment}
        onClose={() => setSelectedCourseForPayment(null)}
        course={selectedCourseForPayment}
        userId={user?.id || null}
      />
    </div>
  );
};

export default EnrolledCourses;
