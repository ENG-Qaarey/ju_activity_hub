import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Save, UserCheck, Calendar } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { mockActivities, mockApplications } from "@/data/mockData";

const CoordinatorAttendance = () => {
  const [selectedActivityId, setSelectedActivityId] = useState<string>("");
  
  // Filter activities owned by this coordinator
  const myActivities = mockActivities.filter(a => a.coordinatorName === "Dr. Sarah Ahmed");

  // Get approved students for the selected activity
  const enrolledStudents = mockApplications.filter(
    app => app.activityId === selectedActivityId && app.status === "approved"
  ).map(app => ({
    id: app.studentId,
    name: app.studentName,
    attended: false // default state
  }));

  const [attendance, setAttendance] = useState<Record<string, boolean>>({});

  const handleToggle = (studentId: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const handleSave = () => {
    toast({
      title: "Attendance Saved",
      description: `Successfully updated attendance for ${Object.keys(attendance).length} students.`,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Track Attendance</h1>
          <p className="text-muted-foreground">
            Mark attendance for your ongoing and completed activities
          </p>
        </div>

        {/* Activity Selector */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-md">
                <label className="text-sm font-medium mb-2 block">Select Activity</label>
                <Select value={selectedActivityId} onValueChange={setSelectedActivityId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an activity..." />
                  </SelectTrigger>
                  <SelectContent>
                    {myActivities.map(activity => (
                      <SelectItem key={activity.id} value={activity.id}>
                        {activity.title} ({activity.date})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student List */}
        {selectedActivityId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Student List
                </CardTitle>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Attendance
                </Button>
              </CardHeader>
              <CardContent>
                {enrolledStudents.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">Present</TableHead>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Student ID</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {enrolledStudents.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell>
                              <Checkbox 
                                checked={!!attendance[student.id]}
                                onCheckedChange={() => handleToggle(student.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell>{student.id}</TableCell>
                            <TableCell>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                attendance[student.id] 
                                  ? "bg-green-100 text-green-700" 
                                  : "bg-gray-100 text-gray-700"
                              }`}>
                                {attendance[student.id] ? "Present" : "Absent"}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No approved students found for this activity yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CoordinatorAttendance;
