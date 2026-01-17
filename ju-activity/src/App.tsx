import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ActivityProvider } from "@/contexts/ActivityContext";
import ConnectionError from "@/components/ConnectionError";

// Pages
import ProtectedRoute from "./components/routes/ProtectedRoute";
import SplashScreen from "./pages/SplashScreen";
import LoginScreen from "./pages/LoginScreen";
import RegisterScreen from "./pages/RegisterScreen";
import ProfileScreen from "./pages/ProfileScreen";
import ChangePasswordScreen from "./pages/ChangePasswordScreen";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentActivities from "./pages/student/StudentActivities";
import ActivityDetails from "./pages/student/ActivityDetails";
import StudentApplications from "./pages/student/StudentApplications";
import StudentNotifications from "./pages/student/StudentNotifications";
import CoordinatorDashboard from "./pages/coordinator/CoordinatorDashboard";
import CreateActivity from "./pages/coordinator/CreateActivity";
import ManageActivities from "./pages/coordinator/ManageActivities";
import CoordinatorApplications from "./pages/coordinator/CoordinatorApplications";
import AttendanceManagement from "./pages/coordinator/AttendanceManagement";
import CoordinatorNotifications from "./pages/coordinator/CoordinatorNotifications";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminActivities from "./pages/admin/AdminActivities";
import AdminCreateActivity from "./pages/admin/AdminCreateActivity";
import AdminApplications from "./pages/admin/AdminApplications";
import AdminNotifications from "./pages/admin/AdminNotifications";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageRoles from "./pages/admin/ManageRoles";
import MonitorActivities from "./pages/admin/MonitorActivities";
import AdminReports from "./pages/admin/AdminReports";
import SystemLogs from "./pages/admin/SystemLogs";
import AdminLogs from "./pages/admin/AdminLogs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ActivityProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ConnectionError />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<SplashScreen />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/register" element={<RegisterScreen />} />

            {/* Student Routes */}
            <Route
              path="/student/*"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <Routes>
                    <Route path="dashboard" element={<StudentDashboard />} />
                    <Route path="activities" element={<StudentActivities />} />
                    <Route path="activities/:id" element={<ActivityDetails />} />
                    <Route path="applications" element={<StudentApplications />} />
                    <Route path="notifications" element={<StudentNotifications />} />
                    <Route path="profile" element={<ProfileScreen />} />
                    <Route path="change-password" element={<ChangePasswordScreen />} />
                  </Routes>
                </ProtectedRoute>
              }
            />

            {/* Coordinator Routes */}
            <Route
              path="/coordinator/*"
              element={
                <ProtectedRoute allowedRoles={["coordinator"]}>
                   <Routes>
                    <Route path="dashboard" element={<CoordinatorDashboard />} />
                    <Route path="create-activity" element={<CreateActivity />} />
                    <Route path="activities" element={<ManageActivities />} />
                    <Route path="activities/:id/edit" element={<CreateActivity />} /> {/* Mock edit route reuses create */}
                    <Route path="applications" element={<CoordinatorApplications />} />
                    <Route path="attendance" element={<AttendanceManagement />} />
                    <Route path="notifications" element={<CoordinatorNotifications />} />
                    <Route path="profile" element={<ProfileScreen />} />
                    <Route path="change-password" element={<ChangePasswordScreen />} />
                   </Routes>
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                   <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="create-activity" element={<AdminCreateActivity />} />
                    <Route path="applications" element={<AdminApplications />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="manage-users" element={<ManageUsers />} />
                    <Route path="manage-roles" element={<ManageRoles />} />
                    <Route path="activities" element={<AdminActivities />} />
                    <Route path="monitor-activities" element={<MonitorActivities />} />
                    <Route path="notifications" element={<AdminNotifications />} />
                    <Route path="reports-advanced" element={<AdminReports />} />
                    <Route path="system-logs" element={<SystemLogs />} />
                    <Route path="logs" element={<AdminLogs />} />
                    <Route path="profile" element={<ProfileScreen />} />
                    <Route path="change-password" element={<ChangePasswordScreen />} />
                   </Routes>
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </ActivityProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
