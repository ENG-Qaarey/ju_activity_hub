import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Bell, CheckCircle, XCircle, Info, AlertCircle } from "lucide-react";
import { useActivity } from "@/contexts/ActivityContext";
import { useAuth } from "@/contexts/AuthContext";

const NotificationsCenter = () => {
  const { user } = useAuth();
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, getUnreadNotificationsCount } = useActivity();

  const roleFriendlyName: Record<string, string> = {
    student: "Student",
    coordinator: "Coordinator",
    admin: "Administrator",
  };

  const getNotificationConfig = (type: string) => {
    const configs: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
      approval: { icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
      rejection: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
      announcement: { icon: Info, color: "text-primary", bg: "bg-primary/10" },
      reminder: { icon: AlertCircle, color: "text-warning", bg: "bg-warning/10" },
    };
    return configs[type] || configs.announcement;
  };

  const unreadCount = getUnreadNotificationsCount();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              Stay informed as a {roleFriendlyName[user?.role ?? "student"]} in JU-AMS.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllNotificationsAsRead}
              >
                Mark all as read
              </Button>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Bell className="w-4 h-4" />
              {unreadCount} unread
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {notifications.map((notification, index) => {
            const config = getNotificationConfig(notification.type);
            const senderLabel = notification.senderRole
              ? roleFriendlyName[notification.senderRole]
              : undefined;
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
                  onClick={() => !notification.read && markNotificationAsRead(notification.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}
                      >
                        <config.icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h3 className="font-semibold">{notification.title}</h3>
                          <div className="flex items-center gap-2">
                            {senderLabel && (
                              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                {senderLabel}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {notification.createdAt}
                            </span>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {notifications.length === 0 && (
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

export default NotificationsCenter;
