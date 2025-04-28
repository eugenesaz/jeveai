
import React from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Course } from '@/types/supabase';
import { ProjectsHeader } from '@/components/projects/ProjectsHeader';
import { ArrowRight, ArrowLeft, Plus, Edit, Eye, Search, Home, Package, Calendar, LogOut, MessageSquare, Share2 } from 'lucide-react';
import { ProfileButton } from '@/components/profile/ProfileButton';
import { cn } from '@/lib/utils';
import { canEditCourses } from '@/utils/permissionUtils';

interface CourseWithProject extends Course {
  project: {
    name: string;
    color_scheme: string | null;
  } | null;
  canEdit?: boolean;
  isShared?: boolean;
}

const Courses = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [courses, setCourses] = useState<CourseWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tabView, setTabView] = useState<'all' | 'owned' | 'shared'>('all');
  const [checking, setChecking] = useState<Record<string, boolean>>({});

  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get('projectId');

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        let coursesArray: CourseWithProject[] = [];
        let permissionChecks: Promise<void>[] = [];
        
        // If projectId is provided, fetch courses for that specific project
        if (projectId) {
          console.log('Fetching courses for project:', projectId);
          
          // Get project name for display
          const { data: projectData } = await supabase
            .from('projects')
            .select('name')
            .eq('id', projectId)
            .single();
            
          if (projectData) {
            setProjectName(projectData.name);
          }
          
          // Fetch courses for the project using our access policy
          const { data: coursesData, error: coursesError } = await supabase
            .from('courses')
            .select(`
              *,
              project:projects(name, color_scheme, user_id)
            `)
            .eq('project_id', projectId);

          if (coursesError) {
            throw coursesError;
          }

          if (coursesData) {
            // We need to check edit permissions for each course
            coursesArray = coursesData as CourseWithProject[];
            
            for (const course of coursesArray) {
              if (course.project) {
                const isOwned = course.project.user_id === user.id;
                course.isShared = !isOwned;
                
                // Create promise to check edit permissions
                permissionChecks.push(
                  canEditCourses(course.project_id).then(canEdit => {
                    course.canEdit = canEdit;
                  })
                );
              }
            }
          }
        } else {
          // No project specified, fetch all courses user has access to
          const { data: coursesData, error: coursesError } = await supabase
            .from('courses')
            .select(`
              *,
              project:projects(name, color_scheme, user_id)
            `);

          if (coursesError) {
            throw coursesError;
          }

          if (coursesData) {
            coursesArray = coursesData as CourseWithProject[];
            
            for (const course of coursesArray) {
              if (course.project) {
                const isOwned = course.project.user_id === user.id;
                course.isShared = !isOwned;
                
                // Create promise to check edit permissions
                permissionChecks.push(
                  canEditCourses(course.project_id).then(canEdit => {
                    course.canEdit = canEdit;
                  })
                );
              }
            }
          }
        }
        
        // Wait for all permission checks to complete
        await Promise.all(permissionChecks);
        
        setCourses(coursesArray);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user, projectId, navigate]);

  const getTypeTranslation = (type: string) => {
    if (!type) return '';
    const translationKey = `influencer.course.types.${type.toLowerCase()}`;
    const translated = t(translationKey);
    return translated !== translationKey ? translated : type;
  };

  const getColorClass = (colorScheme: string | null) => {
    switch (colorScheme) {
      case 'blue':
        return 'bg-blue-50 border-blue-200';
      case 'red':
        return 'bg-red-50 border-red-200';
      case 'orange':
        return 'bg-orange-50 border-orange-200';
      case 'green':
        return 'bg-green-50 border-green-200';
      case 'purple':
        return 'bg-purple-50 border-purple-200';
      case 'indigo':
        return 'bg-indigo-50 border-indigo-200';
      case 'pink':
        return 'bg-pink-50 border-pink-200';
      case 'teal':
        return 'bg-teal-50 border-teal-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };
  
  // Filter courses based on search text and selected tab
  const filteredCourses = courses
    .filter(course => {
      // First apply tab filter
      if (tabView === 'owned' && course.isShared) return false;
      if (tabView === 'shared' && !course.isShared) return false;
      
      // Then apply search text filter
      const searchText = search.toLowerCase();
      return (
        course.name.toLowerCase().includes(searchText) ||
        (course.description && course.description.toLowerCase().includes(searchText)) ||
        (course.type && course.type.toLowerCase().includes(searchText)) ||
        (course.project?.name && course.project.name.toLowerCase().includes(searchText))
      );
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{t('influencer.course.title')}</h1>
            {projectName && (
              <p className="text-gray-500 mt-1">
                {t('filtering.for.project', 'For project')}: {projectName}
              </p>
            )}
          </div>
          <div className="flex gap-4 items-center">
            <div className="hidden md:flex gap-4">
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                <Home className="h-4 w-4 mr-2" />
                {t('navigation.home')}
              </Button>
              <Button variant="ghost" onClick={() => navigate('/projects')}>
                <Package className="h-4 w-4 mr-2" />
                {t('influencer.dashboard.projects')}
              </Button>
              <Button variant="ghost" onClick={() => navigate('/courses')}>
                <Calendar className="h-4 w-4 mr-2" />
                {t('navigation.courses')}
              </Button>
              <Button variant="ghost" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                {t('navigation.logout')}
              </Button>
            </div>
            <ProfileButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
          <div className="relative w-full max-w-sm">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border rounded-md shadow-sm focus:ring focus:ring-primary/20"
              placeholder={t('search.courses', 'Search courses')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant={tabView === 'all' ? 'default' : 'outline'} 
              onClick={() => setTabView('all')}
              size="sm"
            >
              {t('All')}
            </Button>
            <Button 
              variant={tabView === 'owned' ? 'default' : 'outline'} 
              onClick={() => setTabView('owned')}
              size="sm"
            >
              {t('My Courses')}
            </Button>
            <Button 
              variant={tabView === 'shared' ? 'default' : 'outline'} 
              onClick={() => setTabView('shared')}
              size="sm"
              className="flex items-center gap-1"
            >
              <Share2 className="h-3.5 w-3.5" />
              {t('Shared')}
            </Button>
          </div>
          <Button 
            onClick={() => {
              if (projectId) {
                navigate(`/create-course?projectId=${projectId}`);
              } else {
                navigate('/create-course');
              }
            }}
            variant="default"
            className="flex items-center gap-2 md:ml-4 w-full md:w-auto"
          >
            <Plus className="w-4 h-4" />
            {t('influencer.course.createNew')}
          </Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p>{t('loading', 'Loading...')}</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center p-10">
            {tabView === 'shared' ? (
              <h2 className="text-xl font-semibold mb-4">
                {t('no.shared.courses', 'No shared courses available')}
              </h2>
            ) : projectName ? (
              <h2 className="text-xl font-semibold mb-4">
                {t('no.courses.for.project', 'No courses for this project')}
              </h2>
            ) : (
              <h2 className="text-xl font-semibold mb-4">
                {t('no.courses', 'No courses yet')}
              </h2>
            )}
            {tabView !== 'shared' && (
              <Button 
                onClick={() => {
                  if (projectId) {
                    navigate(`/create-course?projectId=${projectId}`);
                  } else {
                    navigate('/create-course');
                  }
                }}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t('influencer.course.createNew')}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card 
                key={course.id} 
                className={`border ${getColorClass(course.project?.color_scheme || null)}`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                    <div className="flex gap-1">
                      {course.isShared && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <Share2 className="h-3 w-3 mr-1" />
                          {t('Shared')}
                        </Badge>
                      )}
                      <Badge variant={course.status ? "default" : "outline"}>
                        {course.status ? t('influencer.course.active') : t('influencer.course.inactive')}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>
                    {course.project?.name || t('no.project', 'No Project')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm line-clamp-2">{course.description}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mt-2">
                    <div className="text-gray-500">{t('customer.courses.type')}:</div>
                    <div>{getTypeTranslation(course.type || '')}</div>
                    <div className="text-gray-500">{t('customer.courses.price')}:</div>
                    <div>${course.price.toFixed(2)}</div>
                    <div className="text-gray-500">{t('customer.courses.duration')}:</div>
                    <div>{course.duration === 0 ? t('customer.courses.oneTime') : `${course.duration} ${t('customer.courses.days')}`}</div>
                    <div className="text-gray-500">{t('influencer.course.recurring')}:</div>
                    <div>{course.recurring ? t('influencer.course.yes') : t('influencer.course.no')}</div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2 justify-between">
                  {course.canEdit && (
                    <Button 
                      variant="outline" 
                      onClick={() => navigate(`/edit-course/${course.id}`)}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      {t('editButton')}
                    </Button>
                  )}
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/course/${course.id}`)}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    {t('view', 'View')}
                  </Button>
                  <Button 
                    variant="default"
                    onClick={() => navigate(`/conversations/${course.id}`)}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {t('view.conversations', 'Conversations')}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Courses;
