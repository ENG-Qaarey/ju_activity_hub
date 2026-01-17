import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useActivity } from "@/contexts/ActivityContext";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  FileText,
  Users,
  CheckCircle,
  Plus,
  ArrowRight,
  Clock,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

const CoordinatorDashboard = () => {
  const { user } = useAuth();
  const { activities, applications } = useActivity();
  const navigate = useNavigate();

  const displayName = (user?.name || "").trim().split(/\s+/)[0] || user?.name || "there";

  const toDateOnly = (value?: string) => {
    if (!value) return "";
    return value.includes("T") ? value.split("T")[0] : value;
  };

  const allActivities = activities;
  const pendingApplications = applications.filter((a) => a.status === "pending");
  const approvedApplications = applications.filter((a) => a.status === "approved");
  const upcomingActivities = allActivities.filter((a) => a.status === "upcoming");

  const stats = [
    {
      label: "All Activities",
      value: allActivities.length,
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Upcoming Activities",
      value: upcomingActivities.length,
      icon: FileText,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      label: "Total Enrolled",
      value: allActivities.reduce((sum, a) => sum + a.enrolled, 0),
      icon: Users,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Pending Applications",
      value: pendingApplications.length,
      icon: CheckCircle,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
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
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Welcome, {displayName}! 📋
          </h1>
          <p className="text-primary-foreground/80 mb-4">
            Manage your activities and review student applications
          </p>
          <Button
            variant="hero"
            onClick={() => navigate("/coordinator/create-activity")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Activity
          </Button>
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
                  <div className="flex flex-col items-center text-center md:flex-row md:text-left md:items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-muted-foreground text-sm">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Activities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">All Activities</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/coordinator/activities")}
                >
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {allActivities.slice(0, 3).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{activity.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {activity.enrolled}/{activity.capacity} enrolled
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {toDateOnly(activity.date)}
                    </span>
                  </div>
                ))}

                {allActivities.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-70" />
                    <p>No activities available yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Pending Applications (for your activities) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  Pending Applications
                  {pendingApplications.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
                      {pendingApplications.length}
                    </span>
                  )}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/coordinator/applications")}
                >
                  Review <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingApplications.slice(0, 4).map((application) => (
                  <div
                    key={application.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-warning/5 border border-warning/20"
                  >
                    <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-warning" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{application.studentName}</h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {application.activityTitle}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/coordinator/applications")}
                    >
                      Review
                    </Button>
                  </div>
                ))}

                {pendingApplications.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle className="w-10 h-10 mx-auto mb-2 text-success" />
                    <p>All applications reviewed!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CoordinatorDashboard;
