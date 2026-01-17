export interface Activity {
  id: string;
  title: string;
  description: string;
  category: "workshop" | "seminar" | "training" | "extracurricular";
  date: string;
  time: string;
  location: string;
  capacity: number;
  enrolled: number;
  coordinatorId: string;
  coordinatorName: string;
  status: "upcoming" | "ongoing" | "completed";
}

export interface Application {
  id: string;
  studentId: string;
  studentName: string;
  activityId: string;
  activityTitle: string;
  appliedAt: string;
  status: "pending" | "approved" | "rejected";
  notes?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "approval" | "rejection" | "announcement" | "reminder";
  read: boolean;
  createdAt: string;
  recipientId?: string;
}

export interface RoleDefinition {
  id: string;
  title: string;
  description: string;
  permissions: string[];
}

export interface ReportDefinition {
  id: string;
  title: string;
  description: string;
  type: "pdf" | "excel";
}

export interface SystemLog {
  id: string;
  action: string;
  actor: string;
  level: "info" | "warning" | "critical";
  timestamp: string;
}

// Mock data for activities
export const mockActivities: Activity[] = [
  {
    id: "1",
    title: "Web Development Workshop",
    description: "Learn modern web development with React and TypeScript. This hands-on workshop covers component-based architecture, state management, and best practices.",
    category: "workshop",
    date: "2024-02-15",
    time: "10:00 AM",
    location: "Computer Lab A",
    capacity: 30,
    enrolled: 18,
    coordinatorId: "2",
    coordinatorName: "Dr. Sarah Ahmed",
    status: "upcoming",
  },
  {
    id: "2",
    title: "Career Development Seminar",
    description: "Prepare for your future career with industry insights, resume building tips, and interview preparation strategies.",
    category: "seminar",
    date: "2024-02-18",
    time: "2:00 PM",
    location: "Main Auditorium",
    capacity: 100,
    enrolled: 75,
    coordinatorId: "2",
    coordinatorName: "Dr. Sarah Ahmed",
    status: "upcoming",
  },
  {
    id: "3",
    title: "Leadership Training Program",
    description: "Develop essential leadership skills including communication, team management, and decision-making through interactive sessions.",
    category: "training",
    date: "2024-02-20",
    time: "9:00 AM",
    location: "Conference Room B",
    capacity: 25,
    enrolled: 20,
    coordinatorId: "2",
    coordinatorName: "Prof. Mohammed Ali",
    status: "upcoming",
  },
  {
    id: "4",
    title: "Photography Club Meeting",
    description: "Monthly meeting of the photography club. Learn new techniques, share your work, and participate in photo walks.",
    category: "extracurricular",
    date: "2024-02-22",
    time: "4:00 PM",
    location: "Art Studio",
    capacity: 15,
    enrolled: 12,
    coordinatorId: "2",
    coordinatorName: "Ms. Fatima Khan",
    status: "upcoming",
  },
  {
    id: "5",
    title: "AI & Machine Learning Workshop",
    description: "Introduction to artificial intelligence and machine learning concepts with practical Python exercises.",
    category: "workshop",
    date: "2024-02-25",
    time: "11:00 AM",
    location: "Computer Lab B",
    capacity: 25,
    enrolled: 25,
    coordinatorId: "2",
    coordinatorName: "Dr. Sarah Ahmed",
    status: "upcoming",
  },
  {
    id: "6",
    title: "Public Speaking Workshop",
    description: "Master the art of public speaking. Learn techniques to overcome stage fright and deliver impactful presentations.",
    category: "training",
    date: "2024-02-28",
    time: "3:00 PM",
    location: "Seminar Hall",
    capacity: 40,
    enrolled: 28,
    coordinatorId: "2",
    coordinatorName: "Prof. Ahmed Hassan",
    status: "upcoming",
  },
];

export const mockApplications: Application[] = [
  {
    id: "1",
    studentId: "1",
    studentName: "Ahmed Hassan",
    activityId: "1",
    activityTitle: "Web Development Workshop",
    appliedAt: "2024-02-10",
    status: "approved",
  },
  {
    id: "2",
    studentId: "1",
    studentName: "Ahmed Hassan",
    activityId: "2",
    activityTitle: "Career Development Seminar",
    appliedAt: "2024-02-11",
    status: "pending",
  },
  {
    id: "3",
    studentId: "1",
    studentName: "Ahmed Hassan",
    activityId: "3",
    activityTitle: "Leadership Training Program",
    appliedAt: "2024-02-12",
    status: "rejected",
    notes: "Session is full. Please apply for the next batch.",
  },
];

export const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "Application Approved",
    message: "Your application for Web Development Workshop has been approved!",
    type: "approval",
    read: false,
    createdAt: "2024-02-12",
    recipientId: "student-1",
  },
  {
    id: "2",
    title: "New Activity Available",
    message: "A new AI & Machine Learning Workshop has been added. Apply now!",
    type: "announcement",
    read: false,
    createdAt: "2024-02-11",
    recipientId: "student-1",
  },
  {
    id: "3",
    title: "Reminder",
    message: "Web Development Workshop starts tomorrow at 10:00 AM",
    type: "reminder",
    read: true,
    createdAt: "2024-02-14",
    recipientId: "student-1",
  },
];

export const mockRoles: RoleDefinition[] = [
  {
    id: "role-student",
    title: "Student",
    description: "Access JU activities, apply, and track participation status.",
    permissions: [
      "Register, login, and update profile",
      "Browse and filter all published activities",
      "Submit applications with supporting details",
      "Track approvals, rejections, and notifications",
    ],
  },
  {
    id: "role-coordinator",
    title: "Activity Coordinator",
    description: "Plan, publish, and execute department-level activities.",
    permissions: [
      "Create, update, and cancel activities",
      "Review student applications and manage statuses",
      "Trigger notifications to applicants",
      "Mark attendance and export participation lists",
    ],
  },
  {
    id: "role-admin",
    title: "Administrator",
    description: "Oversee JU-AMS, manage users, and ensure compliance.",
    permissions: [
      "Manage users and assign roles",
      "Create platform-wide activities and override schedules",
      "Inspect applications, logs, and audit trails",
      "Generate reports and export full datasets",
    ],
  },
];

export const mockReports: ReportDefinition[] = [
  {
    id: "rep-1",
    title: "Quarterly Activity Participation",
    description: "Engagement snapshot for leadership dashboards",
    type: "pdf",
  },
  {
    id: "rep-2",
    title: "Coordinator Performance",
    description: "Approval ratios and throughput by coordinator",
    type: "excel",
  },
  {
    id: "rep-3",
    title: "System Usage Trends",
    description: "Activity, application, and attendance volume trends",
    type: "pdf",
  },
  {
    id: "rep-4",
    title: "Students Participation",
    description: "Active students, participation rate, and segments",
    type: "excel",
  },
  {
    id: "rep-5",
    title: "Attendance Summary",
    description: "Present vs. absent breakdown across sessions",
    type: "excel",
  },
  {
    id: "rep-6",
    title: "Applications Summary",
    description: "Approval pipeline and current backlog",
    type: "pdf",
  },
];

export const mockLogs: SystemLog[] = [
  {
    id: "log-001",
    action: "Admin login",
    actor: "jamiila@gmail.com",
    level: "info",
    timestamp: "2024-03-10 08:12:30",
  },
  {
    id: "log-002",
    action: "Coordinator created activity",
    actor: "s.ahmed@ju.edu.jo",
    level: "info",
    timestamp: "2024-03-10 09:45:12",
  },
  {
    id: "log-003",
    action: "Multiple failed login attempts",
    actor: "unknown@external.com",
    level: "warning",
    timestamp: "2024-03-10 10:20:05",
  },
  {
    id: "log-004",
    action: "Admin disabled user",
    actor: "jamiila@gmail.com",
    level: "info",
    timestamp: "2024-03-10 11:33:55",
  },
  {
    id: "log-005",
    action: "Coordinator updated attendance",
    actor: "s.ahmed@ju.edu.jo",
    level: "info",
    timestamp: "2024-03-10 12:58:02",
  },
  {
    id: "log-006",
    action: "Security policy changed",
    actor: "sys-admin@ju.edu.jo",
    level: "critical",
    timestamp: "2024-03-10 13:14:43",
  },
];
