import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useActivity } from "@/contexts/ActivityContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

const ApproveRejectApplication = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { applications, getActivityById, updateApplication, getApprovedApplicationsByActivity } = useActivity();
  const application = applications.find((app) => app.id === id);
  const activity = application ? getActivityById(application.activityId) : undefined;
  const [comment, setComment] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const basePath = user?.role === "admin" ? "/admin/applications" : "/coordinator/applications";

  // Check if activity is at full capacity
  const isFull = activity ? getApprovedApplicationsByActivity(activity.id).length >= activity.capacity : false;

  if (!application || !activity) {
    const basePath = user?.role === "admin" ? "/admin/applications" : "/coordinator/applications";
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Application not found</h2>
          <Button variant="ghost" className="mt-4" onClick={() => navigate(basePath)}>
            Back to Applications
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const getBasePath = () => {
    return user?.role === "admin" ? "/admin/applications" : "/coordinator/applications";
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      updateApplication(application.id, {
        status: "approved",
        notes: comment.trim() || undefined,
      });
      toast({
        title: "Application Approved",
        description: "The student has been notified via notification.",
      });
      navigate(getBasePath());
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve application",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      updateApplication(application.id, {
        status: "rejected",
        notes: comment.trim() || undefined,
      });
      toast({
        title: "Application Rejected",
        description: "The student has been notified via notification.",
      });
      navigate(getBasePath());
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject application",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-hero rounded-2xl p-6 text-primary-foreground"
        >
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Approve / Reject Application</h1>
            <p className="text-primary-foreground/75">
              Confirm enrollment or provide a rationale for rejection before updating the student.
            </p>
          </div>
        </motion.div>

        <Card className="rounded-2xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg">Student Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div>
                <p className="text-xs uppercase tracking-wide">Name</p>
                <p className="font-semibold text-foreground">{application.studentName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide">Applied</p>
                <p className="font-semibold text-foreground">{application.appliedAt}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide">Status</p>
                <p className="font-semibold text-foreground">{application.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg">Activity Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p className="text-xs uppercase tracking-wide">Title</p>
              <p className="text-base font-semibold text-foreground">
                {activity?.title}
              </p>
              <p className="text-xs uppercase tracking-wide">Coordinator</p>
              <p className="text-base font-semibold text-foreground">
                {activity?.coordinatorName}
              </p>
              <p className="text-xs uppercase tracking-wide">Location</p>
              <p className="text-base font-semibold text-foreground">
                {activity?.location}{" • "}{activity?.date} {activity?.time}
              </p>
              <p className="text-xs uppercase tracking-wide">Capacity</p>
              <p className="text-base font-semibold text-foreground">
                {activity?.enrolled}/{activity?.capacity}
                {isFull && (
                  <span className="ml-2 px-2 py-1 rounded text-xs bg-destructive/10 text-destructive font-medium">
                    FULL
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg">Decision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Notes</p>
              <Textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Add an optional comment for the student"
                className="bg-background"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Button
                variant="outline"
                className="flex items-center justify-center gap-2 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={handleReject}
                disabled={isProcessing || application.status !== "pending"}
              >
                <XCircle className="w-5 h-5" />
                {isProcessing ? "Processing..." : "Reject Application"}
              </Button>
              <Button
                className="flex items-center justify-center gap-2"
                onClick={handleApprove}
                disabled={isProcessing || application.status !== "pending" || isFull}
                title={isFull ? "Activity has reached maximum capacity" : ""}
              >
                <CheckCircle className="w-5 h-5" />
                {isProcessing ? "Processing..." : isFull ? "Activity Full - Cannot Approve" : "Approve & Notify"}
              </Button>
              {isFull && (
                <p className="text-sm text-destructive col-span-2 text-center">
                  ⚠️ This activity has reached maximum capacity. No more approvals can be accepted.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ApproveRejectApplication;
