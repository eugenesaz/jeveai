import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import CreateProject from "@/pages/CreateProject";
import EditProject from "@/pages/EditProject";
import ManageKnowledge from "@/pages/ManageKnowledge";
import Courses from "@/pages/Courses";
import CreateCourse from "@/pages/CreateCourse";
import EditCourse from "@/pages/EditCourse";
import ViewCourse from "@/pages/ViewCourse";
import ProjectLanding from "@/pages/ProjectLanding";
import Admin from "@/pages/Admin";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import EnrolledCourses from "@/pages/EnrolledCourses";
import ViewConversations from "@/pages/ViewConversations";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/:urlName" element={<ProjectLanding />} />
                <Route path="/course/:id" element={<ViewCourse />} />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute allowedRoles={['influencer', 'admin']}>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/projects" element={
                  <ProtectedRoute allowedRoles={['influencer', 'admin']}>
                    <Projects />
                  </ProtectedRoute>
                } />
                <Route path="/create-project" element={
                  <ProtectedRoute allowedRoles={['influencer', 'admin']}>
                    <CreateProject />
                  </ProtectedRoute>
                } />
                <Route path="/edit-project/:id" element={
                  <ProtectedRoute allowedRoles={['influencer', 'admin']}>
                    <EditProject />
                  </ProtectedRoute>
                } />
                <Route path="/manage-knowledge/:id" element={
                  <ProtectedRoute allowedRoles={['influencer', 'admin']}>
                    <ManageKnowledge />
                  </ProtectedRoute>
                } />
                <Route path="/courses" element={
                  <ProtectedRoute allowedRoles={['influencer', 'admin']}>
                    <Courses />
                  </ProtectedRoute>
                } />
                <Route path="/create-course" element={
                  <ProtectedRoute allowedRoles={['influencer', 'admin']}>
                    <CreateCourse />
                  </ProtectedRoute>
                } />
                <Route path="/edit-course/:id" element={
                  <ProtectedRoute allowedRoles={['influencer', 'admin']}>
                    <EditCourse />
                  </ProtectedRoute>
                } />
                
                <Route path="/conversations/:courseId" element={
                  <ProtectedRoute allowedRoles={['influencer', 'admin']}>
                    <ViewConversations />
                  </ProtectedRoute>
                } />
                
                <Route path="/control" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Admin />
                  </ProtectedRoute>
                } />
                
                <Route path="/enrolled-courses" element={<EnrolledCourses />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
