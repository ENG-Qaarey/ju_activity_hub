import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useActivity } from "@/contexts/ActivityContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Calendar,
  Search,
  MapPin,
  Users,
  Clock,
  Filter,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { LinesListSkeleton } from "@/components/ui/loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const StudentActivities = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activities, isLoading } = useActivity();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const formatDate = (value: string) => {
    if (!value) return value;
    return value.includes("T") ? value.slice(0, 10) : value;
  };

  const parseActivityDateTime = (dateValue: string, timeValue?: string) => {
    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) return null;

    let hours = 0;
    let minutes = 0;

    const timeText = (timeValue ?? "").trim();
    if (timeText) {
      const match = timeText.match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
      if (match) {
        hours = Number.parseInt(match[1], 10);
        minutes = Number.parseInt(match[2], 10);
        const meridiem = match[3]?.toLowerCase();
        if (meridiem) {
          if (hours === 12) hours = 0;
          if (meridiem === "pm") hours += 12;
        }
      }
    }

    return new Date(
      parsedDate.getFullYear(),
      parsedDate.getMonth(),
      parsedDate.getDate(),
      hours,
      minutes,
      0,
      0
    );
  };

  const filteredActivities = useMemo(() => {
    const nowTime = Date.now();
    const baseFiltered = activities.filter((activity) => {
      const matchesSearch = activity.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || activity.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    const withDateTime = baseFiltered.map((activity) => ({
      activity,
      dateTime: parseActivityDateTime(activity.date, activity.time),
    }));

    const upcoming = withDateTime
      .filter((item) => item.dateTime && item.dateTime.getTime() > nowTime)
      .sort((a, b) => a.dateTime!.getTime() - b.dateTime!.getTime())
      .map((item) => item.activity);

    const past = withDateTime
      .filter((item) => !item.dateTime || item.dateTime.getTime() <= nowTime)
      .sort((a, b) => {
        const aTime = a.dateTime?.getTime() ?? 0;
        const bTime = b.dateTime?.getTime() ?? 0;
        return bTime - aTime;
      })
      .map((item) => item.activity);

    return [...upcoming, ...past];
  }, [activities, categoryFilter, searchQuery]);

  const appliedActivityIds = useMemo(() => {
    const apps = (user ? (JSON.parse(localStorage.getItem("applications_cache") || "[]") as any[]) : []) as any[];
    return new Set(apps.filter((a) => a.studentId === user?.id).map((a) => a.activityId));
  }, [user]);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      workshop: "bg-primary/10 text-primary",
      seminar: "bg-secondary text-secondary-foreground",
      training: "bg-success/10 text-success",
      extracurricular: "bg-warning/10 text-warning",
    };
    return colors[category] || "bg-muted text-muted-foreground";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Available Activities</h1>
          <p className="text-muted-foreground">
            Browse and apply for activities that interest you
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="seminar">Seminar</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="extracurricular">Extracurricular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Activities Grid */}
        {isLoading && activities.length === 0 ? (
          <LinesListSkeleton count={5} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {(() => {
                  const alreadyApplied = appliedActivityIds.has(activity.id);
                  return (
                    <Card className="h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer group">
                      <CardContent className="p-5">
                        {/* Category Badge */}
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 capitalize ${getCategoryColor(
                            activity.category
                          )}`}
                        >
                          {activity.category}
                        </span>

                        {/* Title */}
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {activity.title}
                        </h3>

                        {/* Description */}
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          {activity.description}
                        </p>

                        {/* Meta Info */}
                        <div className="space-y-2 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span>{formatDate(activity.date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" />
                            <span>{activity.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span>{activity.location}</span>
                          </div>
                        </div>

                        {/* Capacity */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>
                              {activity.enrolled}/{activity.capacity} enrolled
                            </span>
                          </div>
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{
                                width: `${(activity.enrolled / activity.capacity) * 100}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Action Button */}
                        <Button
                          className="w-full"
                          onClick={() => navigate(`/student/activities/${activity.id}`)}
                          disabled={alreadyApplied || activity.enrolled >= activity.capacity}
                        >
                          {alreadyApplied
                            ? "Already Applied"
                            : activity.enrolled >= activity.capacity
                              ? "Fully Booked"
                              : "View Details"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })()}
              </motion.div>
            ))}
          </div>
        )}

        {filteredActivities.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg">No activities found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentActivities;
