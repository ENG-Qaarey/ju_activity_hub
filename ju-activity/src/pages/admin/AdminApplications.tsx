import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  CheckCircle,
  XCircle,
  Search,
  Filter,
  FileText,
  ShieldCheck,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { useActivity } from "@/contexts/ActivityContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AdminApplications = () => {
  const { applications, updateApplication } = useActivity();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);

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
    return applications.filter((app) => {
      const matchesSearch =
        app.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.activityTitle.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-muted-foreground">
            <ShieldCheck className="w-4 h-4" />
            Admin Oversight
          </div>
          <h1 className="text-2xl font-bold">Oversee Applications</h1>
          <p className="text-muted-foreground">
            Inspect every student application regardless of activity owner, override statuses, and keep records clean.
          </p>
        </div>

        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row gap-4">
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
              {(["all", "pending", "approved", "rejected"] as const).map((status) => (
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
          </CardContent>
        </Card>

        <div className="space-y-4">
          {filteredApplications.map((app) => (
            <motion.div key={app.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardContent className="p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 border border-border/60">
                      {app.student?.avatar ? (
                        <AvatarImage src={app.student.avatar} alt={app.studentName} />
                      ) : null}
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        {(app.studentName || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-1">Applicant</p>
                      <h3 className="font-semibold text-lg">{app.studentName}</h3>
                      <p className="text-sm text-muted-foreground">
                        Activity: <span className="font-medium text-foreground">{app.activityTitle}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Submitted: {app.appliedAt}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 lg:items-end">
                    <Badge
                      variant={
                        app.status === "approved"
                          ? "default"
                          : app.status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                      className="capitalize self-start lg:self-end"
                    >
                      {app.status}
                    </Badge>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => toast({ title: "Audit Trail", description: "Opening full audit log soon." })}
                      >
                        <Filter className="w-3.5 h-3.5" />
                        Audit
                      </Button>
                      {app.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleStatusChange(app.id, "approved")}
                            disabled={isUpdatingId === app.id}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {isUpdatingId === app.id ? "Saving..." : "Approve"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleStatusChange(app.id, "rejected")}
                            disabled={isUpdatingId === app.id}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            {isUpdatingId === app.id ? "Saving..." : "Reject"}
                          </Button>
                        </>
                      )}
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
              <p className="text-muted-foreground">Adjust filters or search criteria to broaden results.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminApplications;
