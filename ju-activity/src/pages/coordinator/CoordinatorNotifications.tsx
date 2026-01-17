import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useActivity } from "@/contexts/ActivityContext";
import { toast } from "@/hooks/use-toast";
import type { Notification } from "@/data/mockData";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Megaphone,
  Info,
  Search,
  MailCheck,
  Filter,
  Inbox,
} from "lucide-react";

const notificationMeta: Record<
  Notification["type"],
  { label: string; icon: typeof Bell; accent: string; chip: string }
> = {
  approval: {
    label: "Approval",
    icon: CheckCircle2,
    accent: "text-emerald-600 dark:text-emerald-400",
    chip: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  rejection: {
    label: "Rejection",
    icon: AlertTriangle,
    accent: "text-destructive",
    chip: "bg-destructive/10 text-destructive",
  },
  announcement: {
    label: "Announcement",
    icon: Megaphone,
    accent: "text-primary",
    chip: "bg-primary/10 text-primary",
  },
  reminder: {
    label: "Reminder",
    icon: Info,
    accent: "text-blue-600 dark:text-blue-400",
    chip: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200",
  },
};

const typeFilters: Array<"all" | Notification["type"]> = [
  "all",
  "approval",
  "rejection",
  "announcement",
  "reminder",
];

const statusFilters = ["all", "unread", "read"] as const;

type StatusFilter = (typeof statusFilters)[number];

const CoordinatorNotifications = () => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useActivity();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<(typeof typeFilters)[number]>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [markingNotificationId, setMarkingNotificationId] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const parsedNotifications = useMemo(
    () =>
      notifications
        .map((notification) => ({
          ...notification,
          createdAtDate: new Date(notification.createdAt),
        }))
        .sort((a, b) => b.createdAtDate.getTime() - a.createdAtDate.getTime()),
    [notifications],
  );

  const filteredNotifications = useMemo(
    () =>
      parsedNotifications.filter((notification) => {
        const matchesType = typeFilter === "all" || notification.type === typeFilter;
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "unread" && !notification.read) ||
          (statusFilter === "read" && notification.read);
        const matchesSearch =
          notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notification.message.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesType && matchesStatus && matchesSearch;
      }),
    [parsedNotifications, typeFilter, statusFilter, searchTerm],
  );

  const unreadCount = useMemo(
    () => notifications.filter((notif) => !notif.read).length,
    [notifications],
  );

  const handleMarkNotification = async (id: string) => {
    setMarkingNotificationId(id);
    try {
      await markNotificationAsRead(id);
      toast({ title: "Updated", description: "Marked as read." });
    } catch (error) {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Unable to update notification",
        variant: "destructive",
      });
    } finally {
      setMarkingNotificationId(null);
    }
  };

  const handleMarkAll = async () => {
    if (!unreadCount) return;
    setIsMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      toast({ title: "All caught up", description: "Every notification is now marked as read." });
    } catch (error) {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Unable to mark notifications",
        variant: "destructive",
      });
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 w-full">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase text-muted-foreground tracking-wide">Coordinator inbox</p>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              Notifications
              <span className="text-sm font-medium text-primary/80 bg-primary/10 px-3 py-1 rounded-full">
                {unreadCount} unread
              </span>
            </h1>
            <p className="text-muted-foreground">Updates about your activities and student applications.</p>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto md:justify-end">
            <Button
              variant="outline"
              onClick={handleMarkAll}
              disabled={isMarkingAll || unreadCount === 0}
              className="flex-1 sm:flex-none"
            >
              {isMarkingAll ? "Marking..." : "Mark all read"}
            </Button>
            <Button
              variant="secondary"
              className="gap-2 flex-1 sm:flex-none"
              onClick={() => toast({ title: "Not implemented", description: "Export will be added later." })}
            >
              <MailCheck className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications feed
              </CardTitle>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search title or message"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="pl-9 w-full"
                  />
                </div>
                <Button
                  variant="outline"
                  className="gap-2 w-full sm:w-auto"
                  onClick={() => {
                    setTypeFilter("all");
                    setStatusFilter("all");
                    setSearchTerm("");
                  }}
                >
                  <Filter className="w-4 h-4" />
                  Reset
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {typeFilters.map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant={typeFilter === type ? "default" : "outline"}
                  onClick={() => setTypeFilter(type)}
                  className="capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {statusFilters.map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={statusFilter === status ? "default" : "ghost"}
                  onClick={() => setStatusFilter(status)}
                  className="capitalize"
                >
                  {status}
                </Button>
              ))}
            </div>
          </CardHeader>

          <Separator />

          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground space-y-3">
              <Inbox className="w-10 h-10 mx-auto" />
              <p className="font-semibold">No notifications match the current filters</p>
              <p className="text-sm">Try adjusting the filters or clearing the search.</p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {filteredNotifications.map((notification, index) => {
                const meta = notificationMeta[notification.type];
                const Icon = meta.icon;

                return (
                  <motion.button
                    type="button"
                    key={notification.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => (!notification.read ? handleMarkNotification(notification.id) : undefined)}
                    className={`w-full text-left rounded-2xl border border-border/70 bg-card/60 hover:bg-card transition-colors p-4 flex gap-4 ${
                      !notification.read ? "ring-1 ring-primary/20" : ""
                    }`}
                    disabled={markingNotificationId === notification.id}
                  >
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${meta.chip}`}>
                      <Icon className={`h-5 w-5 ${meta.accent}`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground truncate">{notification.title}</h3>
                            <Badge variant="outline" className={meta.chip}>
                              {meta.label}
                            </Badge>
                            {!notification.read && (
                              <Badge variant="default" className="bg-primary/10 text-primary">
                                New
                              </Badge>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground mt-2 break-words">{notification.message}</p>

                      {!notification.read && (
                        <p className="text-xs text-muted-foreground mt-3">
                          Click to mark as read
                        </p>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CoordinatorNotifications;
