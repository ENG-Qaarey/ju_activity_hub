import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { mockActivities, mockApplications } from "@/data/mockData";
import { useEffect, useState } from "react";
import { userService } from "@/services/userService";
import {
  Users,
  Calendar,
  BarChart3,
  Shield,
  AlertTriangle,
  TrendingUp,
  Activity,
  FileText,
  ClipboardList,
  FilePlus,
  Inbox,
  Loader2,
  UserCheck,
  UserX,
  Percent
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    activePercentage: 0,
    loading: true
  });

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const stats = await userService.getUserStats();
        setUserStats(prev => ({
          ...stats,
          loading: false
        }));
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
        setUserStats(prev => ({
          ...prev,
          loading: false
        }));
      }
    };

    fetchUserStats();
  }, []);

  const stats = [
    {
      label: "Total Users",
      value: userStats.loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : userStats.total.toLocaleString(),
      change: "",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Active Users",
      value: userStats.loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : userStats.active.toLocaleString(),
      change: "",
      icon: UserCheck,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Inactive Users",
      value: userStats.loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : userStats.inactive.toLocaleString(),
      change: "",
      icon: UserX,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      label: "Active Rate",
      value: userStats.loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : `${userStats.activePercentage}%`,
      change: "",
      icon: Percent,
      color: "text-secondary-foreground",
      bgColor: "bg-secondary",
    },
  ];

  const quickActions = [
    { label: "Create Activity", icon: FilePlus, path: "/admin/create-activity" },
    { label: "Monitor Activities", icon: Calendar, path: "/admin/monitor-activities" },
    { label: "Review Applications", icon: ClipboardList, path: "/admin/applications" },
    { label: "Directory", icon: Users, path: "/admin/users" },
    { label: "Manage Users", icon: Shield, path: "/admin/manage-users" },
    { label: "Reports", icon: BarChart3, path: "/admin/reports" },
    { label: "Advanced Reports", icon: FileText, path: "/admin/reports-advanced" },
    { label: "Audit Logs", icon: FileText, path: "/admin/logs" },
  ];

  const recentAlerts = [
    { id: 1, message: "High traffic detected on activity registrations", type: "warning", time: "2 min ago" },
    { id: 2, message: "New coordinator account created", type: "info", time: "15 min ago" },
    { id: 3, message: "System backup completed successfully", type: "success", time: "1 hour ago" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-hero rounded-2xl p-6 text-primary-foreground"
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Admin Dashboard 🛡️
              </h1>
              <p className="text-primary-foreground/80">
                Monitor system performance and manage users
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-card/20 backdrop-blur">
              <Shield className="w-5 h-5" />
              <span className="font-medium">System Status: Healthy</span>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <span className="flex items-center gap-1 text-xs font-medium text-success">
                      <TrendingUp className="w-3 h-3" />
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-muted-foreground text-sm">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate(action.path)}
                  >
                    <action.icon className="w-4 h-4 mr-3" />
                    {action.label}
                  </Button>
                ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* System Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  System Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-4 p-4 rounded-xl ${
                      alert.type === "warning"
                        ? "bg-warning/10 border border-warning/20"
                        : alert.type === "success"
                        ? "bg-success/10 border border-success/20"
                        : "bg-muted/50 border border-border"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        alert.type === "warning"
                          ? "bg-warning"
                          : alert.type === "success"
                          ? "bg-success"
                          : "bg-primary"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm text-muted-foreground">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* User Distribution Chart Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">User Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-around py-8">
                {[
                  { label: "Students", value: 120, color: "bg-primary" },
                  { label: "Coordinators", value: 24, color: "bg-success" },
                  { label: "Admins", value: 12, color: "bg-warning" },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div
                      className={`w-20 h-20 rounded-2xl ${item.color}/10 flex items-center justify-center mx-auto mb-3`}
                    >
                      <span className={`text-2xl font-bold ${item.color.replace("bg-", "text-")}`}>
                        {item.value}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
