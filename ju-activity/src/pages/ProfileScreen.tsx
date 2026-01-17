import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
  AlertTriangle,
  BadgeCheck,
  BellRing,
  CalendarClock,
  CheckCircle2,
  ListChecks,
  Lock,
  Mail,
  MapPin,
  Moon,
  Pencil,
  Settings,
  ShieldCheck,
  Sun,
  Upload,
  X,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const ProfileScreen = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    department: user?.department ?? "",
    studentId: user?.studentId ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    announcements: true,
    reminders: true,
    productNews: false,
  });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setAvatarPreview(user?.avatar ?? null);
  }, [user?.avatar]);

  const isDarkMode = mounted && theme === "dark";
  const memberSince = user?.joinedAt
    ? new Date(user.joinedAt).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Not recorded";
  const formattedRole = user?.role ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}` : "Not set";
  const isEmailVerified = Boolean((user as Partial<{ emailVerified: boolean }>)?.emailVerified);
  const completenessChecks = [
    Boolean(formData.department),
    user?.role === "student" ? Boolean(formData.studentId) : true,
    Boolean(avatarPreview),
    Boolean(formData.email),
  ];
  const completenessScore = Math.round((completenessChecks.filter(Boolean).length / completenessChecks.length) * 100);
  const missingFields = [
    !formData.department ? "Add a department" : null,
    user?.role === "student" && !formData.studentId ? "Add your student ID" : null,
    !avatarPreview ? "Upload a profile image" : null,
  ].filter(Boolean) as string[];

  const summaryCards = [
    {
      label: "Role",
      value: formattedRole,
      helper: isEmailVerified ? "Verified access" : "Verification pending",
      icon: ShieldCheck,
    },
    {
      label: "Account Status",
      value: user?.status ? `${user.status.charAt(0).toUpperCase()}${user.status.slice(1)}` : "Active",
      helper: user?.status === "inactive" ? "Reach out to support" : "In good standing",
      icon: BadgeCheck,
    },
    {
      label: "Member Since",
      value: memberSince,
      helper: "Keep your profile current",
      icon: CalendarClock,
    },
  ];

  const securityChecklist = [
    {
      label: "Email verification",
      description: isEmailVerified ? "Email confirmed" : "Verify your email to unlock alerts",
      complete: isEmailVerified,
    },
    {
      label: "Account status",
      description: user?.status === "inactive" ? "Account paused — contact support" : "Account is active",
      complete: user?.status !== "inactive",
    },
    {
      label: "Password rotation",
      description: "Update your password every 90 days for best security",
      complete: false,
    },
  ];

  const timelineEvents = [
    { title: "Profile viewed", detail: "You inspected your account today", time: "Moments ago" },
    { title: "Joined JU-AMS", detail: `Account created as ${formattedRole}`, time: memberSince },
  ];

  const handlePreferenceToggle = (key: keyof typeof preferences) => (checked: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: checked }));
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Select an image smaller than 5MB", variant: "destructive" });
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.onerror = () => {
      toast({ title: "Error reading file", description: "Failed to read the image", variant: "destructive" });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({ title: "Incomplete", description: "Name and email cannot be empty", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        name: formData.name,
        email: formData.email,
        department: formData.department,
        studentId: formData.studentId,
        avatar: avatarFile ?? undefined,
      });
      toast({ title: "Profile saved", description: "Your information is now up to date" });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Unable to update profile",
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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-primary-foreground/80">Account center</p>
              <h1 className="text-3xl font-bold">Profile</h1>
              <p className="text-primary-foreground/80">
                Keep your JU-AMS profile current so coordinators and admins can reach you.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Avatar className="h-16 w-16 border-2 border-primary-foreground/40">
                {avatarPreview ? <AvatarImage src={avatarPreview} alt={user?.name} /> : null}
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {user?.name?.charAt(0) ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold">{user?.name ?? "Unnamed user"}</p>
                <Badge className="text-xs uppercase text-muted-foreground">{user?.role ?? "Member"}</Badge>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3">
          {summaryCards.map((item) => (
            <Card key={item.label} className="border-dashed shadow-lg">
              <CardContent className="flex items-center gap-3 p-5">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="text-lg font-semibold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.helper}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Account Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="flex items-center gap-2 font-semibold text-foreground">
                      <Mail className="h-4 w-4 text-primary" />
                      {user?.email ?? "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="flex items-center gap-2 font-semibold text-foreground">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {user?.department ?? "Not assigned"}
                    </p>
                  </div>
                  {user?.studentId ? (
                    <div>
                      <p className="text-sm text-muted-foreground">Student ID</p>
                      <p className="font-semibold text-foreground">{user.studentId}</p>
                    </div>
                  ) : null}
                  <div>
                    <p className="text-sm text-muted-foreground">Joined</p>
                    <p className="font-semibold text-foreground">{memberSince}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={isEmailVerified ? "default" : "secondary"}>
                    {isEmailVerified ? "Email verified" : "Email verification pending"}
                  </Badge>
                  <Badge variant="outline">{formattedRole}</Badge>
                  <Badge
                    variant={user?.status === "inactive" ? "destructive" : "default"}
                    className={user?.status === "inactive" ? undefined : "bg-emerald-600 text-white hover:bg-emerald-600"}
                  >
                    {user?.status === "inactive" ? "Inactive" : "Active"}
                  </Badge>
                </div>
                <div className="border-t pt-2">
                  <Button variant="ghost" className="w-full justify-start" onClick={() => navigate(`/${user?.role}/change-password`)}>
                    <Lock className="mr-2 h-4 w-4" />
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="h-5 w-5 text-primary" />
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border bg-muted/50 p-4">
                  <div className="flex items-center gap-3">
                    {mounted && isDarkMode ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
                    <div>
                      <p className="font-medium">Dark Mode</p>
                      <p className="text-sm text-muted-foreground">
                        {mounted && isDarkMode ? "Dark theme enabled" : "Light theme enabled"}
                      </p>
                    </div>
                  </div>
                  {mounted ? (
                    <Switch checked={isDarkMode} onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} />
                  ) : null}
                </div>
                <Separator />
                <div className="space-y-3">
                  {[
                    {
                      label: "Announcements",
                      description: "Receive coordinator announcements",
                      key: "announcements" as const,
                    },
                    { label: "Reminders", description: "Deadlines and attendance alerts", key: "reminders" as const },
                    { label: "Product news", description: "JU-AMS improvements", key: "productNews" as const },
                  ].map((pref) => (
                    <div key={pref.key} className="flex items-center justify-between rounded-xl border p-4">
                      <div>
                        <p className="font-medium">{pref.label}</p>
                        <p className="text-sm text-muted-foreground">{pref.description}</p>
                      </div>
                      <Switch checked={preferences[pref.key]} onCheckedChange={handlePreferenceToggle(pref.key)} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Pencil className="h-5 w-5 text-primary" />
                  Edit Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 border-2 border-border">
                      {avatarPreview ? <AvatarImage src={avatarPreview} alt={user?.name} /> : null}
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                        {user?.name?.charAt(0) ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <input ref={fileInputRef} id="avatar-upload" type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                        <Button type="button" variant="outline" size="sm" className="flex items-center gap-2" onClick={() => fileInputRef.current?.click()}>
                          <Upload className="h-4 w-4" />
                          Upload Image
                        </Button>
                        {avatarPreview ? (
                          <Button type="button" variant="outline" size="sm" className="flex items-center gap-2 text-destructive hover:text-destructive" onClick={handleRemoveImage}>
                            <X className="h-4 w-4" />
                            Remove
                          </Button>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max size 5MB.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" name="department" value={formData.department} onChange={handleChange} />
                </div>
                {user?.role === "student" ? (
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input id="studentId" name="studentId" value={formData.studentId} onChange={handleChange} />
                  </div>
                ) : null}

                <Button className="w-full" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Profile"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BadgeCheck className="h-5 w-5 text-primary" />
                  Profile Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <p className="text-muted-foreground">Completion</p>
                    <p className="font-semibold">{completenessScore}%</p>
                  </div>
                  <Progress value={completenessScore} className="h-2" />
                </div>
                {missingFields.length ? (
                  <div className="rounded-xl border border-dashed p-4">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Missing items
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {missingFields.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    All set — your profile looks great.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Security Checklist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {securityChecklist.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-xl border p-4">
                    <div className={`rounded-full p-2 ${item.complete ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                      {item.complete ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ListChecks className="h-5 w-5 text-primary" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {timelineEvents.map((event) => (
                  <div key={event.title} className="border-l-2 border-dashed border-primary/40 pl-4">
                    <p className="text-sm text-muted-foreground">{event.time}</p>
                    <p className="font-semibold">{event.title}</p>
                    <p className="text-sm text-muted-foreground">{event.detail}</p>
                  </div>
                ))}
                <div className="flex items-center gap-2 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  <BellRing className="h-4 w-4 text-primary" />
                  Notifications will drop here as you engage with JU-AMS.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfileScreen;
