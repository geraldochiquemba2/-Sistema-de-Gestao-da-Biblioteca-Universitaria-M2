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
import StudentLoans from "@/pages/student-loans";
import TeacherDashboard from "@/pages/teacher-dashboard";
import TeacherLoans from "@/pages/teacher-loans";
import StaffDashboard from "@/pages/staff-dashboard";
import StaffLoans from "@/pages/staff-loans";
import BookSearch from "@/pages/book-search";
import ReadingHistory from "@/pages/reading-history";
import Repository from "@/pages/repository";
import NotFound from "@/pages/not-found";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const isAdmin = user?.userType === "admin";

  return (
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
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  const [location] = useLocation();

  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/login" component={Login} />

      {/* Student Routes */}
      <Route path="/student/:rest*">
        <PrivateRoute requiredRole="student">
          <AuthenticatedLayout>
            <Switch>
              <Route path="/student/dashboard" component={StudentDashboard} />
              <Route path="/student/loans" component={StudentLoans} />
              <Route path="/student/books" component={BookSearch} />
              <Route path="/student/history" component={ReadingHistory} />
              <Route component={NotFound} />
            </Switch>
          </AuthenticatedLayout>
        </PrivateRoute>
      </Route>

      {/* Teacher Routes */}
      <Route path="/teacher/:rest*">
        <PrivateRoute requiredRole="teacher">
          <AuthenticatedLayout>
            <Switch>
              <Route path="/teacher/dashboard" component={TeacherDashboard} />
              <Route path="/teacher/loans" component={TeacherLoans} />
              <Route path="/teacher/books" component={BookSearch} />
              <Route path="/teacher/history" component={ReadingHistory} />
              <Route component={NotFound} />
            </Switch>
          </AuthenticatedLayout>
        </PrivateRoute>
      </Route>

      {/* Staff Routes */}
      <Route path="/staff/:rest*">
        <PrivateRoute requiredRole="staff">
          <AuthenticatedLayout>
            <Switch>
              <Route path="/staff/dashboard" component={StaffDashboard} />
              <Route path="/staff/loans" component={StaffLoans} />
              <Route path="/staff/books" component={BookSearch} />
              <Route path="/staff/history" component={ReadingHistory} />
              <Route component={NotFound} />
            </Switch>
          </AuthenticatedLayout>
        </PrivateRoute>
      </Route>

      {/* Admin Routes */}
      <Route path="/dashboard">
        <PrivateRoute requiredRole="admin">
          <AuthenticatedLayout>
            <Dashboard />
          </AuthenticatedLayout>
        </PrivateRoute>
      </Route>
      <Route path="/books">
        <PrivateRoute requiredRole="admin">
          <AuthenticatedLayout>
            <Books />
          </AuthenticatedLayout>
        </PrivateRoute>
      </Route>
      <Route path="/loans">
        <PrivateRoute requiredRole="admin">
          <AuthenticatedLayout>
            <Loans />
          </AuthenticatedLayout>
        </PrivateRoute>
      </Route>
      <Route path="/users">
        <PrivateRoute requiredRole="admin">
          <AuthenticatedLayout>
            <Users />
          </AuthenticatedLayout>
        </PrivateRoute>
      </Route>
      <Route path="/fines">
        <PrivateRoute requiredRole="admin">
          <AuthenticatedLayout>
            <Fines />
          </AuthenticatedLayout>
        </PrivateRoute>
      </Route>
      <Route path="/reports">
        <PrivateRoute requiredRole="admin">
          <AuthenticatedLayout>
            <Reports />
          </AuthenticatedLayout>
        </PrivateRoute>
      </Route>

      <Route path="/repository">
        <PrivateRoute>
          <AuthenticatedLayout>
            <Repository />
          </AuthenticatedLayout>
        </PrivateRoute>
      </Route>

      <Route component={NotFound} />
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
