import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useActivity } from "@/contexts/ActivityContext";
import { toast } from "@/hooks/use-toast";
import { Bell, CheckCircle, XCircle, Info, AlertCircle } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { LinesListSkeleton } from "@/components/ui/loading";

const StudentNotifications = () => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, isLoading } = useActivity();
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const getNotificationConfig = (type: string) => {
    const configs: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
      approval: { icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
      rejection: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
      announcement: { icon: Info, color: "text-primary", bg: "bg-primary/10" },
      reminder: { icon: AlertCircle, color: "text-warning", bg: "bg-warning/10" },
    };
    return configs[type] || configs.announcement;
  };

  const parsedNotifications = useMemo(
    () =>
      notifications
        .map((notification: any) => ({
          ...notification,
          createdAtDate: new Date(notification.createdAt),
        }))
        .sort((a: any, b: any) => b.createdAtDate.getTime() - a.createdAtDate.getTime()),
    [notifications],
  );

  const unreadCount = useMemo(
    () => notifications.filter((n: any) => !n.read).length,
    [notifications],
  );

  const formatCreatedAt = (value: Date) => {
    if (Number.isNaN(value.getTime())) return "Unknown";
    return value.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleMarkOne = async (id: string) => {
    setMarkingId(id);
    try {
      await markNotificationAsRead(id);
    } catch (error) {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Unable to update notification",
        variant: "destructive",
      });
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAll = async () => {
    if (unreadCount === 0) return;
    setIsMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      toast({ title: "All caught up", description: "All notifications marked as read." });
    } catch (error) {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Unable to mark all notifications",
        variant: "destructive",
      });
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with your activity applications
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Bell className="w-4 h-4" />
              {unreadCount} unread
            </div>
            <Button variant="outline" size="sm" onClick={handleMarkAll} disabled={isMarkingAll || unreadCount === 0}>
              {isMarkingAll ? "Marking..." : "Mark all read"}
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {isLoading && parsedNotifications.length === 0 ? (
            <LinesListSkeleton count={6} />
          ) : (
          parsedNotifications.map((notification: any, index: number) => {
            const config = getNotificationConfig(notification.type);
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`transition-all hover:shadow-md cursor-pointer ${
                    !notification.read ? "border-l-4 border-l-primary" : ""
                  }`}
                  onClick={() => (!notification.read ? handleMarkOne(notification.id) : undefined)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}
                      >
                        <config.icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold">{notification.title}</h3>
                          <span className="text-xs text-muted-foreground">
                            {formatCreatedAt(notification.createdAtDate)}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">
                          {notification.message}
                        </p>
                        {!notification.read && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {markingId === notification.id ? "Marking as read..." : "Tap to mark as read"}
                          </p>
                        )}
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          }))}
        </div>

        {parsedNotifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg">No notifications</h3>
            <p className="text-muted-foreground">
              You're all caught up! Check back later for updates.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentNotifications;
