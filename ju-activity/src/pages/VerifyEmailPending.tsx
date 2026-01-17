import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const VerifyEmailPending = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();

  const title = "Verify your email";

  const description = "A verification email has been sent. Please verify your email address to continue.";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2 justify-center">
          <Button onClick={() => window.location.reload()}>Refresh</Button>
          <Button variant="outline" onClick={() => navigate("/login")}>Sign in</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmailPending;
