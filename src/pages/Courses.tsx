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
import { ArrowRight, ArrowLeft, Plus, Edit, Eye, Search, Home, Package, Calendar, LogOut } from 'lucide-react';
import { ProfileButton } from '@/components/profile/ProfileButton';
import { cn } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';

interface CourseWithProject extends Course {
  project: {
    name: string;
    color_scheme: string | null;
  } | null;
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

  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get('projectId');

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;

      try {
        if (projectId) {
          console.log('Fetching courses for project:', projectId);
          
          const { data: projectData } = await supabase
            .from('projects')
            .select('name')
            .eq('id', projectId)
            .single();
            
          if (projectData) {
            setProjectName(projectData.name);
          }
          
          const { data: projectOwnerData } = await supabase
            .from('projects')
            .select('id')
            .eq('id', projectId)
            .eq('user_id', user.id)
            .single();
            
          if (projectOwnerData) {
            const { data: coursesData, error: coursesError } = await supabase
              .from('courses')
              .select(`
                *,
                project:projects(name, color_scheme)
              `)
              .eq('project_id', projectId);

            if (coursesError) {
              throw coursesError;
            }

            if (coursesData) {
              console.log('Courses for project:', coursesData);
              setCourses(coursesData as CourseWithProject[]);
            }
          } else {
            const { data: roleData, error: roleError } = await supabase
              .from('user_project_roles')
              .select('role')
              .eq('project_id', projectId)
              .eq('user_id', user.id);
              
            if (roleError) {
              console.error('Error fetching user role:', roleError);
              navigate('/projects');
              return;
            }

            const isInfluencer = roleData && roleData.some(role => role.role === 'influencer');
            if (!isInfluencer) {
              console.log('User is not an influencer for this project');
              navigate('/projects');
              return;
            }
            
            const { data: coursesData, error: coursesError } = await supabase
              .from('courses')
              .select(`
                *,
                project:projects(name, color_scheme)
              `)
              .eq('project_id', projectId);

            if (coursesError) {
              throw coursesError;
            }

            if (coursesData) {
              console.log('Courses for project:', coursesData);
              setCourses(coursesData as CourseWithProject[]);
            }
          }
        } else {
          const { data: ownedProjects, error: ownedProjectsError } = await supabase
            .from('projects')
            .select('id')
            .eq('user_id', user.id);

          if (ownedProjectsError) {
            throw ownedProjectsError;
          }

          let projectIds = ownedProjects ? ownedProjects.map(project => project.id) : [];

          const { data: userProjects, error: projectsError } = await supabase
            .from('user_project_roles')
            .select('project_id')
            .eq('user_id', user.id)
            .eq('role', 'influencer');

          if (projectsError) {
            throw projectsError;
          }

          if (userProjects && userProjects.length > 0) {
            projectIds = [...projectIds, ...userProjects.map(project => project.project_id)];
            projectIds = [...new Set(projectIds)];
          }

          if (projectIds.length === 0) {
            setLoading(false);
            return;
          }

          const { data: coursesData, error: coursesError } = await supabase
            .from('courses')
            .select(`
              *,
              project:projects(name, color_scheme)
            `)
            .in('project_id', projectIds);

          if (coursesError) {
            throw coursesError;
          }

          if (coursesData) {
            setCourses(coursesData as CourseWithProject[]);
          }
        }
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
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const filteredCourses = courses.filter(course => {
    const searchText = search.toLowerCase();
    return (
      course.name.toLowerCase().includes(searchText) ||
      (course.description && course.description.toLowerCase().includes(searchText)) ||
      (course.type && course.type.toLowerCase().includes(searchText))
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
        <div className="flex items-center justify-between mb-4">
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
          <Button 
            onClick={() => {
              if (projectId) {
                navigate(`/create-course?projectId=${projectId}`);
              } else {
                navigate('/create-course');
              }
            }}
            variant="default"
            className="flex items-center gap-2 ml-4"
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
            <h2 className="text-xl font-semibold mb-4">
              {projectName 
                ? t('no.courses.for.project', 'No courses for this project') 
                : t('no.courses', 'No courses yet')}
            </h2>
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
                    <Badge variant={course.status ? "default" : "outline"}>
                      {course.status ? t('influencer.course.active') : t('influencer.course.inactive')}
                    </Badge>
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
                <CardFooter className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/edit-course/${course.id}`)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    {t('editButton')}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/course/${course.id}`)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    {t('view', 'View')}
                  </Button>
                  <Button 
                    variant="default"
                    onClick={() => navigate(`/conversations/${course.id}`)}
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {t('view.conversations', 'View Conversations')}
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
