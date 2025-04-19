import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import ReactMarkdown from 'react-markdown';
import { Project, Course } from '@/types/supabase';
import { ProjectLanguageSelector } from '@/components/landing/ProjectLanguageSelector';
import { AuthDialogs } from '@/components/auth/AuthDialogs';

interface SocialMedia {
  telegram?: string;
  instagram?: string;
  tiktok?: string;
}

const ProjectLanding = () => {
  const { urlName } = useParams<{ urlName: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, signUp, signIn, signOut } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [isSocialDialogOpen, setIsSocialDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [socialMedia, setSocialMedia] = useState<SocialMedia>({
    telegram: '',
    instagram: '',
    tiktok: '',
  });
  
  const [authError, setAuthError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!urlName) return;

      try {
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('url_name', urlName)
          .eq('status', true)
          .single();

        if (projectError) {
          throw projectError;
        }

        if (projectData) {
          setProject(projectData as Project);
          
          const { data: coursesData, error: coursesError } = await supabase
            .from('courses')
            .select('*')
            .eq('project_id', projectData.id)
            .eq('status', true);

          if (coursesError) {
            throw coursesError;
          }

          if (coursesData) {
            setCourses(coursesData as Course[]);
          }
        }
      } catch (error) {
        console.error('Error fetching project details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [urlName]);

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      if (!user || !project) return;

      try {
        const { data, error } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('user_id', user.id)
          .eq('is_paid', true);

        if (error) {
          throw error;
        }

        if (data) {
          setEnrolledCourses(data.map(item => item.course_id));
        }
      } catch (error) {
        console.error('Error fetching enrolled courses:', error);
      }
    };

    fetchEnrolledCourses();
  }, [user, project]);

  useEffect(() => {
    const fetchSocialMedia = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('telegram, instagram, tiktok')
          .eq('id', user.id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setSocialMedia({
            telegram: data.telegram || '',
            instagram: data.instagram || '',
            tiktok: data.tiktok || '',
          });
        }
      } catch (error) {
        console.error('Error fetching social media:', error);
      }
    };

    fetchSocialMedia();
  }, [user]);

  const handleAuth = async (isSignUp: boolean) => {
    setAuthError('');
    
    if (isSignUp) {
      setSignupLoading(true);
      
      if (password !== confirmPassword) {
        setAuthError(t('errors.passwordMatch'));
        setSignupLoading(false);
        return;
      }
      
      const { error } = await signUp(email, password, 'customer');
      
      if (error) {
        setAuthError(error.message);
        setSignupLoading(false);
      } else {
        setIsSignUpOpen(false);
        setSignupLoading(false);
        
        if (selectedCourse) {
          setIsSocialDialogOpen(true);
        }
      }
    } else {
      setLoginLoading(true);
      
      const { error } = await signIn(email, password);
      
      if (error) {
        setAuthError(error.message);
        setLoginLoading(false);
      } else {
        setIsLoginOpen(false);
        setLoginLoading(false);
        
        if (selectedCourse && (!socialMedia.telegram && !socialMedia.instagram && !socialMedia.tiktok)) {
          setIsSocialDialogOpen(true);
        } else if (selectedCourse) {
          handlePayment(selectedCourse);
        }
      }
    }
  };

  const handleEnroll = (course: Course) => {
    setSelectedCourse(course);
    
    if (!user) {
      setIsLoginOpen(true);
      return;
    }
    
    if (!socialMedia.telegram && !socialMedia.instagram && !socialMedia.tiktok) {
      setIsSocialDialogOpen(true);
      return;
    }
    
    setIsCourseDialogOpen(true);
  };

  const handleSaveSocialMedia = async () => {
    if (!user) return;
    
    if (!socialMedia.telegram && !socialMedia.instagram && !socialMedia.tiktok) {
      toast({
        title: 'Error',
        description: t('errors.socialRequired'),
        variant: 'destructive',
      });
      return;
    }
    
    setSocialLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          telegram: socialMedia.telegram || null,
          instagram: socialMedia.instagram || null,
          tiktok: socialMedia.tiktok || null,
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setIsSocialDialogOpen(false);
      setSocialLoading(false);
      
      toast({
        title: 'Success',
        description: t('success.socialSaved'),
      });
      
      if (selectedCourse) {
        setIsCourseDialogOpen(true);
      }
    } catch (error) {
      console.error('Error saving social media:', error);
      setSocialLoading(false);
    }
  };

  const handlePayment = async (course: Course) => {
    if (!user || !project) return;
    
    try {
      const { error } = await supabase.from('enrollments').insert({
        user_id: user.id,
        course_id: course.id,
        is_paid: true,
        begin_date: new Date().toISOString(),
        end_date: course.duration > 0 
          ? new Date(Date.now() + course.duration * 24 * 60 * 60 * 1000).toISOString() 
          : null,
      });
      
      if (error) throw error;
      
      setEnrolledCourses([...enrolledCourses, course.id]);
      
      setIsCourseDialogOpen(false);
      
      toast({
        title: 'Success',
        description: t('success.enrolled'),
      });
    } catch (error) {
      console.error('Error enrolling in course:', error);
    }
  };

  const getColorClass = (colorScheme: string) => {
    switch (colorScheme) {
      case 'blue':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          button: 'bg-blue-600 hover:bg-blue-700',
        };
      case 'red':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          button: 'bg-red-600 hover:bg-red-700',
        };
      case 'orange':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-800',
          button: 'bg-orange-600 hover:bg-orange-700',
        };
      case 'green':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          button: 'bg-green-600 hover:bg-green-700',
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          button: 'bg-gray-600 hover:bg-gray-700',
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">Project not found</h1>
        <Button onClick={() => navigate('/')}>Go to Homepage</Button>
      </div>
    );
  }

  const colorClass = getColorClass(project.color_scheme);

  return (
    <div className={`min-h-screen ${colorClass.bg}`}>
      <header className={`bg-white shadow-sm border-b ${colorClass.border}`}>
        <div className="container mx-auto p-4 flex justify-between items-center">
          <h1 className={`text-2xl font-bold ${colorClass.text}`}>{project.name}</h1>
          <div className="flex items-center gap-4">
            <ProjectLanguageSelector />
            {user ? (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => navigate('/')}
                >
                  {t('navigation.dashboard')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => signOut()}
                >
                  {t('navigation.logout')}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setIsLoginOpen(true)}>
                  {t('navigation.login')}
                </Button>
                <Button variant="default" onClick={() => setIsSignUpOpen(true)}>
                  {t('navigation.signup')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-8">
        {project.landing_image && (
          <div className="w-full max-h-80 overflow-hidden rounded-lg shadow-md">
            <img 
              src={project.landing_image} 
              alt={project.name} 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {user && enrolledCourses.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{t('customer.courses.active')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {courses
                .filter(course => enrolledCourses.includes(course.id))
                .map(course => (
                  <Card key={course.id} className="border shadow-sm">
                    <CardHeader>
                      <CardTitle>{course.name}</CardTitle>
                      <CardDescription>{course.type}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-3">{course.description}</p>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full"
                        onClick={() => navigate(`/course/${course.id}`)}
                      >
                        {t('customer.courses.view')}
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              }
            </div>
          </div>
        )}

        {courses.length === 0 ? (
          <p>No courses available yet.</p>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{t('customer.courses.available')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {courses
                .filter(course => !enrolledCourses.includes(course.id))
                .map(course => (
                  <Card key={course.id} className="border shadow-sm">
                    <CardHeader>
                      <CardTitle>{course.name}</CardTitle>
                      <CardDescription>{course.type}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-3">{course.description}</p>
                      <div className="mt-4">
                        <p className="font-semibold">${course.price.toFixed(2)}</p>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className={`w-full ${colorClass.button}`}
                        onClick={() => handleEnroll(course)}
                      >
                        {t('customer.courses.enroll')}
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              }
            </div>
          </div>
        )}
      </main>

      <AuthDialogs 
        isLoginOpen={isLoginOpen}
        setIsLoginOpen={setIsLoginOpen}
        isSignUpOpen={isSignUpOpen}
        setIsSignUpOpen={setIsSignUpOpen}
      />

      <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('customer.courses.confirmEnrollment')}</DialogTitle>
            <DialogDescription>
              {t('customer.courses.confirmEnrollmentDesc')}
            </DialogDescription>
          </DialogHeader>
          {selectedCourse && (
            <div className="py-4">
              <p className="font-semibold">{selectedCourse.name}</p>
              <p className="text-sm text-gray-500">{selectedCourse.type}</p>
              <p className="mt-2">{selectedCourse.description}</p>
              <p className="mt-4 font-bold">${selectedCourse.price.toFixed(2)}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCourseDialogOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button onClick={() => selectedCourse && handlePayment(selectedCourse)}>
              {t('customer.courses.confirmPay')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSocialDialogOpen} onOpenChange={setIsSocialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('customer.social.title')}</DialogTitle>
            <DialogDescription>
              {t('customer.social.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="telegram">{t('customer.social.telegram')}</Label>
              <Input
                id="telegram"
                type="text"
                value={socialMedia.telegram || ''}
                onChange={(e) => setSocialMedia({ ...socialMedia, telegram: e.target.value })}
                placeholder="@username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">{t('customer.social.instagram')}</Label>
              <Input
                id="instagram"
                type="text"
                value={socialMedia.instagram || ''}
                onChange={(e) => setSocialMedia({ ...socialMedia, instagram: e.target.value })}
                placeholder="@username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiktok">{t('customer.social.tiktok')}</Label>
              <Input
                id="tiktok"
                type="text"
                value={socialMedia.tiktok || ''}
                onChange={(e) => setSocialMedia({ ...socialMedia, tiktok: e.target.value })}
                placeholder="@username"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveSocialMedia} disabled={socialLoading}>
              {socialLoading ? t('actions.saving') : t('actions.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectLanding;
