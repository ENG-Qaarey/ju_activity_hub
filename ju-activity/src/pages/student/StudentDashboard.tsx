import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useActivity } from "@/contexts/ActivityContext";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  FileText,
  CheckCircle,
  Bell,
  ArrowRight,
  Clock,
  MapPin,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

const StudentDashboard = () => {
  const { user } = useAuth();
  const { activities, applications, notifications } = useActivity();
  const navigate = useNavigate();

  const formatDate = (value: string) => {
    if (!value) return value;
    return value.includes("T") ? value.slice(0, 10) : value;
  };

  const parseActivityDateTime = (dateValue: string, timeValue?: string) => {
    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) return null;

    let hours = 0;
    let minutes = 0;

    const timeText = (timeValue ?? "").trim();
    if (timeText) {
      const match = timeText.match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
      if (match) {
        hours = Number.parseInt(match[1], 10);
        minutes = Number.parseInt(match[2], 10);
        const meridiem = match[3]?.toLowerCase();
        if (meridiem) {
          if (hours === 12) hours = 0;
          if (meridiem === "pm") hours += 12;
        }
      }
    }

    return new Date(
      parsedDate.getFullYear(),
      parsedDate.getMonth(),
      parsedDate.getDate(),
      hours,
      minutes,
      0,
      0
    );
  };

  const stats = [
    {
      label: "Available Activities",
      value: activities.length,
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Applied Activities",
      value: applications.length,
      icon: FileText,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      label: "Approved Activities",
      value: applications.filter((a) => a.status === "approved").length,
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ];

  const now = new Date();

  // Opposite of "upcoming": show recent/past activities (time-aware)
  const recentActivities = activities
    .map((activity) => ({
      activity,
      dateTime: parseActivityDateTime(activity.date, (activity as any).time),
    }))
    .filter(({ dateTime }) => dateTime && dateTime.getTime() <= now.getTime())
    .sort((a, b) => b.dateTime!.getTime() - a.dateTime!.getTime())
    .map(({ activity }) => activity)
    .slice(0, 3);

  const unreadNotifications = notifications.filter((n) => !n.read);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-hero rounded-2xl p-6 text-primary-foreground"
        >
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Welcome back, {(user?.name ?? "Student").split(" ")[0]}! 👋
          </h1>
          <p className="text-primary-foreground/80">
            Ready to explore new activities and enhance your university experience?
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">{stat.label}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent / Past Activities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Activities</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/student/activities")}
                >
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => navigate(`/student/activities/${activity.id}`)}
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{activity.title}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(activity.date)} {("time" in activity && (activity as any).time) ? `• ${(activity as any).time}` : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {activity.location}
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                      {activity.category}
                    </span>
                  </div>
                ))}
                {recentActivities.length === 0 && (
                  <p className="text-sm text-muted-foreground">No recent activities yet.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </CardTitle>
                {unreadNotifications.length > 0 && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-destructive text-destructive-foreground">
                    {unreadNotifications.length} new
                  </span>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {notifications.slice(0, 4).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                      notification.read
                        ? "bg-background border-border"
                        : "bg-accent/50 border-primary/20"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          notification.type === "approval"
                            ? "bg-success"
                            : notification.type === "rejection"
                            ? "bg-destructive"
                            : "bg-primary"
                        }`}
                      />
                      <div>
                        <p className="font-medium text-sm">{notification.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="text-sm text-muted-foreground">No notifications yet.</p>
                )}
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate("/student/notifications")}
                >
                  View All Notifications
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
