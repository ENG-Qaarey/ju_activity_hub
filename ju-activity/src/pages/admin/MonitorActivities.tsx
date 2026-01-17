import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useActivity } from "@/contexts/ActivityContext";
import { Calendar, Clock, Eye, MapPin, Users } from "lucide-react";

const MonitorActivities = () => {
  const { activities } = useActivity();
  const [selectedActivity, setSelectedActivity] = useState<typeof activities[number] | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const statusBadge: Record<string, string> = {
    upcoming: "text-primary bg-primary/10",
    ongoing: "text-success bg-success/10",
    completed: "text-muted-foreground/70 bg-muted/30",
  };

  const calendarData = useMemo(() => {
    const grouped = activities.reduce<Record<string, typeof activities>>((acc, activity) => {
      const key = new Date(activity.date).toLocaleDateString(undefined, { month: "long", year: "numeric" });
      if (!acc[key]) acc[key] = [];
      acc[key].push(activity);
      return acc;
    }, {});

    Object.values(grouped).forEach((list) =>
      list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    );

    return Object.entries(grouped).sort((a, b) => {
      const first = new Date(a[1][0].date).getTime();
      const second = new Date(b[1][0].date).getTime();
      return first - second;
    });
  }, [activities]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const closeDetails = () => setSelectedActivity(null);

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
              <h1 className="text-2xl font-bold">Monitor Activities</h1>
              <p className="text-primary-foreground/75">
                Keep oversight on every event across JU, track coordinators, and see activity statuses instantly.
              </p>
            </div>
            <Button variant="ghost" className="bg-white/10" onClick={() => setCalendarOpen(true)}>
              <Eye className="w-5 h-5 mr-2" />
              View calendar
            </Button>
          </div>
        </motion.div>

        <Card className="rounded-3xl border border-muted/40 shadow-xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg font-semibold">All Activities</CardTitle>
            <p className="text-sm text-muted-foreground">Upcoming and ongoing sessions across faculties</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg">No activities found</h3>
                <p className="text-muted-foreground">Activities will appear here once created</p>
              </div>
            ) : (
              activities
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((activity) => (
              <div
                key={activity.id}
                className="grid grid-cols-1 gap-4 rounded-2xl border border-muted/40 bg-card/70 p-4 transition hover:border-primary/40 hover:shadow-md md:grid-cols-[1.5fr_1fr_1fr_auto] md:items-center"
              >
                <div>
                  <p className="text-sm text-muted-foreground">Title</p>
                  <p className="text-lg font-semibold text-foreground">{activity.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Coordinator</p>
                  <p className="text-sm text-foreground">{activity.coordinatorName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="text-sm text-foreground">{activity.date} • {activity.time}</p>
                </div>
                <div className="flex flex-col gap-2 text-right sm:flex-row sm:items-center sm:justify-end">
                  <Badge className={`${statusBadge[activity.status]} capitalize`}>{activity.status}</Badge>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-primary/10 text-primary hover:bg-primary/20"
                    onClick={() => setSelectedActivity(activity)}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Details
                  </Button>
                </div>
              </div>
                ))
            )}
          </CardContent>
        </Card>

        <Sheet open={calendarOpen} onOpenChange={setCalendarOpen}>
          <SheetContent side="right" className="w-full border-l border-primary/20 sm:max-w-xl">
            <SheetHeader className="space-y-2">
              <SheetTitle className="text-xl font-semibold">Activity calendar</SheetTitle>
              <SheetDescription>Track upcoming sessions grouped by month.</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-6 overflow-y-auto">
              {calendarData.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activities scheduled yet.</p>
              ) : (
                calendarData.map(([month, items]) => (
                  <div key={month} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{month}</p>
                      <span className="text-xs text-muted-foreground">{items.length} events</span>
                    </div>
                    <div className="space-y-2">
                      {items.map((activity) => (
                        <div
                          key={activity.id}
                          className="rounded-2xl border border-muted/40 bg-card/70 p-3 text-sm shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground">{activity.title}</span>
                            <Badge className={statusBadge[activity.status]}>{activity.status}</Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(activity.date).toLocaleDateString(undefined, {
                                weekday: "short",
                                day: "numeric",
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {activity.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {activity.location}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </SheetContent>
        </Sheet>

        <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && closeDetails()}>
          <DialogContent className="w-[90vw] max-w-2xl overflow-hidden rounded-3xl border border-muted/40 p-0 sm:max-h-[85vh]">
            {selectedActivity && (
              <div className="flex max-h-[85vh] flex-col overflow-hidden">
                <DialogHeader className="border-b border-muted/40 p-5">
                  <DialogTitle className="flex flex-col gap-3 text-xl font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <Badge className={statusBadge[selectedActivity.status]}>{selectedActivity.status}</Badge>
                      <span className="text-sm text-muted-foreground">{selectedActivity.category}</span>
                    </div>
                    <span>{selectedActivity.title}</span>
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Coordinated by {selectedActivity.coordinatorName}
                  </DialogDescription>
                  <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(selectedActivity.date)}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {selectedActivity.time}
                    </span>
                  </div>
                </DialogHeader>

                <div className="space-y-4 overflow-y-auto px-5 pb-5">
                  <div className="rounded-xl border border-muted/40 bg-muted/20 p-4 text-sm text-muted-foreground">
                    {selectedActivity.description || "No description provided."}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Card className="border border-muted/40 bg-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase text-muted-foreground">Location</CardTitle>
                      </CardHeader>
                      <CardContent className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <MapPin className="h-4 w-4 text-primary" />
                        {selectedActivity.location}
                      </CardContent>
                    </Card>
                    <Card className="border border-muted/40 bg-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase text-muted-foreground">Capacity</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm text-foreground">
                        <div className="flex items-center justify-between font-medium">
                          <span>
                            {selectedActivity.enrolled}/{selectedActivity.capacity}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {Math.max(selectedActivity.capacity - selectedActivity.enrolled, 0)} seats left
                          </span>
                        </div>
                        <Progress
                          value={Math.min(
                            100,
                            Math.round((selectedActivity.enrolled / selectedActivity.capacity) * 100),
                          )}
                          className="h-2"
                        />
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Card className="border border-muted/40 bg-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase text-muted-foreground">Coordinator</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-foreground">
                        {selectedActivity.coordinatorName}
                      </CardContent>
                    </Card>
                    <Card className="border border-muted/40 bg-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase text-muted-foreground">Status</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm capitalize text-foreground">
                        {selectedActivity.status}
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <DialogFooter className="border-t border-muted/40 p-4">
                  <Button variant="outline" className="w-full sm:w-auto" onClick={closeDetails}>
                    Close
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default MonitorActivities;
