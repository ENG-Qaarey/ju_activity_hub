import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useActivity } from "@/contexts/ActivityContext";
import { useAuth } from "@/contexts/AuthContext";

const StudentApplications = () => {
  const { user } = useAuth();
  const { applications } = useActivity();

  const myApplications = user ? applications.filter((a: any) => a.studentId === user.id) : [];

  const formatDateTime = (value: string) => {
    if (!value) return value;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString();
  };

  const getApplicationTitle = (application: any) => {
    return application.activityTitle || application.activity?.title || "Activity";
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { icon: typeof CheckCircle; color: string; bg: string }> = {
      pending: { icon: AlertCircle, color: "text-warning", bg: "bg-warning/10" },
      approved: { icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
      rejected: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
    };
    return configs[status] || configs.pending;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">My Applications</h1>
          <p className="text-muted-foreground">
            Track the status of your activity applications
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Pending", count: myApplications.filter((a: any) => a.status === "pending").length, status: "pending" },
            { label: "Approved", count: myApplications.filter((a: any) => a.status === "approved").length, status: "approved" },
            { label: "Rejected", count: myApplications.filter((a: any) => a.status === "rejected").length, status: "rejected" },
          ].map((stat) => {
            const config = getStatusConfig(stat.status);
            return (
              <Card key={stat.status}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center`}>
                    <config.icon className={`w-6 h-6 ${config.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.count}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {myApplications.map((application: any, index) => {
            const config = getStatusConfig(application.status);
            return (
              <motion.div
                key={application.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                          <config.icon className={`w-6 h-6 ${config.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{getApplicationTitle(application)}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Applied: {formatDateTime(application.appliedAt)}
                            </span>
                          </div>
                          {application.notes && (
                            <p className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded-lg">
                              {application.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge
                        className={`${config.bg} ${config.color} border-0 capitalize text-sm px-4 py-1`}
                      >
                        {application.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {myApplications.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg">No applications yet</h3>
            <p className="text-muted-foreground">
              Start exploring activities and submit your first application!
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentApplications;
