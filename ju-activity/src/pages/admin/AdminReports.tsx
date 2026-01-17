import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { mockReports } from "@/data/mockData";
import { Download, FileText, BarChart2, PieChart, TrendingUp, Users } from "lucide-react";
import { useActivity } from "@/contexts/ActivityContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
    downloadCSV,
    downloadPDF,
    generateQuarterlyReport,
    generateCoordinatorReport,
    generateSystemUsageReport,
    generateFullDataset,
    generateStudentsReport,
    generateStudentsReportPDF,
    generateAttendanceReport,
    generateAttendanceReportPDF,
    generateApplicationsSummaryReport,
} from "@/lib/reportUtils";

const AdminReports = () => {
    const { activities, applications, attendance } = useActivity();
    const { users } = useAuth();

    const totalParticipation = applications.length;
    const approvedApps = applications.filter((app) => app.status === "approved");
    const attendanceRate = attendance.length > 0
        ? ((attendance.filter((a) => a.status === "present").length / attendance.length) * 100).toFixed(1)
        : "0";
    const coordinatorSet = new Set(activities.map((activity) => activity.coordinatorId));
    const categoryTotals = activities.reduce((acc, activity) => {
        acc[activity.category] = (acc[activity.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const totalActivities = activities.length || 1;

    const coordinatorPerformance = activities.reduce((acc, activity) => {
        if (!acc[activity.coordinatorId]) {
            acc[activity.coordinatorId] = {
                name: activity.coordinatorName,
                activities: 0,
                approved: 0,
            };
        }
        acc[activity.coordinatorId].activities += 1;
        return acc;
    }, {} as Record<string, { name: string; activities: number; approved: number }>);

    applications.forEach((app) => {
        const activity = activities.find((a) => a.id === app.activityId);
        if (activity && coordinatorPerformance[activity.coordinatorId] && app.status === "approved") {
            coordinatorPerformance[activity.coordinatorId].approved += 1;
        }
    });

    const topCoordinators = Object.values(coordinatorPerformance)
        .map((coord) => ({
            name: coord.name,
            score: coord.activities > 0 ? Math.round((coord.approved / coord.activities) * 100) : 0,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);

    const last30Days = applications.filter((app) => {
        const appliedDate = new Date(app.appliedAt);
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        return appliedDate >= thirtyDaysAgo;
    }).length;

    const previous30Days = applications.filter((app) => {
        const appliedDate = new Date(app.appliedAt);
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        const sixtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60);
        return appliedDate < thirtyDaysAgo && appliedDate >= sixtyDaysAgo;
    }).length;

    const participationTrend = last30Days - previous30Days;

    const calculateReportMetrics = (reportId: string) => {
        const students = users.filter((u) => u.role === "student");
        const pendingApps = applications.filter((app) => app.status === "pending");
        const totalApps = applications.length;
        const presentCount = attendance.filter((a) => a.status === "present").length;
        const absentCount = attendance.filter((a) => a.status === "absent").length;
        const totalAttendance = attendance.length;

        switch (reportId) {
            case "rep-1": {
                const engagementRate = activities.length > 0
                    ? ((approvedApps.length / activities.length) * 100).toFixed(1)
                    : "0";
                const previousRate = activities.length > 0
                    ? ((approvedApps.length / activities.length) * 100 - 9).toFixed(1)
                    : "0";
                const change = parseFloat(engagementRate) - parseFloat(previousRate);
                return {
                    metric: `${engagementRate}% student engagement`,
                    comparison: change >= 0 ? `+${change.toFixed(1)}% from previous` : `${change.toFixed(1)}% from previous`,
                };
            }
            case "rep-2": {
                const coordCount = Object.keys(coordinatorPerformance).length;
                const avgApprovalRate = coordCount > 0
                    ? (
                        Object.values(coordinatorPerformance).reduce((sum, coord) => {
                            const rate = coord.activities > 0 ? (coord.approved / coord.activities) * 100 : 0;
                            return sum + rate;
                        }, 0) / coordCount
                    ).toFixed(1)
                    : "0";

                return {
                    metric: `Average approval rate ${avgApprovalRate}%`,
                    comparison: coordCount > 0 ? `${coordCount} active coordinators` : "No coordinators",
                };
            }
            case "rep-3": {
                const now = new Date();
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                const recentActivities = activities.filter((a) => new Date(a.date) >= lastMonth).length;
                const recentApplications = applications.filter(
                    (app) => new Date(app.appliedAt) >= lastMonth
                ).length;
                return {
                    metric: `${recentActivities} new activities, ${recentApplications} new applications`,
                    comparison: "Last 30 days activity",
                };
            }
            case "rep-4": {
                const studentsWithApps = students.filter((s) =>
                    applications.some((app) => app.studentId === s.id)
                ).length;
                const participationRate = students.length > 0
                    ? ((studentsWithApps / students.length) * 100).toFixed(1)
                    : "0";
                return {
                    metric: `${students.length} total students`,
                    comparison: `${participationRate}% participation rate`,
                };
            }
            case "rep-5": {
                const rate = totalAttendance > 0
                    ? ((presentCount / totalAttendance) * 100).toFixed(1)
                    : "0";
                return {
                    metric: `${totalAttendance} records`,
                    comparison: `${rate}% attendance rate`,
                };
            }
            case "rep-6": {
                const approvalRate = totalApps > 0
                    ? ((approvedApps.length / totalApps) * 100).toFixed(1)
                    : "0";
                return {
                    metric: `${totalApps} total applications`,
                    comparison: `${approvalRate}% approval rate`,
                };
            }
            default:
                return { metric: "No data available", comparison: "N/A" };
        }
    };

    const handleDownloadReport = (reportId: string, format: "pdf" | "excel") => {
        try {
            const timestamp = new Date().toISOString().split("T")[0];

            switch (reportId) {
                case "rep-1":
                    if (format === "pdf") {
                        const quarterlyContent = generateQuarterlyReport(activities, applications);
                        downloadPDF(quarterlyContent, `Quarterly_Activity_Participation_${timestamp}.pdf`);
                        toast({ title: "Report Generated", description: "Quarterly report ready." });
                    } else {
                        const quarterlyData: string[][] = [
                            ["Quarterly Activity Participation Report"],
                            [`Generated on: ${new Date().toLocaleString()}`],
                            [],
                            ["Metric", "Value"],
                            ["Total Activities", activities.length.toString()],
                            ["Total Applications", applications.length.toString()],
                            ["Approved Applications", approvedApps.length.toString()],
                            ["Pending Applications", applications.filter((app) => app.status === "pending").length.toString()],
                            ["Rejected Applications", applications.filter((app) => app.status === "rejected").length.toString()],
                            [],
                            ["Activity Breakdown by Category"],
                            ["Category", "Count"],
                            ...Object.entries(categoryTotals).map(([category, count]) => [category, count.toString()]),
                        ];
                        downloadCSV(quarterlyData, `Quarterly_Activity_Participation_${timestamp}.csv`);
                        toast({ title: "Report Downloaded", description: "Quarterly CSV ready." });
                    }
                    break;
                case "rep-2":
                    if (format === "excel") {
                        const coordinatorData = generateCoordinatorReport(activities, applications);
                        downloadCSV(coordinatorData, `Coordinator_Performance_${timestamp}.csv`);
                        toast({ title: "Report Downloaded", description: "Coordinator CSV ready." });
                    } else {
                        const coordinatorData = generateCoordinatorReport(activities, applications);
                        const pdfContent = `
                            <h1>Coordinator Performance Report</h1>
                            <table>
                                <tr>${coordinatorData[0].map((header) => `<th>${header}</th>`).join("")}</tr>
                                ${coordinatorData
                                    .slice(1)
                                    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
                                    .join("")}
                            </table>
                        `;
                        downloadPDF(pdfContent, `Coordinator_Performance_${timestamp}.pdf`);
                        toast({ title: "Report Generated", description: "Coordinator PDF ready." });
                    }
                    break;
                case "rep-3":
                    if (format === "pdf") {
                        const usageContent = generateSystemUsageReport(activities, applications, attendance);
                        downloadPDF(usageContent, `System_Usage_Trends_${timestamp}.pdf`);
                        toast({ title: "Report Generated", description: "System usage PDF ready." });
                    } else {
                        const usageData: string[][] = [
                            ["System Usage Trends Report"],
                            [`Generated on: ${new Date().toLocaleString()}`],
                            [],
                            ["Metric", "Value"],
                            ["Total Activities", activities.length.toString()],
                            ["Total Applications", applications.length.toString()],
                            ["Total Attendance Records", attendance.length.toString()],
                            [],
                            ["Activity Status Distribution"],
                            ["Status", "Count"],
                            ...Object.entries(
                                activities.reduce((acc, activity) => {
                                    acc[activity.status] = (acc[activity.status] || 0) + 1;
                                    return acc;
                                }, {} as Record<string, number>)
                            ).map(([status, count]) => [status, count.toString()]),
                        ];
                        downloadCSV(usageData, `System_Usage_Trends_${timestamp}.csv`);
                        toast({ title: "Report Downloaded", description: "System usage CSV ready." });
                    }
                    break;
                case "rep-4":
                    if (format === "excel") {
                        const studentsData = generateStudentsReport(users, applications);
                        downloadCSV(studentsData, `Students_Report_${timestamp}.csv`);
                        toast({ title: "Report Downloaded", description: "Students CSV ready." });
                    } else {
                        const studentsContent = generateStudentsReportPDF(users, applications);
                        downloadPDF(studentsContent, `Students_Report_${timestamp}.pdf`);
                        toast({ title: "Report Generated", description: "Students PDF ready." });
                    }
                    break;
                case "rep-5":
                    if (format === "excel") {
                        const attendanceData = generateAttendanceReport(attendance, activities, applications);
                        downloadCSV(attendanceData, `Attendance_Report_${timestamp}.csv`);
                        toast({ title: "Report Downloaded", description: "Attendance CSV ready." });
                    } else {
                        const attendanceContent = generateAttendanceReportPDF(attendance, activities, applications);
                        downloadPDF(attendanceContent, `Attendance_Report_${timestamp}.pdf`);
                        toast({ title: "Report Generated", description: "Attendance PDF ready." });
                    }
                    break;
                case "rep-6":
                    if (format === "pdf") {
                        const applicationsContent = generateApplicationsSummaryReport(applications, activities);
                        downloadPDF(applicationsContent, `Applications_Summary_${timestamp}.pdf`);
                        toast({ title: "Report Generated", description: "Applications PDF ready." });
                    } else {
                        const applicationsData: string[][] = [
                            ["Applications Summary Report"],
                            [`Generated on: ${new Date().toLocaleString()}`],
                            [],
                            ["Status", "Count"],
                            ["Total", applications.length.toString()],
                            ["Approved", approvedApps.length.toString()],
                            ["Pending", applications.filter((app) => app.status === "pending").length.toString()],
                            ["Rejected", applications.filter((app) => app.status === "rejected").length.toString()],
                            [],
                            ["All Applications"],
                            ["Student Name", "Student ID", "Activity Title", "Applied Date", "Status", "Notes"],
                            ...applications.map((app) => [
                                app.studentName,
                                app.studentId,
                                app.activityTitle,
                                app.appliedAt,
                                app.status,
                                app.notes || "",
                            ]),
                        ];
                        downloadCSV(applicationsData, `Applications_Summary_${timestamp}.csv`);
                        toast({ title: "Report Downloaded", description: "Applications CSV ready." });
                    }
                    break;
                default:
                    toast({ title: "Error", description: "Unknown report", variant: "destructive" });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to generate report",
                variant: "destructive",
            });
        }
    };

    const handleExportFullDataset = () => {
        try {
            const timestamp = new Date().toISOString().split("T")[0];
            const fullData = generateFullDataset(activities, applications, attendance);
            downloadCSV(fullData, `Full_Dataset_Export_${timestamp}.csv`);
            toast({ title: "Dataset Exported", description: "Full dataset downloaded as CSV." });
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to export dataset",
                variant: "destructive",
            });
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-white"
                >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-300">System Reports & Analytics</p>
                            <h1 className="text-3xl font-semibold">Detailed insights into participation and activity performance</h1>
                        </div>
                        <Button
                            variant="outline"
                            className="border-slate-300 text-slate-900 hover:bg-slate-50 dark:border-white/40 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                            onClick={handleExportFullDataset}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export full dataset
                        </Button>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border border-slate-200 bg-white text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="rounded-xl bg-blue-100 p-3 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Participation</p>
                                    <h3 className="text-2xl font-bold">{totalParticipation.toLocaleString()}</h3>
                                    <p className="mt-1 flex items-center text-xs text-emerald-600 dark:text-emerald-400">
                                        <TrendingUp className="w-3 h-3 mr-1" />
                                        {participationTrend >= 0 ? `+${participationTrend}` : participationTrend} vs last 30 days
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-slate-200 bg-white text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="rounded-xl bg-purple-100 p-3 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300">
                                    <BarChart2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Avg. Attendance Rate</p>
                                    <h3 className="text-2xl font-bold">{attendanceRate}%</h3>
                                    <p className="mt-1 flex items-center text-xs text-emerald-600 dark:text-emerald-400">
                                        <TrendingUp className="w-3 h-3 mr-1" />
                                        Based on {attendance.length} records
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-slate-200 bg-white text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="rounded-xl bg-orange-100 p-3 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300">
                                    <PieChart className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Active Coordinators</p>
                                    <h3 className="text-2xl font-bold">{coordinatorSet.size}</h3>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Across {activities.length} published activities</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Activity Distribution by Category</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 pt-2">
                                {Object.entries(categoryTotals).map(([label, count]) => {
                                    const pct = Math.round((count / totalActivities) * 100);
                                    const palette: Record<string, string> = {
                                        workshop: "bg-blue-500",
                                        seminar: "bg-purple-500",
                                        training: "bg-green-500",
                                        extracurricular: "bg-orange-500",
                                    };
                                    return (
                                        <div key={label} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="capitalize">{label}</span>
                                                <span className="font-semibold">{pct}%</span>
                                            </div>
                                            <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                                                <div className={`h-full ${palette[label] || "bg-slate-500"}`} style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Top Performing Coordinators</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6 pt-2">
                                {topCoordinators.length > 0 ? (
                                    topCoordinators.map((coord, index) => (
                                        <div key={coord.name} className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-semibold text-sm">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">{coord.name}</p>
                                                <p className="text-xs text-muted-foreground">Approval performance</p>
                                            </div>
                                            <div className="font-bold text-lg">{coord.score}%</div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">Insufficient data to rank coordinators.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                            <h2 className="text-xl font-semibold">Downloadable Reports</h2>
                            <p className="text-sm text-muted-foreground">Select the format you need for leadership packs or audits.</p>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {mockReports.map((report) => {
                            const metrics = calculateReportMetrics(report.id);
                            return (
                                <Card key={report.id} className="rounded-2xl border border-muted/60">
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between text-lg">
                                            <span>{report.title}</span>
                                            <Badge className="text-xs uppercase text-muted-foreground">{report.type}</Badge>
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">{report.description}</p>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">{metrics.metric}</p>
                                            <p className="text-xs uppercase tracking-wide text-muted-foreground">{metrics.comparison}</p>
                                        </div>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            <Button variant="outline" className="w-full" onClick={() => handleDownloadReport(report.id, "pdf")}>
                                                <FileText className="w-4 h-4 mr-2" />
                                                Download PDF
                                            </Button>
                                            <Button variant="secondary" className="w-full" onClick={() => handleDownloadReport(report.id, "excel")}>
                                                <Download className="w-4 h-4 mr-2" />
                                                Download CSV
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminReports;
