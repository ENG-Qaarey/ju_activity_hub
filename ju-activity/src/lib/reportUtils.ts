import { Activity, Application, Attendance } from "@/data/mockData";
import { User } from "@/contexts/AuthContext";

// Download CSV file
export const downloadCSV = (data: string[][], filename: string) => {
  const csvContent = data.map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Download JSON file
export const downloadJSON = (data: unknown, filename: string) => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Generate PDF-like content (HTML that can be printed as PDF)
export const downloadPDF = (content: string, filename: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${filename}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            line-height: 1.6;
            color: #333;
          }
          h1 {
            color: #1a1a1a;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 10px;
            margin-bottom: 30px;
          }
          h2 {
            color: #4b5563;
            margin-top: 30px;
            margin-bottom: 15px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #f3f4f6;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9fafb;
          }
          .metric {
            font-size: 18px;
            font-weight: bold;
            color: #3b82f6;
            margin: 10px 0;
          }
          .comparison {
            color: #6b7280;
            font-style: italic;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #6b7280;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        ${content}
        <div class="footer">
          <p>Generated on ${new Date().toLocaleString()}</p>
          <p>JU Activity Management System</p>
        </div>
      </body>
    </html>
  `);
  
  printWindow.document.close();
  printWindow.focus();
  
  // Wait for content to load, then print
  setTimeout(() => {
    printWindow.print();
  }, 250);
};

// Generate Quarterly Activity Participation Report
export const generateQuarterlyReport = (
  activities: Activity[],
  applications: Application[]
): string => {
  const totalActivities = activities.length;
  const totalApplications = applications.length;
  const approvedApplications = applications.filter(app => app.status === 'approved').length;
  const pendingApplications = applications.filter(app => app.status === 'pending').length;
  const rejectedApplications = applications.filter(app => app.status === 'rejected').length;
  
  const engagementRate = totalActivities > 0 
    ? ((approvedApplications / totalActivities) * 100).toFixed(1)
    : '0';
  
  const categoryBreakdown = activities.reduce((acc, activity) => {
    acc[activity.category] = (acc[activity.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return `
    <h1>Quarterly Activity Participation Report</h1>
    
    <div class="metric">Overall Engagement: ${engagementRate}%</div>
    <p class="comparison">Based on approved applications vs total activities</p>
    
    <h2>Summary Statistics</h2>
    <table>
      <tr>
        <th>Metric</th>
        <th>Value</th>
      </tr>
      <tr>
        <td>Total Activities</td>
        <td>${totalActivities}</td>
      </tr>
      <tr>
        <td>Total Applications</td>
        <td>${totalApplications}</td>
      </tr>
      <tr>
        <td>Approved Applications</td>
        <td>${approvedApplications}</td>
      </tr>
      <tr>
        <td>Pending Applications</td>
        <td>${pendingApplications}</td>
      </tr>
      <tr>
        <td>Rejected Applications</td>
        <td>${rejectedApplications}</td>
      </tr>
    </table>
    
    <h2>Activity Breakdown by Category</h2>
    <table>
      <tr>
        <th>Category</th>
        <th>Count</th>
        <th>Percentage</th>
      </tr>
      ${Object.entries(categoryBreakdown).map(([category, count]) => `
        <tr>
          <td>${category.charAt(0).toUpperCase() + category.slice(1)}</td>
          <td>${count}</td>
          <td>${((count / totalActivities) * 100).toFixed(1)}%</td>
        </tr>
      `).join('')}
    </table>
    
    <h2>Top Activities by Enrollment</h2>
    <table>
      <tr>
        <th>Activity Title</th>
        <th>Category</th>
        <th>Enrolled</th>
        <th>Capacity</th>
        <th>Utilization</th>
      </tr>
      ${activities
        .sort((a, b) => b.enrolled - a.enrolled)
        .slice(0, 10)
        .map(activity => `
          <tr>
            <td>${activity.title}</td>
            <td>${activity.category}</td>
            <td>${activity.enrolled}</td>
            <td>${activity.capacity}</td>
            <td>${((activity.enrolled / activity.capacity) * 100).toFixed(1)}%</td>
          </tr>
        `).join('')}
    </table>
  `;
};

// Generate Coordinator Performance Report
export const generateCoordinatorReport = (
  activities: Activity[],
  applications: Application[]
): string[][] => {
  const coordinators = activities.reduce((acc, activity) => {
    const coordId = activity.coordinatorId;
    if (!acc[coordId]) {
      acc[coordId] = {
        name: activity.coordinatorName,
        activities: 0,
        applications: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
      };
    }
    acc[coordId].activities += 1;
    return acc;
  }, {} as Record<string, {
    name: string;
    activities: number;
    applications: number;
    approved: number;
    pending: number;
    rejected: number;
  }>);
  
  applications.forEach(app => {
    const activity = activities.find(a => a.id === app.activityId);
    if (activity && coordinators[activity.coordinatorId]) {
      coordinators[activity.coordinatorId].applications += 1;
      if (app.status === 'approved') coordinators[activity.coordinatorId].approved += 1;
      if (app.status === 'pending') coordinators[activity.coordinatorId].pending += 1;
      if (app.status === 'rejected') coordinators[activity.coordinatorId].rejected += 1;
    }
  });
  
  const rows: string[][] = [
    ['Coordinator Name', 'Total Activities', 'Total Applications', 'Approved', 'Pending', 'Rejected', 'Approval Rate']
  ];
  
  Object.values(coordinators).forEach(coord => {
    const approvalRate = coord.applications > 0 
      ? ((coord.approved / coord.applications) * 100).toFixed(1) + '%'
      : 'N/A';
    rows.push([
      coord.name,
      coord.activities.toString(),
      coord.applications.toString(),
      coord.approved.toString(),
      coord.pending.toString(),
      coord.rejected.toString(),
      approvalRate
    ]);
  });
  
  return rows;
};

// Generate System Usage Trends Report
export const generateSystemUsageReport = (
  activities: Activity[],
  applications: Application[],
  attendance: Attendance[]
): string => {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  
  const recentActivities = activities.filter(a => new Date(a.date) >= lastMonth);
  const recentApplications = applications.filter(app => 
    new Date(app.appliedAt) >= lastMonth.toISOString().split('T')[0]
  );
  
  const statusBreakdown = activities.reduce((acc, activity) => {
    acc[activity.status] = (acc[activity.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return `
    <h1>System Usage Trends Report</h1>
    
    <div class="metric">System Activity Overview</div>
    <p class="comparison">Last 30 days performance metrics</p>
    
    <h2>Recent Activity (Last 30 Days)</h2>
    <table>
      <tr>
        <th>Metric</th>
        <th>Count</th>
      </tr>
      <tr>
        <td>New Activities Created</td>
        <td>${recentActivities.length}</td>
      </tr>
      <tr>
        <td>New Applications Submitted</td>
        <td>${recentApplications.length}</td>
      </tr>
      <tr>
        <td>Total Attendance Records</td>
        <td>${attendance.length}</td>
      </tr>
    </table>
    
    <h2>Activity Status Distribution</h2>
    <table>
      <tr>
        <th>Status</th>
        <th>Count</th>
        <th>Percentage</th>
      </tr>
      ${Object.entries(statusBreakdown).map(([status, count]) => `
        <tr>
          <td>${status.charAt(0).toUpperCase() + status.slice(1)}</td>
          <td>${count}</td>
          <td>${((count / activities.length) * 100).toFixed(1)}%</td>
        </tr>
      `).join('')}
    </table>
    
    <h2>Capacity Utilization</h2>
    <table>
      <tr>
        <th>Activity</th>
        <th>Enrolled</th>
        <th>Capacity</th>
        <th>Utilization</th>
        <th>Status</th>
      </tr>
      ${activities
        .map(activity => `
          <tr>
            <td>${activity.title}</td>
            <td>${activity.enrolled}</td>
            <td>${activity.capacity}</td>
            <td>${((activity.enrolled / activity.capacity) * 100).toFixed(1)}%</td>
            <td>${activity.enrolled >= activity.capacity ? 'FULL' : 'Available'}</td>
          </tr>
        `).join('')}
    </table>
  `;
};

// Generate Full Dataset Export
export const generateFullDataset = (
  activities: Activity[],
  applications: Application[],
  attendance: Attendance[]
): string[][] => {
  const rows: string[][] = [];
  
  // Activities Sheet
  rows.push(['=== ACTIVITIES ===']);
  rows.push(['ID', 'Title', 'Description', 'Category', 'Date', 'Time', 'Location', 'Capacity', 'Enrolled', 'Coordinator', 'Status']);
  activities.forEach(activity => {
    rows.push([
      activity.id,
      activity.title,
      activity.description,
      activity.category,
      activity.date,
      activity.time,
      activity.location,
      activity.capacity.toString(),
      activity.enrolled.toString(),
      activity.coordinatorName,
      activity.status
    ]);
  });
  
  rows.push([]);
  rows.push(['=== APPLICATIONS ===']);
  rows.push(['ID', 'Student Name', 'Student ID', 'Activity Title', 'Applied Date', 'Status', 'Notes']);
  applications.forEach(app => {
    rows.push([
      app.id,
      app.studentName,
      app.studentId,
      app.activityTitle,
      app.appliedAt,
      app.status,
      app.notes || ''
    ]);
  });
  
  rows.push([]);
  rows.push(['=== ATTENDANCE ===']);
  rows.push(['ID', 'Activity ID', 'Student Name', 'Student ID', 'Status', 'Marked At', 'Marked By']);
  attendance.forEach(att => {
    rows.push([
      att.id,
      att.activityId,
      att.studentName,
      att.studentId,
      att.status,
      att.markedAt,
      att.markedBy
    ]);
  });
  
  return rows;
};

// Generate Students Report
export const generateStudentsReport = (
  users: User[],
  applications: Application[]
): string[][] => {
  const students = users.filter(u => u.role === 'student');
  
  const rows: string[][] = [
    ['Student ID', 'Name', 'Email', 'Department', 'Status', 'Joined Date', 'Total Applications', 'Approved', 'Pending', 'Rejected']
  ];
  
  students.forEach(student => {
    const studentApps = applications.filter(app => app.studentId === student.id);
    const approved = studentApps.filter(app => app.status === 'approved').length;
    const pending = studentApps.filter(app => app.status === 'pending').length;
    const rejected = studentApps.filter(app => app.status === 'rejected').length;
    
    rows.push([
      student.studentId || 'N/A',
      student.name,
      student.email,
      student.department || 'N/A',
      student.status || 'active',
      student.joinedAt || 'N/A',
      studentApps.length.toString(),
      approved.toString(),
      pending.toString(),
      rejected.toString()
    ]);
  });
  
  return rows;
};

// Generate Students Report (PDF format)
export const generateStudentsReportPDF = (
  users: User[],
  applications: Application[]
): string => {
  const students = users.filter(u => u.role === 'student');
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'active').length;
  const studentsWithApplications = students.filter(s => 
    applications.some(app => app.studentId === s.id)
  ).length;
  
  const participationRate = totalStudents > 0 
    ? ((studentsWithApplications / totalStudents) * 100).toFixed(1)
    : '0';
  
  return `
    <h1>Students Report</h1>
    
    <div class="metric">Total Students: ${totalStudents}</div>
    <p class="comparison">Participation Rate: ${participationRate}%</p>
    
    <h2>Summary Statistics</h2>
    <table>
      <tr>
        <th>Metric</th>
        <th>Value</th>
      </tr>
      <tr>
        <td>Total Students</td>
        <td>${totalStudents}</td>
      </tr>
      <tr>
        <td>Active Students</td>
        <td>${activeStudents}</td>
      </tr>
      <tr>
        <td>Students with Applications</td>
        <td>${studentsWithApplications}</td>
      </tr>
      <tr>
        <td>Participation Rate</td>
        <td>${participationRate}%</td>
      </tr>
    </table>
    
    <h2>Student Details</h2>
    <table>
      <tr>
        <th>Student ID</th>
        <th>Name</th>
        <th>Email</th>
        <th>Department</th>
        <th>Status</th>
        <th>Applications</th>
        <th>Approved</th>
        <th>Pending</th>
        <th>Rejected</th>
      </tr>
      ${students.map(student => {
        const studentApps = applications.filter(app => app.studentId === student.id);
        const approved = studentApps.filter(app => app.status === 'approved').length;
        const pending = studentApps.filter(app => app.status === 'pending').length;
        const rejected = studentApps.filter(app => app.status === 'rejected').length;
        
        return `
          <tr>
            <td>${student.studentId || 'N/A'}</td>
            <td>${student.name}</td>
            <td>${student.email}</td>
            <td>${student.department || 'N/A'}</td>
            <td>${student.status || 'active'}</td>
            <td>${studentApps.length}</td>
            <td>${approved}</td>
            <td>${pending}</td>
            <td>${rejected}</td>
          </tr>
        `;
      }).join('')}
    </table>
  `;
};

// Generate Attendance Report
export const generateAttendanceReport = (
  attendance: Attendance[],
  activities: Activity[],
  applications: Application[]
): string[][] => {
  const rows: string[][] = [
    ['Activity Title', 'Student Name', 'Student ID', 'Status', 'Marked At', 'Marked By', 'Activity Date']
  ];
  
  attendance.forEach(att => {
    const activity = activities.find(a => a.id === att.activityId);
    rows.push([
      activity?.title || 'Unknown Activity',
      att.studentName,
      att.studentId,
      att.status,
      att.markedAt,
      att.markedBy,
      activity?.date || 'N/A'
    ]);
  });
  
  return rows;
};

// Generate Attendance Report (PDF format)
export const generateAttendanceReportPDF = (
  attendance: Attendance[],
  activities: Activity[],
  applications: Application[]
): string => {
  const totalRecords = attendance.length;
  const presentCount = attendance.filter(a => a.status === 'present').length;
  const absentCount = attendance.filter(a => a.status === 'absent').length;
  const attendanceRate = totalRecords > 0 
    ? ((presentCount / totalRecords) * 100).toFixed(1)
    : '0';
  
  // Group by activity
  const byActivity = attendance.reduce((acc, att) => {
    const activity = activities.find(a => a.id === att.activityId);
    const activityTitle = activity?.title || 'Unknown';
    if (!acc[activityTitle]) {
      acc[activityTitle] = { present: 0, absent: 0, total: 0 };
    }
    acc[activityTitle].total += 1;
    if (att.status === 'present') acc[activityTitle].present += 1;
    if (att.status === 'absent') acc[activityTitle].absent += 1;
    return acc;
  }, {} as Record<string, { present: number; absent: number; total: number }>);
  
  return `
    <h1>Attendance Report</h1>
    
    <div class="metric">Overall Attendance Rate: ${attendanceRate}%</div>
    <p class="comparison">Based on ${totalRecords} attendance records</p>
    
    <h2>Summary Statistics</h2>
    <table>
      <tr>
        <th>Metric</th>
        <th>Value</th>
      </tr>
      <tr>
        <td>Total Attendance Records</td>
        <td>${totalRecords}</td>
      </tr>
      <tr>
        <td>Present</td>
        <td>${presentCount}</td>
      </tr>
      <tr>
        <td>Absent</td>
        <td>${absentCount}</td>
      </tr>
      <tr>
        <td>Attendance Rate</td>
        <td>${attendanceRate}%</td>
      </tr>
    </table>
    
    <h2>Attendance by Activity</h2>
    <table>
      <tr>
        <th>Activity</th>
        <th>Total</th>
        <th>Present</th>
        <th>Absent</th>
        <th>Rate</th>
      </tr>
      ${Object.entries(byActivity).map(([activity, stats]) => {
        const rate = stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : '0';
        return `
          <tr>
            <td>${activity}</td>
            <td>${stats.total}</td>
            <td>${stats.present}</td>
            <td>${stats.absent}</td>
            <td>${rate}%</td>
          </tr>
        `;
      }).join('')}
    </table>
    
    <h2>Detailed Attendance Records</h2>
    <table>
      <tr>
        <th>Activity</th>
        <th>Student Name</th>
        <th>Student ID</th>
        <th>Status</th>
        <th>Marked At</th>
        <th>Marked By</th>
      </tr>
      ${attendance.map(att => {
        const activity = activities.find(a => a.id === att.activityId);
        return `
          <tr>
            <td>${activity?.title || 'Unknown'}</td>
            <td>${att.studentName}</td>
            <td>${att.studentId}</td>
            <td>${att.status}</td>
            <td>${att.markedAt}</td>
            <td>${att.markedBy}</td>
          </tr>
        `;
      }).join('')}
    </table>
  `;
};

// Generate Applications Summary Report
export const generateApplicationsSummaryReport = (
  applications: Application[],
  activities: Activity[]
): string => {
  const total = applications.length;
  const approved = applications.filter(app => app.status === 'approved').length;
  const pending = applications.filter(app => app.status === 'pending').length;
  const rejected = applications.filter(app => app.status === 'rejected').length;
  
  const approvalRate = total > 0 
    ? ((approved / total) * 100).toFixed(1)
    : '0';
  
  // Group by activity
  const byActivity = applications.reduce((acc, app) => {
    if (!acc[app.activityTitle]) {
      acc[app.activityTitle] = { approved: 0, pending: 0, rejected: 0, total: 0 };
    }
    acc[app.activityTitle].total += 1;
    if (app.status === 'approved') acc[app.activityTitle].approved += 1;
    if (app.status === 'pending') acc[app.activityTitle].pending += 1;
    if (app.status === 'rejected') acc[app.activityTitle].rejected += 1;
    return acc;
  }, {} as Record<string, { approved: number; pending: number; rejected: number; total: number }>);
  
  return `
    <h1>Applications Summary Report</h1>
    
    <div class="metric">Overall Approval Rate: ${approvalRate}%</div>
    <p class="comparison">Based on ${total} total applications</p>
    
    <h2>Summary Statistics</h2>
    <table>
      <tr>
        <th>Status</th>
        <th>Count</th>
        <th>Percentage</th>
      </tr>
      <tr>
        <td>Total Applications</td>
        <td>${total}</td>
        <td>100%</td>
      </tr>
      <tr>
        <td>Approved</td>
        <td>${approved}</td>
        <td>${((approved / total) * 100).toFixed(1)}%</td>
      </tr>
      <tr>
        <td>Pending</td>
        <td>${pending}</td>
        <td>${((pending / total) * 100).toFixed(1)}%</td>
      </tr>
      <tr>
        <td>Rejected</td>
        <td>${rejected}</td>
        <td>${((rejected / total) * 100).toFixed(1)}%</td>
      </tr>
    </table>
    
    <h2>Applications by Activity</h2>
    <table>
      <tr>
        <th>Activity</th>
        <th>Total</th>
        <th>Approved</th>
        <th>Pending</th>
        <th>Rejected</th>
        <th>Approval Rate</th>
      </tr>
      ${Object.entries(byActivity).map(([activity, stats]) => {
        const rate = stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(1) : '0';
        return `
          <tr>
            <td>${activity}</td>
            <td>${stats.total}</td>
            <td>${stats.approved}</td>
            <td>${stats.pending}</td>
            <td>${stats.rejected}</td>
            <td>${rate}%</td>
          </tr>
        `;
      }).join('')}
    </table>
    
    <h2>All Applications</h2>
    <table>
      <tr>
        <th>Student Name</th>
        <th>Activity</th>
        <th>Applied Date</th>
        <th>Status</th>
        <th>Notes</th>
      </tr>
      ${applications.map(app => `
        <tr>
          <td>${app.studentName}</td>
          <td>${app.activityTitle}</td>
          <td>${app.appliedAt}</td>
          <td>${app.status}</td>
          <td>${app.notes || 'N/A'}</td>
        </tr>
      `).join('')}
    </table>
  `;
};

