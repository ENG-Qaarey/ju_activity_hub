import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { mockActivities } from "@/data/mockData";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

const CoordinatorActivities = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  // In a real app, we would fetch only this coordinator's activities
  const [activities, setActivities] = useState(
    mockActivities.filter((a) => a.coordinatorName === "Dr. Sarah Ahmed")
  );

  const handleDelete = (id: string) => {
    // In a real app, this would call an API
    setActivities(activities.filter((a) => a.id !== id));
    toast({
      title: "Activity Deleted",
      description: "The activity has been successfully removed.",
    });
  };

  const filteredActivities = activities.filter((activity) =>
    activity.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Manage Activities</h1>
            <p className="text-muted-foreground">
              Create and manage your activities
            </p>
          </div>
          <Button onClick={() => navigate("/coordinator/create-activity")}>
            <Plus className="w-4 h-4 mr-2" />
            Create Activity
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Activities List */}
        <div className="grid gap-4">
          {filteredActivities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              layout
            >
              <Card>
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{activity.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        activity.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                        activity.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {activity.status}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {activity.date} • {activity.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {activity.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {activity.enrolled}/{activity.capacity} Enrolled
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                     <Button variant="outline" size="sm" onClick={() => navigate(`/coordinator/activities/${activity.id}/edit`)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                     </Button>
                     
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(activity.id)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                     </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {filteredActivities.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No activities found matching your search.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CoordinatorActivities;
