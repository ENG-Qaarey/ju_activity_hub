import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, Terminal } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { auditLogsApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const AdminLogs = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const data = await auditLogsApi.getAll({ q: searchTerm, take: 200 });
                if (!cancelled) {
                    setLogs(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to load audit logs";
                if (!cancelled) {
                    setLogs([]);
                }
                toast({
                    title: "Unable to load audit logs",
                    description: message,
                    variant: "destructive",
                });
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }, 250);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [searchTerm]);

    const formattedRows = useMemo(() => {
        const toTitle = (value: string) =>
            value
                .toLowerCase()
                .split("_")
                .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
                .join(" ");

        return logs.map((row) => {
            const actionRaw = String(row.action ?? "");
            const action = actionRaw ? toTitle(actionRaw) : "Unknown";
            const status = actionRaw.includes("FAILURE") ? "Failed" : "Success";
            const user = row.actorEmail ?? row.targetEmail ?? "System";
            const role = row.actorRole ? toTitle(String(row.actorRole)) : row.actorEmail ? "User" : "System";
            const timestamp = row.createdAt ? String(row.createdAt).replace("T", " ").replace("Z", "") : "";

            return {
                id: row.id ?? `${actionRaw}-${timestamp}`,
                action,
                user,
                role,
                timestamp,
                status,
            };
        });
    }, [logs]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">System Audi Logs</h1>
          <p className="text-muted-foreground">
            Track security events and administrative actions
          </p>
        </div>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Terminal className="w-5 h-5" />
                    Audit Trail
                </CardTitle>
                <div className="flex gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search logs..."
                          className="pl-8"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon">
                        <Download className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading && (
                  <div className="text-sm text-muted-foreground pb-3">Loading audit logs...</div>
                )}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                                                        {formattedRows.map((log) => (
                                                            <TableRow key={log.id}>
                                                                <TableCell className="font-mono text-xs">{log.timestamp}</TableCell>
                                                                <TableCell className="font-medium">{log.action}</TableCell>
                                                                <TableCell>{log.user}</TableCell>
                                                                <TableCell>{log.role}</TableCell>
                                                                <TableCell>
                                                                    <span
                                                                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                            log.status === "Success"
                                                                                ? "bg-green-100 text-green-700"
                                                                                : "bg-red-100 text-red-700"
                                                                        }`}
                                                                    >
                                                                        {log.status}
                                                                    </span>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}

                                                        {!isLoading && formattedRows.length === 0 && (
                                                            <TableRow>
                                                                <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                                                                    No audit logs found.
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminLogs;
