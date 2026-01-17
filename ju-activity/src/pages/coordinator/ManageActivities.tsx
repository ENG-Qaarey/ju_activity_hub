import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useActivity } from "@/contexts/ActivityContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Calendar, MapPin, Edit, Trash2, Eye, Users, Save } from "lucide-react";
import { Activity } from "@/data/mockData";

const ManageActivities = () => {
  const { user } = useAuth();
  const { activities, deleteActivity, updateActivity, getApplicationsByActivity, getApprovedApplicationsByActivity } = useActivity();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewStudentsId, setViewStudentsId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Activity>>({});

  const canManageActivity = (activity: Activity) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return activity.coordinatorId === user.id;
  };

  const toDateOnly = (value: string) => {
    if (!value) return value;
    // Backend returns ISO strings; the UI prefers YYYY-MM-DD.
    return value.includes("T") ? value.split("T")[0] : value;
  };

  // If admin, show all activities; if coordinator, show all activities (including admin-created ones)
  const coordinatorActivities = activities;

  const filteredActivities = useMemo(() => {
    let filtered = coordinatorActivities;
    if (search) {
      filtered = filtered.filter(
        (activity) =>
          activity.title.toLowerCase().includes(search.toLowerCase()) ||
          activity.location.toLowerCase().includes(search.toLowerCase())
      );
    }
    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [search, coordinatorActivities]);

  const handleDelete = async (id: string) => {
    const activity = activities.find((a) => a.id === id);
    if (!activity) {
      toast({
        title: "Not Found",
        description: "Activity not found.",
        variant: "destructive",
      });
      setDeleteId(null);
      return;
    }

    if (!canManageActivity(activity)) {
      toast({
        title: "Forbidden",
        description: "You can only delete activities you created.",
        variant: "destructive",
      });
      setDeleteId(null);
      return;
    }

    const applications = getApplicationsByActivity(id);

    const pendingApplications = applications.filter((app) => app.status === "pending");
    if (pendingApplications.length > 0) {
      toast({
        title: "Cannot Delete",
        description: "This activity has pending applications. Please handle them first.",
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteActivity(id);
      toast({
        title: "Activity Deleted",
        description: "The activity has been removed successfully.",
      });
    } catch (e: any) {
      toast({
        title: "Delete Failed",
        description: e?.message || "Failed to delete activity",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const statusMap: Record<string, string> = {
    upcoming: "text-primary bg-primary/10",
    ongoing: "text-success bg-success/10",
    completed: "text-muted-foreground/80 bg-muted/30",
  };

  const handleEditClick = (activity: Activity) => {
    if (!canManageActivity(activity)) {
      toast({
        title: "Forbidden",
        description: "You can only edit activities you created.",
        variant: "destructive",
      });
      return;
    }

    setEditId(activity.id);
    // Convert time from "10:00 AM" format to "10:00" for input
    const timeMatch = activity.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    let timeValue = activity.time;
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2];
      const ampm = timeMatch[3].toUpperCase();
      if (ampm === "PM" && hours !== 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;
      timeValue = `${hours.toString().padStart(2, "0")}:${minutes}`;
    }
    setEditFormData({
      title: activity.title,
      description: activity.description,
      category: activity.category,
      date: toDateOnly(activity.date),
      time: timeValue,
      location: activity.location,
      capacity: activity.capacity,
      status: activity.status,
    });
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;

    if (
      !editFormData.title ||
      !editFormData.description ||
      !editFormData.category ||
      !editFormData.date ||
      !editFormData.time ||
      !editFormData.location ||
      !editFormData.capacity
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (editFormData.capacity && editFormData.capacity < 1) {
      toast({
        title: "Error",
        description: "Capacity must be at least 1",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const capacityNumber = Number(editFormData.capacity);
      if (!Number.isFinite(capacityNumber) || capacityNumber < 1) {
        toast({
          title: "Error",
          description: "Capacity must be at least 1",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      await updateActivity(editId, {
        title: editFormData.title.trim(),
        description: editFormData.description.trim(),
        category: editFormData.category as "workshop" | "seminar" | "training" | "extracurricular",
        date: editFormData.date,
        time: editFormData.time,
        location: editFormData.location.trim(),
        capacity: capacityNumber,
        status: editFormData.status,
      });

      toast({
        title: "Activity Updated!",
        description: "The activity has been updated successfully.",
      });

      setEditId(null);
      setEditFormData({});
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update activity",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

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
              <h1 className="text-2xl font-bold">Manage Activities</h1>
              <p className="text-primary-foreground/70 max-w-xl">
                {user?.role === "admin" 
                  ? "Manage all system activities, edit details, and monitor participation across the university."
                  : "Organize the events you oversee, edit details, and monitor participation all from one place."}
              </p>
            </div>
            <div className="space-y-2 w-full md:w-auto">
              <Input
                placeholder="Search by title or location"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white/80"
              />
            </div>
          </div>
        </motion.div>

        <div className="space-y-4">
          {filteredActivities.length === 0 ? (
            <Card className="rounded-2xl shadow-xl">
              <CardContent className="p-12 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No activities found</h3>
                <p className="text-muted-foreground">
                  {search ? "Try adjusting your search" : "Create your first activity to get started"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredActivities.map((activity) => (
              <Card key={activity.id} className="rounded-2xl shadow-xl">
                <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{activity.title}</h3>
                      <Badge className={statusMap[activity.status]}>{activity.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {toDateOnly(activity.date)} • {activity.time}
                      </span>
                      <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {activity.location}
                      </span>
                      <span>
                        Capacity {activity.enrolled}/{activity.capacity} enrolled
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewStudentsId(activity.id)}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      View Students ({getApprovedApplicationsByActivity(activity.id).length})
                    </Button>
                    {canManageActivity(activity) && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditClick(activity)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive border-destructive"
                          onClick={() => setDeleteId(activity.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the activity
                {deleteId && getApplicationsByActivity(deleteId).length > 0 && " and all associated applications"}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && handleDelete(deleteId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={viewStudentsId !== null} onOpenChange={() => setViewStudentsId(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Registered Students
              </DialogTitle>
              <DialogDescription>
                {viewStudentsId && activities.find((a) => a.id === viewStudentsId)?.title}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto space-y-3">
              {viewStudentsId ? (
                getApprovedApplicationsByActivity(viewStudentsId).length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No registered students yet</p>
                  </div>
                ) : (
                  getApprovedApplicationsByActivity(viewStudentsId).map((application) => (
                    <Card key={application.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{application.studentName}</p>
                            <p className="text-sm text-muted-foreground">
                              Applied: {application.appliedAt}
                            </p>
                          </div>
                          <Badge className="bg-success/10 text-success">Approved</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )
              ) : null}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={editId !== null} onOpenChange={() => {
          setEditId(null);
          setEditFormData({});
        }}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Edit Activity
              </DialogTitle>
              <DialogDescription>
                Update the activity details below
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Activity Title *</Label>
                <Input
                  id="edit-title"
                  name="title"
                  placeholder="Enter activity title"
                  value={editFormData.title || ""}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description *</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  placeholder="Describe the activity in detail..."
                  value={editFormData.description || ""}
                  onChange={handleEditChange}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={editFormData.category || ""}
                  onValueChange={(value) => setEditFormData({ ...editFormData, category: value as Activity["category"] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="seminar">Seminar</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="extracurricular">Extracurricular</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Date *</Label>
                  <Input
                    id="edit-date"
                    name="date"
                    type="date"
                    value={editFormData.date || ""}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-time">Time *</Label>
                  <Input
                    id="edit-time"
                    name="time"
                    type="time"
                    value={editFormData.time || ""}
                    onChange={handleEditChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-location">Location *</Label>
                <Input
                  id="edit-location"
                  name="location"
                  placeholder="Enter location"
                  value={editFormData.location || ""}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-capacity">Maximum Capacity *</Label>
                  <Input
                    id="edit-capacity"
                    name="capacity"
                    type="number"
                    min="1"
                    placeholder="Enter maximum number of participants"
                    value={editFormData.capacity || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, capacity: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status *</Label>
                  <Select
                    value={editFormData.status || "upcoming"}
                    onValueChange={(value) => setEditFormData({ ...editFormData, status: value as Activity["status"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setEditId(null);
                    setEditFormData({});
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ManageActivities;
