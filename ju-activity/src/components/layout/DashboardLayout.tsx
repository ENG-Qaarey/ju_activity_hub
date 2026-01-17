import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useActivity } from "@/contexts/ActivityContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Activity,
  BarChart3,
  Bell,
  Calendar,
  CheckCheck,
  CheckSquare,
  ClipboardList,
  FilePlus,
  FileText,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  MessageCircle,
  Paperclip,
  Send,
  Settings,
  SmilePlus,
  SunMedium,
  Terminal,
  User,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface DashboardLayoutProps {
  children: ReactNode;
}

interface ChatMessage {
  id: string;
  sender: "admin" | "user";
  content: string;
  timestamp: string;
}

const mockResponses: Record<UserRole | "default", string[]> = {
  student: [
    "Hi admin! I'm checking the activity schedule, thanks for the update.",
    "Copy that. I'll make sure my classmates know as well.",
    "Appreciate the quick response!",
  ],
  coordinator: [
    "Thanks for looping me in, I'll adjust the logistics now.",
  ],
  admin: [
    "Got it. I'll monitor the dashboard for any changes.",
    "Thanks! I'll sync with the other admins shortly.",
    "Understood, keeping an eye on the reports.",
  ],
  default: [
    "Thanks for the message!",
    "Sounds good—I'll get on that.",
    "All right, noted.",
  ],
};

const emojiPalette = ["👋", "😊", "🔥", "✅", "🎉", "👍", "🤝", "💡"] as const;
const frostedControlClasses =
  "rounded-2xl border border-border/60 bg-muted/40 backdrop-blur-sm text-foreground hover:bg-muted";

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, users, logout } = useAuth();
  const { getUnreadNotificationsCount } = useActivity();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatSearch, setChatSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Record<string, ChatMessage[]>>({});
  const replyTimers = useRef<Record<string, number>>({});
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const isDarkMode = mounted && theme === "dark";
  const isChatDark = isDarkMode;
  const unreadNotifications = getUnreadNotificationsCount();
  const unreadDisplay = unreadNotifications > 99 ? "99+" : unreadNotifications.toString();
  const bellAnimationClass = unreadNotifications > 0 ? "bell-shake" : "";
  const isAdmin = user?.role === "admin";
  const formattedRole = user?.role ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}` : undefined;
  const portalLabel = "JU Activity Hub";
  const headerHandle = user?.department
    ? `${user.department.slice(0, 3).toUpperCase()}-${(user.name ?? "member").split(" ")[0]?.toLowerCase()}`
    : user?.name ?? "ENG-jamiila";
  const headerStatusLabel = "Online";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => setMounted(true), []);

  const getNavItems = (role: UserRole) => {
    const baseItems = [
      { icon: LayoutDashboard, label: "Dashboard", path: `/${role}/dashboard` },
    ];

    const roleItems: Record<UserRole, typeof baseItems> = {
      student: [
        ...baseItems,
        { icon: Calendar, label: "Activities", path: "/student/activities" },
        { icon: FileText, label: "My Applications", path: "/student/applications" },
        { icon: Bell, label: "Notifications", path: "/student/notifications" },
      ],
      coordinator: [
        ...baseItems,
        { icon: Calendar, label: "Create Activity", path: "/coordinator/create-activity" },
        { icon: ClipboardList, label: "Manage Activities", path: "/coordinator/activities" },
        { icon: FileText, label: "Applications", path: "/coordinator/applications" },
        { icon: Bell, label: "Notifications", path: "/coordinator/notifications" },
        { icon: CheckSquare, label: "Attendance", path: "/coordinator/attendance" },
      ],
      admin: [
        ...baseItems,
        { icon: FilePlus, label: "Create Activity", path: "/admin/create-activity" },
        { icon: Calendar, label: "Admin Activities", path: "/admin/activities" },
        { icon: Activity, label: "Monitor Activities", path: "/admin/monitor-activities" },
        { icon: Bell, label: "Notifications", path: "/admin/notifications" },
        { icon: Inbox, label: "Applications", path: "/admin/applications" },
        { icon: Users, label: "Directory", path: "/admin/users" },
        { icon: UserCog, label: "Manage Users", path: "/admin/manage-users" },
        { icon: BarChart3, label: "Advanced Reports", path: "/admin/reports-advanced" },
        { icon: Terminal, label: "Audit Logs", path: "/admin/logs" },
      ],
    };

    return roleItems[role] || baseItems;
  };

  const navItems = user ? getNavItems(user.role) : [];

  const chatDirectory = useMemo(() => {
    if (isAdmin) {
      const filtered = users?.filter((profile) => profile.id !== user?.id) ?? [];
      if (filtered.length > 0) {
        return filtered;
      }
      return [
        {
          id: "demo-student-1",
          name: "Celine Cruz",
          email: "celine.cruz@ju.edu",
          role: "student" as UserRole,
          department: "Engineering",
        },
        {
          id: "demo-coord-1",
          name: "Coach Ramos",
          email: "coach.ramos@ju.edu",
          role: "coordinator" as UserRole,
          department: "Sports Affairs",
        },
        {
          id: "demo-admin-2",
          name: "Dean Alvarez",
          email: "dalvarez@ju.edu",
          role: "admin" as UserRole,
          department: "Academic Council",
        },
      ];
    }

    // For coordinators/students, provide a default admin contact so the chat UI is usable.
    return [
      {
        id: "admin-support",
        name: "Admin Support",
        email: "support@ju.edu",
        role: "admin" as UserRole,
        department: "JU-AMS",
      },
    ];
  }, [isAdmin, users, user?.id]);

  const filteredDirectory = useMemo(() => {
    const query = chatSearch.trim().toLowerCase();
    if (!query) {
      return chatDirectory;
    }
    return chatDirectory.filter((profile) => {
      const nameMatch = profile.name?.toLowerCase().includes(query);
      const emailMatch = profile.email?.toLowerCase().includes(query);
      const roleMatch = profile.role?.toLowerCase().includes(query);
      return Boolean(nameMatch || emailMatch || roleMatch);
    });
  }, [chatDirectory, chatSearch]);

  const selectedUser = selectedUserId ? chatDirectory.find((profile) => profile.id === selectedUserId) : null;
  const selectedMessages = selectedUserId ? chatHistory[selectedUserId] ?? [] : [];

  const chatSummaries = useMemo(() => {
    const summaries: Record<string, { preview: string; timestamp: string; sender: ChatMessage["sender"] }> = {};
    chatDirectory.forEach((profile) => {
      const history = chatHistory[profile.id];
      if (history && history.length > 0) {
        const lastMessage = history[history.length - 1];
        summaries[profile.id] = {
          preview: lastMessage.content,
          timestamp: lastMessage.timestamp,
          sender: lastMessage.sender,
        };
      }
    });
    return summaries;
  }, [chatDirectory, chatHistory]);

  const activeChats = useMemo(() => {
    return chatDirectory
      .filter((profile) => Boolean(chatSummaries[profile.id]))
      .sort((a, b) => {
        const aTime = chatSummaries[a.id]?.timestamp || "";
        const bTime = chatSummaries[b.id]?.timestamp || "";
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
  }, [chatDirectory, chatSummaries]);

  const canSendMessage = Boolean(selectedUserId && draftMessage.trim());

  const formatDateLabel = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const formatTimeLabel = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const insertEmoji = (emoji: string) => {
    setDraftMessage((prev) => `${prev}${emoji}`);
  };

  function getRelativeTime(timestamp: string) {
    if (!timestamp) {
      return "";
    }
    const diff = Date.now() - new Date(timestamp).getTime();
    if (Number.isNaN(diff)) {
      return "";
    }
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    if (diff < minute) return "just now";
    if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
    if (diff < day) return `${Math.floor(diff / hour)}h ago`;
    return `${Math.floor(diff / day)}d ago`;
  }

  useEffect(() => {
    if (isChatOpen && !selectedUserId && chatDirectory.length > 0) {
      setSelectedUserId(chatDirectory[0].id);
    }
  }, [isChatOpen, chatDirectory, selectedUserId]);

  useEffect(() => {
    if (!isChatOpen) {
      setTypingUserId(null);
    }
  }, [isChatOpen]);

  useEffect(() => {
    return () => {
      Object.values(replyTimers.current).forEach((timerId) => window.clearTimeout(timerId));
    };
  }, []);

  const handleChatOpenChange = (open: boolean) => {
    setIsChatOpen(open);
    if (!open) {
      setTypingUserId(null);
    }
  };

  const toggleTheme = () => {
    setTheme(isDarkMode ? "light" : "dark");
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
  };

  const appendMessage = (targetUserId: string, message: ChatMessage) => {
    setChatHistory((prev) => ({
      ...prev,
      [targetUserId]: [...(prev[targetUserId] ?? []), message],
    }));
  };

  const queueMockReply = (targetUserId: string) => {
    const profile = chatDirectory.find((entry) => entry.id === targetUserId);
    if (!profile) {
      return;
    }
    if (replyTimers.current[targetUserId]) {
      window.clearTimeout(replyTimers.current[targetUserId]);
    }
    setTypingUserId(targetUserId);
    const responsePool = mockResponses[profile.role as UserRole] ?? mockResponses.default;
    const replyText = responsePool[Math.floor(Math.random() * responsePool.length)] || "Thanks for the update!";
    const delay = 1200 + Math.random() * 2000;
    replyTimers.current[targetUserId] = window.setTimeout(() => {
      appendMessage(targetUserId, {
        id: `${targetUserId}-reply-${Date.now()}`,
        sender: "user",
        content: replyText,
        timestamp: new Date().toISOString(),
      });
      setTypingUserId((current) => (current === targetUserId ? null : current));
      delete replyTimers.current[targetUserId];
    }, delay);
  };

  const handleSendMessage = () => {
    if (!selectedUserId || !draftMessage.trim()) {
      return;
    }

    appendMessage(selectedUserId, {
      id: `${selectedUserId}-${Date.now()}`,
      sender: "admin",
      content: draftMessage.trim(),
      timestamp: new Date().toISOString(),
    });
    setDraftMessage("");
    queueMockReply(selectedUserId);
  };

  const directoryPanel = (
    <div
      className={`flex h-full min-h-[320px] flex-col rounded-3xl border p-4 transition-all duration-300 ${
        isChatDark
          ? "border-slate-800 bg-slate-950/80 text-slate-100 shadow-[0_25px_60px_rgba(2,6,23,0.65)]"
          : "border-slate-200 bg-white/95 text-slate-900 shadow-[0_25px_45px_rgba(15,23,42,0.08)]"
      }`}
    >
      {activeChats.length > 0 && (
        <div className="mb-2">
          <div
            className={`flex items-center justify-between text-[11px] uppercase tracking-[0.2em] ${
              isChatDark ? "text-slate-500" : "text-muted-foreground"
            }`}
          >
            <span>Hot threads</span>
            <span className={isChatDark ? "text-slate-200" : "text-foreground"}>{activeChats.length}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {activeChats.slice(0, 4).map((profile) => (
              <Badge
                key={profile.id}
                variant={selectedUserId === profile.id ? "default" : "secondary"}
                className="cursor-pointer rounded-2xl"
                onClick={() => handleSelectUser(profile.id)}
              >
                {profile.name || "Unnamed"}
              </Badge>
            ))}
          </div>
        </div>
      )}
      <Input
        placeholder="Search by name, email, or role"
        value={chatSearch}
        onChange={(event) => setChatSearch(event.target.value)}
        className={`text-sm transition-colors ${
          isChatDark
            ? "border-slate-800 bg-slate-900/70 text-slate-100 placeholder:text-slate-500"
            : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-500"
        }`}
      />
      <ScrollArea className="mt-4 flex-1 min-h-0 pr-1">
        <div className="space-y-2 pb-2">
          {filteredDirectory.length === 0 ? (
            <p
              className={`py-6 text-center text-sm ${
                isChatDark ? "text-slate-500" : "text-muted-foreground"
              }`}
            >
              No matches found.
            </p>
          ) : (
            filteredDirectory.map((profile) => {
              const isActive = selectedUserId === profile.id;
              return (
                <button
                  key={profile.id}
                  onClick={() => handleSelectUser(profile.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition-all ${
                    isActive
                      ? isChatDark
                        ? "border-sky-500/70 bg-sky-500/15 shadow-lg"
                        : "border-primary bg-primary/5 shadow-sm"
                      : isChatDark
                        ? "border-slate-900 bg-slate-950/60 hover:border-slate-700"
                        : "border-transparent bg-slate-50 hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 shadow-inner">
                      <AvatarFallback
                        className={isChatDark ? "bg-slate-900 text-slate-200" : "bg-primary/10 text-primary"}
                      >
                        {profile.name?.charAt(0) ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${
                          isChatDark ? "text-slate-50" : "text-foreground"
                        }`}
                      >
                        {profile.name || "Unnamed User"}
                      </p>
                      <p
                        className={`text-xs truncate capitalize ${
                          isChatDark ? "text-slate-400" : "text-muted-foreground"
                        }`}
                      >
                        {profile.role}
                      </p>
                    </div>
                    <span
                      className={`text-xs ${isChatDark ? "text-slate-500" : "text-muted-foreground"}`}
                    >
                      {(chatHistory[profile.id]?.length || 0).toString()} msg
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const conversationPanel = (
    <div
      className={`flex h-full min-h-[320px] flex-col rounded-3xl border p-4 transition-all duration-300 ${
        isChatDark
          ? "border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100 shadow-[0_35px_70px_rgba(2,6,23,0.75)]"
          : "border-slate-200 bg-gradient-to-b from-white to-slate-50 text-slate-900 shadow-[0_35px_70px_rgba(15,23,42,0.12)]"
      }`}
    >
      {selectedUser ? (
        <>
          <div
            className={`mb-3 flex items-center gap-3 rounded-2xl px-4 py-3 ${
              isChatDark ? "bg-slate-800/80" : "bg-white"
            }`}
          >
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {selectedUser.name?.charAt(0) ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold truncate">{selectedUser.name}</p>
              <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
            </div>
            <Badge
              variant="secondary"
              className={`capitalize ${isChatDark ? "bg-slate-700 text-slate-100" : ""}`}
            >
              {selectedUser.role}
            </Badge>
          </div>
          <ScrollArea className="flex-1 min-h-0 pr-2">
            <div className="space-y-3 pb-2">
              {selectedMessages.length === 0
                ? null
                : selectedMessages.map((message, index) => {
                    const currentLabel = formatDateLabel(message.timestamp);
                    const previousLabel = index > 0 ? formatDateLabel(selectedMessages[index - 1].timestamp) : null;
                    const showDateChip = currentLabel !== previousLabel;
                    const isAdminMessage = message.sender === "admin";
                    const outgoingBubble = isChatDark
                      ? "rounded-br-md bg-gradient-to-r from-sky-500/90 via-sky-500 to-sky-400/90 text-white"
                      : "rounded-br-md bg-gradient-to-r from-sky-500 to-sky-600 text-white";
                    const incomingBubble = isChatDark
                      ? "rounded-bl-md border border-slate-800 bg-slate-900 text-slate-100"
                      : "rounded-bl-md border border-slate-100 bg-white text-slate-900";
                    const bubbleClass = `max-w-[78%] rounded-3xl px-4 py-2 text-sm shadow ${
                      isAdminMessage ? outgoingBubble : incomingBubble
                    }`;
                    const timestampClass = isAdminMessage
                      ? "justify-end text-white/80"
                      : isChatDark
                        ? "text-slate-400"
                        : "text-muted-foreground";
                    return (
                      <div key={message.id} className="space-y-2">
                        {showDateChip && (
                          <div className="text-center text-[10px] font-semibold uppercase tracking-[0.4em] text-muted-foreground/80">
                            {currentLabel}
                          </div>
                        )}
                        <div className={`flex ${isAdminMessage ? "justify-end" : "justify-start"}`}>
                          <div className={bubbleClass}>
                            <p className="whitespace-pre-line leading-relaxed">{message.content}</p>
                            <div className={`mt-1 flex items-center gap-1 text-[11px] ${timestampClass}`}>
                              <span>{formatTimeLabel(message.timestamp)}</span>
                              {isAdminMessage && <CheckCheck className="h-3 w-3" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              {typingUserId === selectedUser.id && (
                <div className="flex justify-start" aria-live="polite">
                  <div
                    className={`inline-flex items-center gap-1 rounded-2xl px-4 py-2 text-[11px] ${
                      isChatDark ? "bg-slate-800 text-slate-400" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-current/70 animate-bounce" />
                    <span className="h-2 w-2 rounded-full bg-current/60 animate-bounce [animation-delay:150ms]" />
                    <span className="h-2 w-2 rounded-full bg-current/50 animate-bounce [animation-delay:300ms]" />
                    <span>typing…</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div
            className={`mt-4 flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm ${
              isChatDark
                ? "border-slate-800 bg-slate-950/90 text-slate-100"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={isChatDark ? "text-slate-300 hover:text-white" : "text-muted-foreground hover:text-primary"}
                  >
                    <SmilePlus className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  side="top"
                  align="start"
                  className={`w-52 rounded-2xl border shadow-xl ${
                    isChatDark ? "border-slate-700 bg-slate-900" : "border-border bg-background"
                  }`}
                >
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">Mood boosters</p>
                  <div className="flex flex-wrap gap-2">
                    {emojiPalette.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className={`rounded-full border px-2 py-1 text-base transition ${
                          isChatDark
                            ? "border-slate-700 bg-slate-800 hover:border-sky-500"
                            : "border-border bg-muted/40 hover:border-primary"
                        }`}
                        aria-label={`Insert ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={isChatDark ? "text-slate-300 hover:text-white" : "text-muted-foreground hover:text-primary"}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <textarea
                value={draftMessage}
                onChange={(event) => setDraftMessage(event.target.value)}
                placeholder={`Message ${selectedUser.name}`}
                rows={1}
                className={`flex-1 resize-none bg-transparent text-sm focus:outline-none focus:ring-0 placeholder:text-slate-400 ${
                  isChatDark ? "text-slate-100" : "text-slate-800"
                }`}
                aria-label={`Message ${selectedUser.name}`}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!canSendMessage}
                size="icon"
                className={`ml-auto rounded-full border transition-all duration-200 ${
                  canSendMessage
                    ? isChatDark
                      ? "border-sky-500 bg-gradient-to-r from-sky-500 via-sky-500 to-sky-400 text-white hover:shadow-lg hover:shadow-sky-500/40"
                      : "border-primary bg-gradient-to-r from-sky-500 to-sky-600 text-white hover:shadow-lg hover:shadow-primary/40"
                    : isChatDark
                      ? "border-slate-700 bg-slate-800 text-slate-500"
                      : "border-slate-200 bg-slate-100 text-slate-400"
                }`}
              >
                <Send className={`h-4 w-4 ${canSendMessage ? "opacity-100" : "opacity-70"}`} />
              </Button>
          </div>
        </>
      ) : (
        <div
          className={`flex flex-1 flex-col items-center justify-center text-center ${
            isChatDark ? "text-slate-400" : "text-muted-foreground"
          }`}
        >
          <MessageCircle className="mb-3 h-10 w-10 opacity-40" />
          <p className="text-sm">Select a user from the directory to start chatting.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 bg-card border-r border-border flex-col fixed h-full">
        {/* Animated JU-AMS Header */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
          <div className="flex items-center justify-center">
            <motion.h1 
              className="text-3xl font-extrabold"
              initial={{ opacity: 0, y: -10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                textShadow: [
                  '0 0 0px rgba(59, 130, 246, 0.5)',
                  '0 0 10px rgba(59, 130, 246, 0.7)',
                  '0 0 0px rgba(59, 130, 246, 0.5)'
                ]
              }}
              transition={{ 
                duration: 0.8,
                textShadow: {
                  repeat: Infinity,
                  duration: 3,
                  ease: "easeInOut"
                }
              }}
            >
              <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-transparent">
                JU-AMS
              </span>
            </motion.h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {item.label === "Notifications" && unreadNotifications > 0 && (
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${
                      isActive ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"
                    }`}
                  >
                    {unreadDisplay}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
            <Avatar className="w-10 h-10">
              {user?.avatar ? <AvatarImage src={user.avatar} alt={user?.name ?? "User"} /> : null}
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
          <div className="px-4 lg:px-6 py-3 flex flex-wrap items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open navigation"
                className={`lg:hidden ${frostedControlClasses}`}
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="hidden min-w-0 flex-1 flex-col sm:flex">
                <span className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">{portalLabel}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground truncate">{headerHandle}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                    {headerStatusLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="ml-auto flex flex-wrap items-center justify-end gap-1 sm:gap-2">
              {/* Communications Shortcut */}
              {user?.role && (
                <Sheet open={isChatOpen} onOpenChange={handleChatOpenChange}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Open communications hub"
                      className={`relative ${frostedControlClasses}`}
                    >
                      <MessageCircle className="w-5 h-5" />
                      {isAdmin && (
                        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-card" />
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="right"
                    className="w-[95vw] sm:max-w-3xl lg:max-w-4xl h-screen max-h-screen flex flex-col gap-4 overflow-hidden p-0 sm:p-6"
                  >
                  <SheetHeader className="px-4 pt-4 sm:px-0">
                    <SheetTitle className="text-xl">Communications Hub</SheetTitle>
                    <SheetDescription>Keep every student, coordinator, and admin within reach.</SheetDescription>
                  </SheetHeader>
                  <div className="flex flex-1 flex-col gap-4 overflow-hidden px-4 pb-4 sm:px-0">
                    <div className="hidden flex-1 min-h-0 gap-4 md:grid md:grid-cols-[260px_minmax(0,1fr)]">
                      {directoryPanel}
                      {conversationPanel}
                    </div>
                    <div className="flex-1 min-h-0 md:hidden">
                      <Tabs defaultValue="chat" className="flex h-full flex-col">
                        <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-muted/40">
                          <TabsTrigger value="chat">Chat</TabsTrigger>
                          <TabsTrigger value="people">People</TabsTrigger>
                        </TabsList>
                        <TabsContent value="chat" className="mt-4 flex-1">
                          {conversationPanel}
                        </TabsContent>
                        <TabsContent value="people" className="mt-4 flex-1">
                          {directoryPanel}
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                  </SheetContent>
                </Sheet>
              )}

              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/${user?.role}/notifications`)}
                className={`relative ${frostedControlClasses} ${location.pathname.includes("/notifications") ? "text-primary" : ""}`}
                aria-label={
                  unreadNotifications > 0
                    ? `You have ${unreadDisplay} unread notifications`
                    : "Notifications"
                }
              >
                <Bell className={`w-5 h-5 ${bellAnimationClass}`} />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 rounded-full bg-destructive text-destructive-foreground px-1.5 py-0.5 text-[10px] font-bold">
                    {unreadDisplay}
                  </span>
                )}
              </Button>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className={`gap-2 pl-2 pr-3 ${frostedControlClasses}`}>
                    <Avatar className="w-8 h-8">
                      {user?.avatar ? <AvatarImage src={user.avatar} alt={user?.name ?? "User"} /> : null}
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {user?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline font-medium">{user?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate(`/${user?.role}/profile`)}>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/${user?.role}/change-password`)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Change Password
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={toggleTheme}>
                    {isDarkMode ? (
                      <SunMedium className="w-4 h-4 mr-2" />
                    ) : (
                      <Moon className="w-4 h-4 mr-2" />
                    )}
                    {isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="px-4 lg:px-6 pb-3 sm:hidden">
            <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/70 px-4 py-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">{portalLabel}</p>
                <p className="text-sm font-semibold text-foreground">{headerHandle}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                {headerStatusLabel}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-card z-50 lg:hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">{portalLabel}</p>
                  <p className="text-base font-semibold text-foreground">{headerHandle}</p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                    {headerStatusLabel}
                  </span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                      {item.label === "Notifications" && unreadNotifications > 0 && (
                        <span
                          className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${
                            isActive ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"
                          }`}
                        >
                          {unreadDisplay}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Logout */}
              <div className="p-4 border-t border-border">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Logout
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardLayout;
