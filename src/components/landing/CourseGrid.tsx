
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
    <section id="courses" className="py-20">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <div key={course.id} className="animate-fade-in">
              <Card className="h-full flex flex-col group hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle>{course.name}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-lg font-semibold text-primary">${course.price}</p>
                  {course.duration && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {t('course.duration', 'Duration')}: {course.duration} {t('course.hours', 'hours')}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <Button 
                    variant="outline"
                    onClick={() => handleViewCourse(course.id)}
                    className="w-full group transition-all duration-300"
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
}
