import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useActivity } from "@/contexts/ActivityContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { applicationsApi, attendanceApi } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardList, Check, Users, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Loading, ListSkeleton } from "@/components/ui/loading";

const AttendanceManagement = () => {
  const { user } = useAuth();
  const {
    activities,
    refreshAttendanceForActivity,
  } = useActivity();
  const [selectedActivityId, setSelectedActivityId] = useState<string>("");
  const [attendance, setAttendance] = useState<Record<string, "present" | "absent">>({});
  type ApprovedAttendanceRow = {
    id: string;
    studentId: string;
    studentName: string;
    appliedAt: string;
  };

  const [approvedApplications, setApprovedApplications] = useState<ApprovedAttendanceRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isRosterLoading, setIsRosterLoading] = useState(false);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);

  const formatDate = (value: string) => {
    if (!value) return value;
    return value.includes("T") ? value.slice(0, 10) : value;
  };

  const coordinatorActivities = activities;
  const manageableActivities = useMemo(() => {
    if (!user) return [];
    return activities.filter((a) => a.coordinatorId === user.id);
  }, [activities, user]);

  // Load approved students ASAP (fast roster), then hydrate attendance in background.
  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (!selectedActivityId) {
        if (isMounted) {
          setApprovedApplications([]);
          setAttendance({});
          setIsRosterLoading(false);
          setIsAttendanceLoading(false);
        }
        return;
      }

      try {
        setIsRosterLoading(true);
        const apps = await applicationsApi.getApprovedForAttendance(selectedActivityId);
        const rosterAttendance: Record<string, "present" | "absent"> = {};
        (apps as ApprovedAttendanceRow[]).forEach((app) => {
          rosterAttendance[app.studentId] = "present";
        });

        if (isMounted) {
          setApprovedApplications(apps as ApprovedAttendanceRow[]);
          setAttendance(rosterAttendance);
        }

        // Attendance hydration should not block roster rendering.
        setIsAttendanceLoading(true);
        refreshAttendanceForActivity(selectedActivityId)
          .then((existingAttendance) => {
            if (!isMounted) return;
            setAttendance((prev) => {
              const merged = { ...prev } as Record<string, "present" | "absent">;
              existingAttendance.forEach((att) => {
                merged[att.studentId] = att.status;
              });
              return merged;
            });
          })
          .finally(() => {
            if (!isMounted) return;
            setIsAttendanceLoading(false);
          });
      } catch (e) {
        // Keep current UI state on transient failures (prevents flicker/reloading loops)
        if (isMounted) {
          setApprovedApplications((prev) => prev);
          setAttendance((prev) => prev);
        }
      } finally {
        if (isMounted) {
          setIsRosterLoading(false);
        }
      }
    };

    run();
    return () => {
      isMounted = false;
    };
  }, [selectedActivityId]);

  const toggleAttendance = (studentId: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "present" ? "absent" : "present",
    }));
  };

  const setAttendanceStatus = (studentId: string, status: "present" | "absent") => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const presentCount = useMemo(() => {
    return approvedApplications.reduce((count, app) => {
      return attendance[app.studentId] === "present" ? count + 1 : count;
    }, 0);
  }, [approvedApplications, attendance]);

  const absentCount = useMemo(() => {
    return approvedApplications.reduce((count, app) => {
      return attendance[app.studentId] === "absent" ? count + 1 : count;
    }, 0);
  }, [approvedApplications, attendance]);

  const handleSaveAttendance = async () => {
    if (!selectedActivityId || !user) {
      toast({
        title: "Error",
        description: "Please select an activity",
        variant: "destructive",
      });
      return;
    }

    if (Object.keys(attendance).length === 0) {
      toast({
        title: "Error",
        description: "No attendance data to save",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const attendanceData = approvedApplications.map((app) => ({
        studentId: app.studentId,
        studentName: app.studentName,
        applicationId: app.id,
        status: attendance[app.studentId] ?? "present",
      }));

      await attendanceApi.batchMarkAttendance({
        activityId: selectedActivityId,
        attendanceData,
        markedBy: user.id,
      });

      await refreshAttendanceForActivity(selectedActivityId);
      toast({
        title: "Attendance Saved!",
        description: "Attendance records have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save attendance",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading text="Loading..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-hero rounded-2xl p-6 text-white"
        >
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Attendance Management</h1>
            <p className="text-white/90">
              {user?.role === "admin"
                ? "Track attendance for all approved students across all activities and mark no-shows easily."
                : "Track attendance for students who are approved for your activities and mark no-shows easily."}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="rounded-2xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Select Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {coordinatorActivities.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground text-lg">
                    No activities available
                  </p>
                  <p className="text-sm text-muted-foreground/70 mt-2">
                    {user?.role === "admin"
                      ? "Create activities to start tracking attendance."
                      : "No activities exist yet."}
                  </p>
                </div>
              ) : (
                <Select value={selectedActivityId} onValueChange={setSelectedActivityId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an activity" />
                  </SelectTrigger>
                  <SelectContent>
                    {coordinatorActivities.map((activity) => (
                      <SelectItem
                        key={activity.id}
                        value={activity.id}
                        disabled={user?.role === "coordinator" ? activity.coordinatorId !== user.id : false}
                      >
                        {activity.title} - {formatDate(activity.date)}{activity.time ? ` ${activity.time}` : ""}
                        {user?.role === "coordinator" && activity.coordinatorId !== user.id ? " (Not assigned)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {user?.role === "coordinator" && coordinatorActivities.length > 0 && manageableActivities.length === 0 && (
                <p className="text-xs text-muted-foreground mt-3">
                  Activities exist, but none are assigned to you yet.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <AnimatePresence mode="wait">
          {selectedActivityId && (
            <motion.div
              key={selectedActivityId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Approved Students ({approvedApplications.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isRosterLoading ? (
                    <div className="py-8">
                      <ListSkeleton count={3} />
                    </div>
                  ) : approvedApplications.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-12"
                    >
                      <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground text-lg">
                        No approved students for this activity yet
                      </p>
                      <p className="text-sm text-muted-foreground/70 mt-2">
                        Students need to apply and be approved first
                      </p>
                    </motion.div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
                        <div className="text-sm text-muted-foreground">
                          Mark each student as present or absent.
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {isAttendanceLoading && (
                            <Badge variant="outline" className="bg-muted text-muted-foreground">
                              Syncing attendance...
                            </Badge>
                          )}
                          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                            Present: {presentCount}
                          </Badge>
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                            Absent: {absentCount}
                          </Badge>
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            Total: {approvedApplications.length}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {approvedApplications.map((application, index) => (
                          <motion.div
                            key={application.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: Math.min(index * 0.015, 0.18) }}
                            className="flex flex-col gap-3 rounded-xl border border-border bg-card/50 p-4 hover:bg-card/80 hover:shadow-md transition-all duration-200 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-10 w-10 flex-shrink-0 rounded-2xl bg-muted/60 flex items-center justify-center border border-border">
                                <span className="text-sm font-bold text-foreground">{index + 1}</span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground truncate">
                                  {application.studentName}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                  Applied: {formatDate(application.appliedAt)}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant={attendance[application.studentId] === "present" ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setAttendanceStatus(application.studentId, "present")}
                                  className={
                                    attendance[application.studentId] === "present"
                                      ? "bg-success text-success-foreground hover:bg-success/90"
                                      : ""
                                  }
                                >
                                  Present
                                </Button>
                                <Button
                                  type="button"
                                  variant={attendance[application.studentId] === "absent" ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setAttendanceStatus(application.studentId, "absent")}
                                  className={
                                    attendance[application.studentId] === "absent"
                                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      : ""
                                  }
                                >
                                  Absent
                                </Button>
                              </div>

                              <motion.div
                                animate={{
                                  scale: attendance[application.studentId] === "present" ? 1 : 0.98,
                                }}
                                transition={{ duration: 0.2 }}
                              >
                                <Badge
                                  className={
                                    attendance[application.studentId] === "present"
                                      ? "bg-success/10 text-success border-success/20"
                                      : "bg-destructive/10 text-destructive border-destructive/20"
                                  }
                                  variant="outline"
                                >
                                  {attendance[application.studentId] === "present" ? "Present" : "Absent"}
                                </Badge>
                              </motion.div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleAttendance(application.studentId)}
                                className="text-xs"
                              >
                                Toggle
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-right pt-4 border-t"
                      >
                        <Button
                          onClick={handleSaveAttendance}
                          disabled={isSaving}
                          size="lg"
                          className="min-w-[160px]"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Save Attendance
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default AttendanceManagement;
