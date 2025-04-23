
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number | null;
  project_id: string;
}

interface CourseGridProps {
  courses: Course[];
  projectId: string;
}

export const CourseGrid = ({ courses, projectId }: CourseGridProps) => {
  const { t } = useTranslation();
  
  // Filter courses to only show those that belong to this project
  const filteredCourses = courses.filter(course => course.project_id === projectId);
  
  console.log('CourseGrid - Project ID:', projectId);
  console.log('CourseGrid - Courses before filtering:', courses);
  console.log('CourseGrid - Filtered courses:', filteredCourses);

  return (
    <section className="py-20 px-6" id="courses">
      <div className="container mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('customer.courses.available')}</h2>
          <p className="text-lg text-gray-600">
            {t('customer.courses.grid.subtitle', 'Choose the program that best fits your goals and start your transformation journey today.')}
          </p>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">{t('no.courses.available')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <div 
                key={course.id} 
                className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex flex-col"
              >
                <div className="p-8 flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">{course.name}</h3>
                    <div className="bg-blue-100 text-blue-700 text-sm font-semibold py-1 px-3 rounded-full">
                      ${course.price.toFixed(2)}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-6 line-clamp-3">{course.description}</p>
                  
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-gray-600">{t('customer.courses.feature1', 'Personalized guidance')}</span>
                    </div>
                    <div className="flex items-center mb-3">
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-gray-600">
                        {course.duration 
                          ? t('customer.courses.duration.days', { days: course.duration })
                          : t('customer.courses.duration.unlimited')
                        }
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-gray-600">{t('customer.courses.feature3', 'Premium materials')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="px-8 pb-8">
                  <Link 
                    to={`/course/${course.id}`}
                    state={{ fromProjectLanding: true }}
                    className="block w-full py-3 px-6 text-center bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    {t('customer.courses.view') || 'View Details'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
