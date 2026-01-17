import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useActivity } from "@/contexts/ActivityContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ClipboardList, UserCheck, UserX, Search } from "lucide-react";

const ReviewApplications = () => {
  const { applications, activities } = useActivity();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Coordinators can see all applications for all activities (including admin-created ones)
  const coordinatorApplications = user?.role === "admin"
    ? applications
    : applications; // Coordinators see all applications

  const statusVariants: Record<string, string> = {
    pending: "text-warning bg-warning/10",
    approved: "text-success bg-success/10",
    rejected: "text-destructive bg-destructive/10",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-hero rounded-2xl p-6 text-primary-foreground"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Review Applications</h1>
              <p className="text-primary-foreground/70 max-w-xl">
                {user?.role === "admin"
                  ? "Review and manage all student applications across the system. Approve or reject with notifications."
                  : "Prioritize student approvals, leave contextual notes, and close any pending requests."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                <Search className="w-5 h-5" />
                <span className="text-sm">Filter ready</span>
              </div>
              <Button variant="ghost" className="bg-white/10">
                <ClipboardList className="w-4 h-4 mr-2" />
                Export list
              </Button>
            </div>
          </div>
        </motion.div>

        <Card className="rounded-2xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg">Pending Applications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {coordinatorApplications.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg">No applications yet</h3>
                <p className="text-muted-foreground">
                  Applications for your activities will appear here
                </p>
              </div>
            ) : (
              coordinatorApplications.map((application) => (
                <div
                  key={application.id}
                  className="flex flex-col gap-3 rounded-2xl border border-muted/40 bg-card/40 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-sm text-muted-foreground">{application.appliedAt}</p>
                    <h3 className="text-lg font-semibold">{application.studentName}</h3>
                    <p className="text-sm text-muted-foreground">{application.activityTitle}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge className={statusVariants[application.status]}>
                      {application.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="border border-border"
                      onClick={() => navigate(`/${user?.role === "admin" ? "admin" : "coordinator"}/applications/${application.id}`)}
                    >
                      <UserCheck className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ReviewApplications;
