import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useActivity } from "@/contexts/ActivityContext";
import { toast } from "@/hooks/use-toast";
import { activitiesApi, applicationsApi } from "@/lib/api";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  User,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ActivityDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getActivityById, getApplicationsByStudent, refreshData } = useActivity();
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [notes, setNotes] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  const [activity, setActivity] = useState<any | null | undefined>(undefined);

  const formatDate = (value: string) => {
    if (!value) return value;
    return value.includes("T") ? value.slice(0, 10) : value;
  };

  useEffect(() => {
    if (!id) {
      setActivity(null);
      return;
    }

    const fromContext = getActivityById(id);
    if (fromContext) {
      setActivity(fromContext);
      return;
    }

    let cancelled = false;
    setActivity(undefined);
    activitiesApi
      .getById(id)
      .then((data) => {
        if (!cancelled) setActivity(data);
      })
      .catch(() => {
        if (!cancelled) setActivity(null);
      });

    return () => {
      cancelled = true;
    };
  }, [getActivityById, id]);

  if (activity === undefined) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Loading activity…</h2>
        </div>
      </DashboardLayout>
    );
  }

  if (!activity) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Activity not found</h2>
          <Button
            variant="ghost"
            className="mt-4"
            onClick={() => navigate("/student/activities")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Activities
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      workshop: "bg-primary/10 text-primary",
      seminar: "bg-secondary text-secondary-foreground",
      training: "bg-success/10 text-success",
      extracurricular: "bg-warning/10 text-warning",
    };
    return colors[category] || "bg-muted text-muted-foreground";
  };

  const handleApply = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to apply for this activity.",
        variant: "destructive",
      });
      return;
    }

    if (!activity?.id) {
      toast({
        title: "Activity not available",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }

    if (activity?.status === "completed") {
      toast({
        title: "Activity completed",
        description: "This activity is completed. You can no longer apply.",
        variant: "destructive",
      });
      return;
    }

    setIsApplying(true);
    try {
      await applicationsApi.create({
        activityId: activity.id,
        activityTitle: activity.title,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });

      await refreshData();
      setShowApplyDialog(false);
      setNotes("");

      toast({
        title: "Application Submitted!",
        description: "Your application has been submitted successfully.",
      });

      navigate("/student/applications");
    } catch (error: any) {
      const message = error?.message || "Failed to submit application";
      toast({
        title: "Application failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const spotsRemaining = activity.capacity - activity.enrolled;
  const isFull = spotsRemaining <= 0;
  const hasApplied = Boolean(user && activity?.id && getApplicationsByStudent(user.id).some((a) => a.activityId === activity.id));
  const isCompleted = activity?.status === "completed";

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/student/activities")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Activities
        </Button>

        {/* Activity Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                <div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 capitalize ${getCategoryColor(
                      activity.category
                    )}`}
                  >
                    {activity.category}
                  </span>
                  <h1 className="text-2xl md:text-3xl font-bold">
                    {activity.title}
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  {isFull ? (
                    <span className="px-4 py-2 rounded-xl bg-destructive/10 text-destructive font-medium">
                      Fully Booked
                    </span>
                  ) : (
                    <span className="px-4 py-2 rounded-xl bg-success/10 text-success font-medium">
                      {spotsRemaining} spots left
                    </span>
                  )}
                </div>
              </div>

              <p className="text-muted-foreground text-lg mb-8">
                {activity.description}
              </p>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-semibold">{formatDate(activity.date)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="font-semibold">{activity.time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-semibold">{activity.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Coordinator</p>
                    <p className="font-semibold">{activity.coordinatorName}</p>
                  </div>
                </div>
              </div>

              {/* Capacity Bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    Enrollment Progress
                  </span>
                  <span className="text-sm font-medium">
                    {activity.enrolled}/{activity.capacity}
                  </span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isFull ? "bg-destructive" : "bg-primary"
                    }`}
                    style={{
                      width: `${(activity.enrolled / activity.capacity) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Apply Button */}
              <Button
                size="lg"
                className="w-full md:w-auto"
                disabled={isFull || hasApplied || isCompleted}
                onClick={() => {
                  if (isCompleted) {
                    toast({
                      title: "Activity completed",
                      description: "This activity is completed. You can no longer apply.",
                      variant: "destructive",
                    });
                    return;
                  }
                  setShowApplyDialog(true);
                }}
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                {isCompleted ? "Activity Completed" : hasApplied ? "Already Applied" : "Apply for this Activity"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Apply Dialog */}
        <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Apply for Activity</DialogTitle>
              <DialogDescription>
                Submit your application for "{activity.title}"
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Student Info */}
              <Card className="bg-muted/50 border-0">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Your Information</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Name:</span>{" "}
                      {user?.name}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Student ID:</span>{" "}
                      {user?.studentId}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Email:</span>{" "}
                      {user?.email}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information you'd like to share..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApplyDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleApply} disabled={isApplying || hasApplied || isCompleted}>
                {isApplying ? "Submitting..." : "Submit Application"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ActivityDetails;
