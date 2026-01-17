import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  CheckCircle,
  XCircle,
  Search,
  Filter,
  FileText,
  MoreHorizontal,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useActivity } from "@/contexts/ActivityContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const CoordinatorApplications = () => {
  const { user } = useAuth();
  const { applications, activities, updateApplication } = useActivity();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);

  const coordinatorActivityIds = useMemo(() => {
    if (!user) return new Set<string>();
    return new Set(activities.filter((a) => a.coordinatorId === user.id).map((a) => a.id));
  }, [activities, user]);

  const coordinatorApplications = useMemo(() => {
    // Coordinators should only see applications for activities they own.
    return applications.filter((app) => coordinatorActivityIds.has(app.activityId));
  }, [applications, coordinatorActivityIds]);

  const handleStatusChange = async (id: string, newStatus: "approved" | "rejected") => {
    setIsUpdatingId(id);
    try {
      await updateApplication(id, { status: newStatus });
      toast({
        title: `Application ${newStatus === "approved" ? "Approved" : "Rejected"}`,
        description: "Decision saved to the backend.",
        variant: newStatus === "approved" ? "default" : "destructive",
      });
    } catch (e: any) {
      toast({
        title: "Update Failed",
        description: e?.message || "Could not update application status",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingId(null);
    }
  };

  const filteredApplications = useMemo(() => {
    return coordinatorApplications.filter((app) => {
      const matchesSearch =
        app.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.activityTitle.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [coordinatorApplications, searchTerm, statusFilter]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Review Applications</h1>
          <p className="text-muted-foreground">
            Manage student registrations for your activities
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student or activity..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
             {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
               <Button
                 key={status}
                 variant={statusFilter === status ? "default" : "outline"}
                 onClick={() => setStatusFilter(status)}
                 className="capitalize"
               >
                 {status}
               </Button>
             ))}
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.map((app) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12 border border-border/60 flex-shrink-0">
                        {app.student?.avatar ? (
                          <AvatarImage src={app.student.avatar} alt={app.studentName} />
                        ) : null}
                        <AvatarFallback className="bg-muted text-muted-foreground">
                          {(app.studentName || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{app.studentName}</h3>
                        <p className="text-sm text-muted-foreground">Applying for: <span className="font-medium text-foreground">{app.activityTitle}</span></p>
                        <p className="text-xs text-muted-foreground mt-1">Applied on: {app.appliedAt}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge variant={
                        app.status === 'approved' ? 'default' :
                        app.status === 'rejected' ? 'destructive' : 'secondary'
                      } className="capitalize">
                        {app.status}
                      </Badge>

                      {app.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleStatusChange(app.id, 'approved')}
                            disabled={isUpdatingId === app.id}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {isUpdatingId === app.id ? "Saving..." : "Approve"}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleStatusChange(app.id, 'rejected')}
                            disabled={isUpdatingId === app.id}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            {isUpdatingId === app.id ? "Saving..." : "Reject"}
                          </Button>
                        </div>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Send Message</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {filteredApplications.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No applications found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CoordinatorApplications;
