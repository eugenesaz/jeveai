
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

interface Course {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number | null;
}

interface CourseGridProps {
  courses: Course[];
}

export const CourseGrid = ({ courses }: CourseGridProps) => {
  const { t } = useTranslation();

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">{t('customer.courses.available')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div 
              key={course.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{course.name}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">${course.price.toFixed(2)}</span>
                  {course.duration && (
                    <span className="text-sm text-gray-500">
                      {course.duration} {t('customer.courses.days')}
                    </span>
                  )}
                </div>
              </div>
              <div className="px-6 pb-4">
                <Link 
                  to={`/course/${course.id}`}
                  state={{ fromProjectLanding: true }}
                  className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                >
                  {t('customer.courses.view')}
                </Link>
              </div>
            </div>
          ))}
        </div>
        {courses.length === 0 && (
          <p className="text-center text-gray-600">{t('no.courses.available')}</p>
        )}
      </div>
    </section>
  );
};
