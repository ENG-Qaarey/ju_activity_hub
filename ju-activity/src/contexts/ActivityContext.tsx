import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Application,
  Notification,
  mockActivities as mockActivitiesSeed,
  mockApplications as mockApplicationsSeed,
  mockNotifications as mockNotificationsSeed,
} from "@/data/mockData";
import { useAuth } from "./AuthContext";
import { activitiesApi, applicationsApi, notificationsApi, attendanceApi } from "@/lib/api";

type Attendance = {
  id: string;
  activityId: string;
  studentId: string;
  studentName: string;
  applicationId: string;
  status: "present" | "absent";
  markedBy: string;
  markedAt: string;
};

type CreateActivityInput = Pick<
  Activity,
  "title" | "description" | "category" | "date" | "time" | "location" | "capacity"
> & {
  // Admins can assign an activity to a coordinator; coordinators cannot spoof this (backend enforces).
  coordinatorId?: string;
};

interface ActivityContextType {
  activities: Activity[];
  applications: Application[];
  notifications: Notification[];
  attendance: Attendance[];
  isLoading: boolean;
  createActivity: (activity: CreateActivityInput) => Promise<Activity>;
  updateActivity: (id: string, updates: Partial<Activity>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  createApplication: (application: Omit<Application, "id" | "appliedAt" | "status">) => Promise<Application>;
  updateApplication: (id: string, updates: Partial<Application>) => Promise<void>;
  createNotification: (notification: Omit<Notification, "id" | "read" | "createdAt">) => Promise<Notification>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  getActivityById: (id: string) => Activity | undefined;
  getApplicationsByActivity: (activityId: string) => Application[];
  getApplicationsByStudent: (studentId: string) => Application[];
  getUnreadNotificationsCount: () => number;
  getApprovedApplicationsByActivity: (activityId: string) => Application[];
  markAttendance: (activityId: string, studentId: string, status: "present" | "absent", markedBy: string) => Promise<void>;
  getAttendanceByActivity: (activityId: string) => Attendance[];
  refreshAttendanceForActivity: (activityId: string) => Promise<Attendance[]>;
  saveAttendanceBatch: (activityId: string, attendanceData: Record<string, "present" | "absent">, markedBy: string) => Promise<void>;
  clearAllActivityData: () => void;
  refreshData: () => Promise<void>;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const ActivityProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load data from backend on mount and when user changes
  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user]);

  // Lightweight polling so users (especially students) see new notifications
  // created by admins/coordinators without needing a full reload.
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    let cancelled = false;

    const refreshNotifications = async () => {
      try {
        const latest = user.role === "admin"
          ? await notificationsApi.getAll()
          : await notificationsApi.getAll({ recipientId: user.id });
        if (!cancelled) {
          setNotifications(latest);
        }
      } catch {
        // Best-effort polling; ignore transient failures.
      }
    };

    // Initial refresh + periodic polling.
    refreshNotifications();
    const intervalId = window.setInterval(refreshNotifications, 15000);

    // Refresh when the tab regains focus.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshNotifications();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [user?.id, user?.role]);

  const useMockDataFallback = (currentUser: typeof user) => {
    const recipientId = currentUser?.id ?? "mock-recipient";
    const seededNotifications = mockNotificationsSeed.map((notif) => ({
      ...notif,
      recipientId,
    }));

    setActivities(mockActivitiesSeed);
    setApplications(mockApplicationsSeed);
    setNotifications(seededNotifications);
    setAttendance([]);
  };

  const refreshData = async () => {
    if (!user) {
      setActivities([]);
      setApplications([]);
      setNotifications([]);
      setAttendance([]);
      setIsLoading(false);
      return;
    }

    const token = localStorage.getItem("token");
    const hasToken = Boolean(token);

    setIsLoading(true);
    try {
      const applicationsParams = user.role === "student"
        ? { studentId: user.id }
        : undefined;

      // Coordinators and admins can still manage only what they own (enforced by backend),
      // but we load all activities so the UI can offer an "All Activities" view.
      const activitiesParams = undefined;

      // Kick off requests in parallel so we can hydrate activities ASAP
      const activitiesPromise = activitiesApi.getAll(activitiesParams);
      const applicationsPromise = hasToken ? applicationsApi.getAll(applicationsParams) : Promise.resolve([]);
      const notificationsPromise = hasToken
        ? user.role === "admin"
          ? notificationsApi.getAll()
          : notificationsApi.getAll({ recipientId: user.id })
        : Promise.resolve([]);
      const attendancePromise = hasToken
        ? user.role === "student"
          ? attendanceApi.getAll({ studentId: user.id })
          : Promise.resolve([])
        : Promise.resolve([]);

      // Activities are needed for most screens (including attendance dropdown), so set them first.
      const activitiesData = await activitiesPromise;
      setActivities(activitiesData);

      const [applicationsData, notificationsData, attendanceData] = await Promise.all([
        applicationsPromise,
        notificationsPromise,
        attendancePromise,
      ]);

      setApplications(applicationsData);
      setNotifications(notificationsData);
      setAttendance(attendanceData);
    } catch (error) {
      console.error("Failed to load data:", error);
      // Avoid silently switching to mock data for authenticated users.
      setActivities([]);
      setApplications([]);
      setNotifications([]);
      setAttendance([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter notifications for current user
  const userNotifications = useMemo(() => {
    if (!user) return [];
    return notifications.filter((notif) => notif.recipientId === user.id);
  }, [notifications, user]);

  const createActivity = async (
    activityData: CreateActivityInput
  ): Promise<Activity> => {
    if (!user) {
      throw new Error("You must be logged in to create an activity");
    }

    if (user.role !== "admin" && user.role !== "coordinator") {
      throw new Error("You do not have permission to create activities");
    }
    
    try {
      const payload = {
        ...activityData,
        ...(user.role === "admin" && activityData.coordinatorId
          ? { coordinatorId: activityData.coordinatorId }
          : {}),
      };
      const newActivity = await activitiesApi.create(payload);

    setActivities((prev) => [...prev, newActivity]);

      // Create notifications for all students about the new activity
      // This would require fetching all students from the backend
      // For now, we'll skip automatic notifications or implement it separately

      return newActivity;
    } catch (error: any) {
      throw new Error(error.message || "Failed to create activity");
    }
  };

  const updateActivity = async (id: string, updates: Partial<Activity>) => {
    try {
      const updated = await activitiesApi.update(id, updates);
    setActivities((prev) =>
        prev.map((activity) => (activity.id === id ? updated : activity))
    );
    } catch (error: any) {
      throw new Error(error.message || "Failed to update activity");
    }
  };

  const deleteActivity = async (id: string) => {
    try {
      await activitiesApi.delete(id);
    setActivities((prev) => prev.filter((activity) => activity.id !== id));
      // Applications are deleted on the backend via cascade
    setApplications((prev) => prev.filter((app) => app.activityId !== id));
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete activity");
    }
  };

  const createApplication = async (
    applicationData: Omit<Application, "id" | "appliedAt" | "status">
  ): Promise<Application> => {
    if (!user) {
      throw new Error("You must be logged in to apply for an activity");
    }

    try {
      // Check if activity exists
    const activity = activities.find((a) => a.id === applicationData.activityId);
    if (!activity) {
      throw new Error("Activity not found");
    }

      const newApplication = await applicationsApi.create({
      ...applicationData,
        studentId: user.id,
        studentName: user.name,
      });

    setApplications((prev) => [...prev, newApplication]);

      // Refresh activity to get updated enrolled count
      const updatedActivity = await activitiesApi.getById(applicationData.activityId);
      setActivities((prev) =>
        prev.map((a) => (a.id === applicationData.activityId ? updatedActivity : a))
      );

      return newApplication;
    } catch (error: any) {
      throw new Error(error.message || "Failed to create application");
    }
  };

  const updateApplication = async (id: string, updates: Partial<Application>) => {
    try {
      if (updates.status) {
    const application = applications.find((app) => app.id === id);
        if (!application) {
          throw new Error("Application not found");
        }

        await applicationsApi.updateStatus(id, updates.status, updates.notes);

        // Refresh data to get updated state
        await refreshData();
      } else {
        // For other updates, you may need to add a separate endpoint
        throw new Error("Only status updates are supported");
      }
    } catch (error: any) {
      throw new Error(error.message || "Failed to update application");
    }
  };

  const createNotification = async (
    notificationData: Omit<Notification, "id" | "read" | "createdAt">
  ): Promise<Notification> => {
    try {
      const newNotification = await notificationsApi.create(notificationData);
    setNotifications((prev) => [newNotification, ...prev]);
    return newNotification;
    } catch (error: any) {
      throw new Error(error.message || "Failed to create notification");
    }
  };

  const markNotificationAsRead = async (id: string) => {
    if (!user) return;

    try {
      await notificationsApi.markAsRead(id);
    setNotifications((prev) =>
      prev.map((notif) => 
        notif.id === id && notif.recipientId === user.id 
          ? { ...notif, read: true } 
          : notif
      )
    );
    } catch (error: any) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!user) return;

    try {
      await notificationsApi.markAllAsRead(user.id);
    setNotifications((prev) => 
      prev.map((notif) => 
          notif.recipientId === user.id ? { ...notif, read: true } : notif
      )
    );
    } catch (error: any) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const getActivityById = (id: string): Activity | undefined => {
    return activities.find((activity) => activity.id === id);
  };

  const getApplicationsByActivity = (activityId: string): Application[] => {
    return applications.filter((app) => app.activityId === activityId);
  };

  const getApplicationsByStudent = (studentId: string): Application[] => {
    return applications.filter((app) => app.studentId === studentId);
  };

  const getUnreadNotificationsCount = (): number => {
    if (!user) return 0;
    return userNotifications.filter((notif) => !notif.read).length;
  };

  const getApprovedApplicationsByActivity = (activityId: string): Application[] => {
    return applications.filter(
      (app) => app.activityId === activityId && app.status === "approved"
    );
  };

  const markAttendance = async (
    activityId: string,
    studentId: string,
    status: "present" | "absent",
    markedBy: string
  ) => {
    const application = applications.find(
      (app) => app.activityId === activityId && app.studentId === studentId && app.status === "approved"
    );
    if (!application) {
      throw new Error("Application not found or not approved");
    }

    try {
      const student = applications.find(
        (app) => app.studentId === studentId
    );
      const studentName = student?.studentName || "Unknown";

      await attendanceApi.markAttendance({
        activityId,
        studentId,
        studentName,
        applicationId: application.id,
        status,
        markedBy,
      });

      // Refresh attendance data
      const attendanceData = await attendanceApi.getAll({ activityId });
      setAttendance((prev) => {
        const otherActivityAttendance = prev.filter((a) => a.activityId !== activityId);
        return [...otherActivityAttendance, ...attendanceData];
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to mark attendance");
    }
  };

  const getAttendanceByActivity = useCallback(
    (activityId: string): Attendance[] => {
      return attendance.filter((a) => a.activityId === activityId);
    },
    [attendance]
  );

  const refreshAttendanceForActivity = useCallback(async (activityId: string): Promise<Attendance[]> => {
    try {
      const attendanceData = await attendanceApi.getAll({ activityId });
      setAttendance((prev) => {
        const otherActivityAttendance = prev.filter((a) => a.activityId !== activityId);
        return [...otherActivityAttendance, ...attendanceData];
      });
      return attendanceData;
    } catch (error: any) {
      throw new Error(error.message || "Failed to load attendance");
    }
  }, []);

  const saveAttendanceBatch = async (
    activityId: string,
    attendanceData: Record<string, "present" | "absent">,
    markedBy: string
  ) => {
    if (!user) {
      throw new Error("You must be logged in to mark attendance");
    }

    try {
      // Convert record to array format
      const attendanceArray = Object.entries(attendanceData).map(([studentId, status]) => {
        const application = applications.find(
          (app) => app.activityId === activityId && app.studentId === studentId && app.status === "approved"
        );
        if (!application) {
          throw new Error(`Application not found for student ${studentId}`);
        }

        const student = applications.find((app) => app.studentId === studentId);
        return {
          studentId,
          studentName: student?.studentName || "Unknown",
          applicationId: application.id,
          status,
        };
      });

      await attendanceApi.batchMarkAttendance({
        activityId,
        attendanceData: attendanceArray,
        markedBy,
      });

      // Refresh attendance data
      const updatedAttendance = await attendanceApi.getAll({ activityId });
      setAttendance((prev) => {
        const otherActivityAttendance = prev.filter((a) => a.activityId !== activityId);
        return [...otherActivityAttendance, ...updatedAttendance];
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to save attendance");
    }
  };

  const clearAllActivityData = () => {
    // This is for testing/development only
    // In production, data should be managed through the backend
    setActivities([]);
    setApplications([]);
    setNotifications([]);
    setAttendance([]);
  };

  const value = useMemo(
    () => ({
      activities,
      applications,
      notifications: userNotifications,
      attendance,
      isLoading,
      createActivity,
      updateActivity,
      deleteActivity,
      createApplication,
      updateApplication,
      createNotification,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      getActivityById,
      getApplicationsByActivity,
      getApplicationsByStudent,
      getUnreadNotificationsCount,
      getApprovedApplicationsByActivity,
      markAttendance,
      getAttendanceByActivity,
      refreshAttendanceForActivity,
      saveAttendanceBatch,
      clearAllActivityData,
      refreshData,
    }),
    [activities, applications, userNotifications, attendance, isLoading, user]
  );

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
};

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error("useActivity must be used within an ActivityProvider");
  }
  return context;
};
