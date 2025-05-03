
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from "lucide-react";

interface Course {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number | null;
  project_id: string;
}

export function CourseGrid({ courses, projectId }: { courses: Course[]; projectId: string }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleViewCourse = (courseId: string) => {
    console.log('Navigating to course:', courseId);
    navigate(`/course/${courseId}`);
  };

  return (
    <section id="courses" className="py-20 bg-gradient-to-br from-ai-light to-white">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-ai-dark">
          {t('course.available.courses', 'Available Courses')}
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <div key={course.id} className="animate-fade-in">
              <Card className="h-full flex flex-col group hover:shadow-lg transition-all duration-300 border-ai-blue/10 hover:-translate-y-1">
                <CardHeader className="bg-gradient-to-r from-ai-blue/5 to-ai-purple/5 rounded-t-lg">
                  <CardTitle className="text-ai-dark">{course.name}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow pt-6">
                  <p className="text-lg font-semibold text-ai-purple">${course.price}</p>
                  {course.duration && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {t('course.duration', 'Duration')}: {course.duration} {t('course.days', 'days')}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between items-center pt-4">
                  <Button 
                    variant="outline"
                    onClick={() => handleViewCourse(course.id)}
                    className="w-full group transition-all duration-300 border-ai-blue/20 text-ai-purple hover:bg-ai-blue/5"
                  >
                    {t('course.view.details', 'View Course Details')}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
