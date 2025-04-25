
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Enrollment, Course, Subscription } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getActiveSubscription, formatDate } from '@/utils/subscriptionUtils';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageSquare } from 'lucide-react';

interface EnrollmentWithCourse extends Enrollment {
  course: Course;
  subscriptions?: Subscription[];
}

const EnrolledCourses = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Get enrollments without sorting by begin_date
        const { data: enrollmentData, error } = await supabase
          .from('enrollments')
          .select(`
            *,
            course:courses(*)
          `)
          .eq('user_id', user.id);

        if (error) throw error;

        if (enrollmentData) {
          // Now get subscriptions for each enrollment
          const enrichedEnrollments = await Promise.all(
            enrollmentData.map(async (enrollment) => {
              const { data: subscriptionsData } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('enrollment_id', enrollment.id)
                .order('begin_date', { ascending: false });
              
              return {
                ...enrollment,
                subscriptions: subscriptionsData || []
              };
            })
          );

          setEnrollments(enrichedEnrollments as EnrollmentWithCourse[]);
        }
      } catch (error) {
        console.error('Error fetching enrolled courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, [user]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">{t('customer.enrolledCourses.title', 'My Courses')}</h1>
        <p>{t('loading')}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">{t('customer.enrolledCourses.title', 'My Courses')}</h1>
        <p>{t('customer.enrolledCourses.loginRequired', 'Please log in to see your enrolled courses.')}</p>
        <Button onClick={() => navigate('/')} className="mt-4">
          {t('goToHome', 'Go to Home')}
        </Button>
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">{t('customer.enrolledCourses.title', 'My Courses')}</h1>
        <p>{t('customer.enrolledCourses.noCourses', 'You are not enrolled in any courses yet.')}</p>
        <Button onClick={() => navigate('/')} className="mt-4">
          {t('exploreMore', 'Explore Courses')}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">{t('customer.enrolledCourses.title', 'My Courses')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrollments.map((enrollment) => {
          const course = enrollment.course;
          const activeSubscription = enrollment.subscriptions ? 
            getActiveSubscription(enrollment.subscriptions) : null;
          
          return (
            <Card key={enrollment.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <CardTitle>{course?.name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-gray-600 mb-4 line-clamp-2">{course?.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="text-gray-500 mr-2">{t('customer.courses.subscription')}:</span>
                    {activeSubscription ? (
                      <Badge variant={activeSubscription.is_active ? "success" : "outline"} className="ml-auto">
                        {activeSubscription.is_active ? 
                          t('customer.courses.active') : 
                          t('customer.courses.expired')}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="ml-auto">
                        {t('customer.courses.noSubscription')}
                      </Badge>
                    )}
                  </div>
                  
                  {activeSubscription && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">{t('customer.courses.startDate')}:</span>
                        <div>{formatDate(activeSubscription.begin_date)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">{t('customer.courses.endDate')}:</span>
                        <div>
                          {activeSubscription.end_date ? 
                            formatDate(activeSubscription.end_date) : 
                            t('customer.courses.unlimited')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 border-t">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate(`/course/${course?.id}`)}
                  className="w-full"
                >
                  {t('customer.courses.viewDetails')}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default EnrolledCourses;
