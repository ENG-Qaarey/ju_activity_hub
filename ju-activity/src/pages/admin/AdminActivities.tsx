import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "@/hooks/use-toast";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  Filter,
  Eye,
  ClipboardList,
  Edit,
  Trash2,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import type { Activity } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useActivity } from "@/contexts/ActivityContext";

const AdminActivities = () => {
  const { activities, deleteActivity, updateActivity, getApplicationsByActivity } = useActivity();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Activity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "" as Activity["category"] | "",
    date: "",
    time: "",
    location: "",
    capacity: "",
    status: "" as Activity["status"] | "",
  });

  const filteredActivities = activities
    .filter(
      (activity) =>
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.coordinatorName.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const openDetails = (activity: Activity) => {
    setSelectedActivity(activity);
    setDetailsOpen(true);
  };

  const closeDetails = (open: boolean) => {
    setDetailsOpen(open);
    if (!open) {
      setSelectedActivity(null);
    }
  };

  const convertTimeToInput = (time: string) => {
    const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return time;
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3].toUpperCase();
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, "0")}:${minutes}`;
  };

  const convertTimeToDisplay = (time: string) => {
    if (!time.includes(":")) return time;
    const [rawHours, minutes] = time.split(":");
    let hours = parseInt(rawHours, 10);
    if (Number.isNaN(hours)) return time;
    const period = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes ?? "00"} ${period}`;
  };

  const openEditDialog = (activity: Activity) => {
    setEditActivity(activity);
    setEditForm({
      title: activity.title,
      description: activity.description,
      category: activity.category,
      date: activity.date,
      time: convertTimeToInput(activity.time),
      location: activity.location,
      capacity: activity.capacity.toString(),
      status: activity.status,
    });
  };

  const handleEditInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editActivity) return;

    if (
      !editForm.title.trim() ||
      !editForm.description.trim() ||
      !editForm.category ||
      !editForm.date ||
      !editForm.time ||
      !editForm.location.trim() ||
      !editForm.capacity ||
      !editForm.status
    ) {
      toast({ title: "Missing information", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    const capacityValue = Number(editForm.capacity);
    if (Number.isNaN(capacityValue) || capacityValue < 1) {
      toast({ title: "Invalid capacity", description: "Capacity must be at least 1", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      await updateActivity(editActivity.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        category: editForm.category,
        date: editForm.date,
        time: convertTimeToDisplay(editForm.time),
        location: editForm.location.trim(),
        capacity: capacityValue,
        status: editForm.status,
      });
      toast({ title: "Activity updated", description: "Changes have been saved." });
      setEditActivity(null);
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Unable to update activity",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    setIsDeleting(true);
    try {
      await deleteActivity(pendingDelete.id);
      toast({ title: "Activity deleted", description: "The activity has been removed." });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Unable to delete activity",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setPendingDelete(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Monitor Activities</h1>
          <p className="text-muted-foreground">
            Oversee all scheduled events across the university
          </p>
        </div>

        {/* Filters */}
        <Card>
           <CardContent className="p-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or coordinator..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
               <Filter className="w-4 h-4 mr-2" />
               Filters
            </Button>
           </CardContent>
        </Card>

        {/* Activities List */}
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Date Box */}
                    <div className="hidden md:flex flex-col items-center justify-center w-28 h-28 bg-primary/5 rounded-2xl border border-primary/10 flex-shrink-0">
                      <span className="text-sm font-semibold text-primary uppercase">
                        {new Date(activity.date).toLocaleString('default', { month: 'short' })}
                      </span>
                      <span className="text-3xl font-bold text-foreground">
                        {new Date(activity.date).getDate()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="capitalize">{activity.category}</Badge>
                        <span className="text-xs text-muted-foreground">• Created by {activity.coordinatorName}</span>
                      </div>
                      
                      <h3 className="text-lg font-semibold mb-2">{activity.title}</h3>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {activity.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {activity.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {activity.enrolled}/{activity.capacity}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 mt-4 md:mt-0">
                      <Button variant="ghost" size="sm" onClick={() => openDetails(activity)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Details
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(activity)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setPendingDelete(activity)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <AlertDialog open={pendingDelete !== null} onOpenChange={() => setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete activity?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The activity and its schedule will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={detailsOpen} onOpenChange={closeDetails}>
        <DialogContent className="w-[90vw] max-w-2xl overflow-hidden rounded-3xl border border-muted/40 p-0 sm:max-h-[85vh]">
          {selectedActivity ? (
            <div className="flex max-h-[85vh] flex-col overflow-hidden">
              <div className="border-b border-muted/40 bg-card/70 p-5">
                <Badge className="capitalize">{selectedActivity.category}</Badge>
                <h3 className="mt-3 text-xl font-semibold text-foreground">{selectedActivity.title}</h3>
                <p className="text-sm text-muted-foreground">Coordinated by {selectedActivity.coordinatorName}</p>
                <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(selectedActivity.date).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {selectedActivity.time}
                  </div>
                </div>
              </div>

              <div className="space-y-4 overflow-y-auto px-5 pb-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-muted/40 p-4">
                    <p className="text-xs uppercase text-muted-foreground">Location</p>
                    <div className="mt-1 flex items-center gap-2 text-sm font-medium text-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      {selectedActivity.location}
                    </div>
                  </div>
                  <div className="rounded-xl border border-muted/40 p-4">
                    <p className="text-xs uppercase text-muted-foreground">Capacity</p>
                    <div className="mt-1 flex items-center justify-between text-sm font-medium text-foreground">
                      <span>
                        {selectedActivity.enrolled}/{selectedActivity.capacity} attendees
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
                      className="mt-3 h-2"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-muted/40 bg-muted/20 p-4">
                  <p className="text-xs uppercase text-muted-foreground">Overview</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground/90">
                    {selectedActivity.description || "No description provided."}
                  </p>
                </div>

                <div className="rounded-xl border border-muted/40 p-4">
                  <p className="text-xs uppercase text-muted-foreground">Quick facts</p>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      Lead: {selectedActivity.coordinatorName}
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      {selectedActivity.location}
                    </li>
                    <li className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      {selectedActivity.enrolled} participants confirmed
                    </li>
                  </ul>
                </div>
              </div>

              <DialogFooter className="border-t border-muted/40 p-4">
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => closeDetails(false)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 p-6">
              <p className="text-lg font-semibold">Activity details</p>
              <p className="text-sm text-muted-foreground">Select an activity to see more context.</p>
              <DialogFooter className="p-0">
                <Button variant="outline" onClick={() => closeDetails(false)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={editActivity !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditActivity(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit activity
            </DialogTitle>
            <DialogDescription>
              Update the activity information and save your changes.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleEditSubmit}>
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                name="title"
                value={editForm.title}
                onChange={handleEditInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                name="description"
                rows={4}
                value={editForm.description}
                onChange={handleEditInputChange}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={editForm.category}
                  onValueChange={(value) => setEditForm((prev) => ({ ...prev, category: value as Activity["category"] }))}
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
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) => setEditForm((prev) => ({ ...prev, status: value as Activity["status"] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date *</Label>
                <Input
                  id="edit-date"
                  name="date"
                  type="date"
                  value={editForm.date}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-time">Time *</Label>
                <Input
                  id="edit-time"
                  name="time"
                  type="time"
                  value={editForm.time}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location *</Label>
                <Input
                  id="edit-location"
                  name="location"
                  value={editForm.location}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-capacity">Capacity *</Label>
                <Input
                  id="edit-capacity"
                  name="capacity"
                  type="number"
                  min={1}
                  value={editForm.capacity}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditActivity(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminActivities;
