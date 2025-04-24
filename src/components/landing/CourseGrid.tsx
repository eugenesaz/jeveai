import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

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

  return (
    <section className="py-20">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <div key={course.id} className="animate-fade-in">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle>{course.name}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p>Price: ${course.price}</p>
                  {course.duration && <p>Duration: {course.duration} hours</p>}
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/courses/${course.id}/conversations`)}
                    className="w-full hover:scale-105 transition-transform"
                  >
                    View conversations
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
