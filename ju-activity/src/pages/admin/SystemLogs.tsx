import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { mockLogs } from "@/data/mockData";
import { AlertTriangle, ShieldCheck } from "lucide-react";

const SystemLogs = () => {
  const levelMap: Record<string, { color: string; label: string }> = {
    info: { color: "text-primary bg-primary/10", label: "Info" },
    warning: { color: "text-warning bg-warning/10", label: "Warning" },
    critical: { color: "text-destructive bg-destructive/10", label: "Critical" },
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
              <h1 className="text-2xl font-bold">System Logs</h1>
              <p className="text-primary-foreground/75">
                Inspect login history, application actions, and administrative changes with timestamps.
              </p>
            </div>
            <Badge className="text-xs uppercase text-muted-foreground">
              real-time
            </Badge>
          </div>
        </motion.div>

        <Card className="rounded-2xl shadow-xl">
          <CardContent className="space-y-4">
            {mockLogs.map((log) => (
              <div key={log.id} className="flex flex-col gap-2 rounded-2xl border border-muted/40 bg-card/50 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{log.timestamp}</p>
                  <h3 className="text-lg font-semibold">{log.action}</h3>
                  <p className="text-sm text-muted-foreground">By {log.actor}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={levelMap[log.level].color}>
                    {levelMap[log.level].label}
                  </Badge>
                  {log.level === "warning" ? (
                    <AlertTriangle className="w-5 h-5 text-warning" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-success" />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SystemLogs;
