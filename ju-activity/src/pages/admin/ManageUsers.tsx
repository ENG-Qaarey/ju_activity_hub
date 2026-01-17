import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usersApi } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, XCircle, User, UserPlus, Trash2 } from "lucide-react";
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

const ManageUsers = () => {
  const { user, users, refreshUsers, toggleUserStatus, createCoordinator, deleteUser } = useAuth();
  const [accounts, setAccounts] = useState(users);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersLoadError, setUsersLoadError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdatingUserId, setIsUpdatingUserId] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    department: "",
  });

  const loadUsers = useCallback(async () => {
    if (user?.role !== "admin") return;

    setIsLoadingUsers(true);
    setUsersLoadError(null);
    try {
      const allUsers = await usersApi.getAll();
      setAccounts(allUsers);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load users";
      setUsersLoadError(message);
      setAccounts([]);
      toast({
        title: "Unable to load users",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingUsers(false);
    }
  }, [user?.role]);

  useEffect(() => {
    if (user?.role === "admin") {
      // Keep legacy context in sync (used elsewhere), but render from backend fetch here.
      refreshUsers();
      loadUsers();
    }
  }, [user?.role, refreshUsers, loadUsers]);

  useEffect(() => {
    // If other parts of the app refresh the AuthContext user list, keep local list reasonably in sync.
    if (!isLoadingUsers && users.length > 0 && accounts.length === 0) {
      setAccounts(users);
    }
  }, [users, accounts.length, isLoadingUsers]);

  const statusStyles: Record<string, string> = {
    active: "bg-success/10 text-success",
    inactive: "bg-muted/30 text-muted-foreground",
  };

  const handleStatusChange = async (userId: string, currentStatus?: string) => {
    const isSelf = user?.id === userId;
    const isAdminSelfActive = isSelf && user?.role === 'admin' && (currentStatus ?? 'active') === 'active';
    if (isAdminSelfActive) {
      toast({
        title: "Not Allowed",
        description: "Admin cannot deactivate their own account.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingUserId(userId);
    try {
      await toggleUserStatus(userId);
      await loadUsers();
      toast({
        title: currentStatus === "active" ? "User Deactivated" : "User Activated",
        description:
          currentStatus === "active"
            ? "The profile is suspended until reactivation."
            : "The user can now access JU-AMS again.",
      });
    } catch (e: any) {
      toast({
        title: "Update Failed",
        description: e?.message || "Failed to update user status",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingUserId(null);
    }
  };

  const handleCreateCoordinator = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      await createCoordinator({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        department: formData.department || undefined,
      });

      await loadUsers();

      toast({
        title: "Coordinator Created!",
        description: "The new coordinator account has been created successfully.",
      });

      setFormData({ fullName: "", email: "", password: "", department: "" });
      setShowCreateDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create coordinator",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;

    try {
      const userToDelete = accounts.find((u) => u.id === deleteUserId);
      setIsUpdatingUserId(deleteUserId);
      await deleteUser(deleteUserId);
      await loadUsers();
      
      toast({
        title: "User Deleted",
        description: `${userToDelete?.name || "User"} has been permanently deleted.`,
      });
      
      setDeleteUserId(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingUserId(null);
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
              <h1 className="text-2xl font-bold">Manage Users</h1>
              <p className="text-primary-foreground/75">
                View account details, adjust statuses, and keep the campus directory in sync with JU policies.
              </p>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="bg-white/10">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Create Coordinator
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Coordinator</DialogTitle>
                  <DialogDescription>
                    Add a new activity coordinator to manage university activities.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateCoordinator}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        placeholder="Enter coordinator name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="coordinator@jazeeraUniversity.edu.so"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department (Optional)</Label>
                      <Input
                        id="department"
                        placeholder="e.g., Computer Science"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? "Creating..." : "Create Coordinator"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        <div className="space-y-4">
          {usersLoadError && (
            <Card className="rounded-2xl border-destructive/40">
              <CardContent className="py-6">
                <p className="font-semibold">Failed to load users from backend</p>
                <p className="text-sm text-muted-foreground mt-1">{usersLoadError}</p>
                <div className="mt-4">
                  <Button variant="outline" onClick={loadUsers} disabled={isLoadingUsers}>
                    {isLoadingUsers ? "Refreshing..." : "Retry"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {isLoadingUsers && accounts.length === 0 && (
            <Card className="rounded-2xl">
              <CardContent className="py-10 text-center text-muted-foreground">
                Loading users...
              </CardContent>
            </Card>
          )}

          {!isLoadingUsers && !usersLoadError && accounts.length === 0 && (
            <Card className="rounded-2xl">
              <CardContent className="py-10 text-center text-muted-foreground">
                No users found.
              </CardContent>
            </Card>
          )}

          {accounts.map((account) => (
            <Card key={account.id} className="rounded-2xl shadow-xl">
              <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-semibold">{account.name}</p>
                    <Badge className="uppercase text-[10px]" variant="secondary">
                      {account.role}
                    </Badge>
                    {account.id === user?.id && (
                      <Badge className="bg-primary/10 text-primary text-[10px]">
                        You
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{account.email}</p>
                  <div className="text-xs text-muted-foreground">
                    {(account.department || "No department")} • Joined {account.joinedAt || "Unknown"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={statusStyles[account.status ?? "active"]}>
                    {account.status ?? "active"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleStatusChange(account.id, account.status)}
                    disabled={
                      isUpdatingUserId === account.id ||
                      (account.id === user?.id && account.role === 'admin' && (account.status ?? 'active') === 'active')
                    }
                  >
                    <CheckCircle className="w-4 h-4 text-success" />
                    {isUpdatingUserId === account.id
                      ? "Saving..."
                      : account.status === "active"
                      ? "Deactivate"
                      : "Activate"}
                  </Button>
                  {account.role === "coordinator" && account.id !== user?.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => setDeleteUserId(account.id)}
                      disabled={isUpdatingUserId === account.id}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <AlertDialog open={deleteUserId !== null} onOpenChange={() => setDeleteUserId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Coordinator?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the coordinator account
                {deleteUserId && (
                  <>
                    {" "}
                    for <strong>{accounts.find((u) => u.id === deleteUserId)?.name}</strong>.
                  </>
                )}
                <br />
                <br />
                All activities created by this coordinator will remain, but they will no longer be able to access the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Coordinator
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default ManageUsers;
