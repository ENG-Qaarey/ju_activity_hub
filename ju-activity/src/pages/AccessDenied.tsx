import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldOff } from "lucide-react";

const AccessDenied = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-subtle flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <Card className="rounded-3xl border border-border shadow-2xl">
          <CardContent className="space-y-6 text-center">
            <div className="flex items-center justify-center">
              <ShieldOff className="w-14 h-14 text-destructive" />
            </div>
            <h1 className="text-3xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground">
              Your JU-AMS role does not grant access to this area. Contact an administrator if you think this is an error.
            </p>
            <div className="flex flex-col gap-3">
              <Button size="lg" onClick={() => navigate(-1)}>
                Go Back
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/login") }>
                Return to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AccessDenied;
