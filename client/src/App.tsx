import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PrivateRoute } from "@/components/PrivateRoute";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import Welcome from "@/pages/welcome";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Books from "@/pages/books";
import Loans from "@/pages/loans";
import Users from "@/pages/users";
import Fines from "@/pages/fines";
import Reports from "@/pages/reports";
import StudentDashboard from "@/pages/student-dashboard";
import TeacherDashboard from "@/pages/teacher-dashboard";
import StaffDashboard from "@/pages/staff-dashboard";
import NotFound from "@/pages/not-found";

function AuthenticatedRouter() {
  return (
    <Switch>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/books" component={Books} />
      <Route path="/loans" component={Loans} />
      <Route path="/users" component={Users} />
      <Route path="/fines" component={Fines} />
      <Route path="/reports" component={Reports} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedLayout() {
  const { logout } = useAuth();
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <PrivateRoute requiredRole="admin">
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <header className="flex items-center justify-between px-6 py-3 border-b bg-background sticky top-0 z-10">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button variant="outline" onClick={logout} data-testid="button-logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </header>
            <main className="flex-1 overflow-auto">
              <AuthenticatedRouter />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </PrivateRoute>
  );
}

function Router() {
  const [location] = useLocation();
  const isPublicPage = location === "/" || location === "/login";
  const isStudentPage = location.startsWith("/student");
  const isTeacherPage = location.startsWith("/teacher");
  const isStaffPage = location.startsWith("/staff");

  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/login" component={Login} />
      <Route path="/student/dashboard">
        <PrivateRoute requiredRole="student">
          <StudentDashboard />
        </PrivateRoute>
      </Route>
      <Route path="/teacher/dashboard">
        <PrivateRoute requiredRole="teacher">
          <TeacherDashboard />
        </PrivateRoute>
      </Route>
      <Route path="/staff/dashboard">
        <PrivateRoute requiredRole="staff">
          <StaffDashboard />
        </PrivateRoute>
      </Route>
      <Route>
        {isPublicPage || isStudentPage || isTeacherPage || isStaffPage ? <NotFound /> : <AuthenticatedLayout />}
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
