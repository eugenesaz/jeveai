
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Course, Enrollment, Subscription } from "@/types/supabase";
import { toast } from "@/components/ui/use-toast";

interface EnrollmentWithCourse extends Enrollment {
  course: Course;
  subscriptions?: Subscription[];
}

interface ActiveSubscription extends Subscription {
  is_active: boolean;
}

const N8N_WEBHOOK_URL = "https://n8n.example.com/webhook/enrolled-courses"; // TODO: Replace with your actual n8n endpoint

export default function EnrolledCourses() {
  const { user, isLoading, signOut } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      setEnrollments([]);
      setLoading(false);
      return;
    }
    // Fetch enrollments with courses and subscriptions
    const fetchData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses(*),
          subscriptions(
            *
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching enrollments:', error);
        setEnrollments([]);
        setLoading(false);
        return;
      }

      // Filter out enrollments without courses (shouldn't happen, but just in case)
      const filteredData = (data ?? []).filter((e: any) => e.course);
      
      setEnrollments(filteredData as EnrollmentWithCourse[]);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // Send event to n8n when page loads and user is present
  useEffect(() => {
    if (!user) return;
    const triggerN8n = async () => {
      try {
        await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            event: "viewed_enrolled_courses",
            user_id: user.id,
            email: user.email,
            time: new Date().toISOString()
          })
        });
      } catch (err) {
        // fail silently (don't block UI)
        console.error("Failed triggering n8n webhook", err);
      }
    };
    triggerN8n();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logged out",
      description: "You have been logged out.",
    });
    navigate("/", { replace: true });
  };

  // Helper to find active subscription for an enrollment
  const getActiveSubscription = (enrollment: EnrollmentWithCourse): ActiveSubscription | null => {
    if (!enrollment.subscriptions || enrollment.subscriptions.length === 0) return null;
    
    const now = new Date();
    const subscriptions = [...enrollment.subscriptions].sort(
      (a, b) => new Date(b.begin_date || "").getTime() - new Date(a.begin_date || "").getTime()
    );
    
    for (const sub of subscriptions) {
      const isActive = sub.is_paid && 
        (!sub.end_date || new Date(sub.end_date) > now);
      
      if (isActive) {
        return { ...sub, is_active: true };
      }
    }
    
    return subscriptions.length > 0 ? { ...subscriptions[0], is_active: false } : null;
  };

  if (isLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span>Loading...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center min-h-screen">
        <span>Please log in to see your enrolled courses.</span>
        <Button onClick={() => navigate("/")}>Home</Button>
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center min-h-screen">
        <span>You are not enrolled in any courses.</span>
        <Button onClick={() => navigate("/")}>Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Courses</h1>
          <Button variant="destructive" onClick={handleLogout}>
            Log out - {user.email}
          </Button>
        </div>
      </header>
      <main className="container mx-auto py-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {enrollments.map((enrollment) => {
          const activeSubscription = getActiveSubscription(enrollment);
          return (
            <Card
              key={enrollment.id}
              className="flex flex-col gap-6 p-6 shadow-lg border-2 border-blue-100 bg-white rounded-2xl"
              style={{
                borderColor: "#3B82F6",
                background: "linear-gradient(135deg,#dbedff 10%,#EFF6FF 90%)",
              }}
            >
              <h2 className="font-semibold text-xl">{enrollment.course.name}</h2>
              {activeSubscription && (
                <div className="flex flex-col gap-1">
                  <span>
                    <span className="font-medium">Begin date:</span> {activeSubscription.begin_date ? new Date(activeSubscription.begin_date).toLocaleDateString() : "-"}
                  </span>
                  {activeSubscription.end_date && (
                    <span>
                      <span className="font-medium">End date:</span> {new Date(activeSubscription.end_date).toLocaleDateString()}
                    </span>
                  )}
                  <span className={`mt-2 text-sm font-semibold px-2 py-1 rounded-full inline-block w-fit ${activeSubscription.is_active ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {activeSubscription.is_active ? 'Active' : 'Expired'}
                  </span>
                </div>
              )}
              <Button variant="outline" onClick={() => navigate(`/course/${enrollment.course.id}`)}>
                Continue course
              </Button>
            </Card>
          );
        })}
      </main>
    </div>
  );
}
