
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
import Courses from "@/pages/Courses";
import CreateCourse from "@/pages/CreateCourse";
import ViewCourse from "@/pages/ViewCourse";
import ProjectLanding from "@/pages/ProjectLanding";
import Admin from "@/pages/Admin";
import { ProtectedRoute } from "@/components/ProtectedRoute";

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
                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/:urlName" element={<ProjectLanding />} />
                
                {/* Influencer Routes */}
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
                
                {/* Customer Routes */}
                <Route path="/course/:id" element={
                  <ProtectedRoute allowedRoles={['customer', 'influencer', 'admin']}>
                    <ViewCourse />
                  </ProtectedRoute>
                } />
                
                {/* Admin Routes */}
                <Route path="/control" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Admin />
                  </ProtectedRoute>
                } />
                
                {/* Catch-all route */}
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
