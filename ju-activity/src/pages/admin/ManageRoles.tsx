import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockRoles } from "@/data/mockData";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ShieldCheck, Settings } from "lucide-react";

const ManageRoles = () => {
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
              <h1 className="text-2xl font-bold">Manage Roles & Permissions</h1>
              <p className="text-primary-foreground/75">
                Define the responsibilities for each portal role and keep permissions aligned with JU governance.
              </p>
            </div>
            <Button variant="ghost" className="bg-white/10">
              <Settings className="w-5 h-5 mr-2" />
              Audit permissions
            </Button>
          </div>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3">
          {mockRoles.map((role) => (
            <Card key={role.id} className="rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  {role.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{role.description}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {role.permissions.map((permission) => (
                    <li key={permission} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      {permission}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full">
                  Manage permissions
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManageRoles;
