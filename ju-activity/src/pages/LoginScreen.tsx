import { useEffect, useState, type FormEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { authApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const LoginScreen = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isHydrated, user } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already signed in
  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      const role = user?.role || "student";
      navigate(`/${role}/dashboard`, { replace: true });
    }
  }, [isHydrated, isAuthenticated, navigate, user?.role]);

  if (!isHydrated) {
      return null;
  }

  // If already signed in, don't show login form
  if (isAuthenticated) {
    return null;
  }

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Normalize email to lowercase for consistency
    const normalizedEmail = email.trim().toLowerCase();

    setIsLoading(true);
    try {
      const result = await authApi.login(normalizedEmail, password);

      if (result.success && result.user) {
          // Store user in localStorage for session management
          localStorage.setItem('user', JSON.stringify(result.user));

          if (result.token) {
            localStorage.setItem('token', result.token);
          }
          
          // Trigger page reload to update auth context
          const role = (result.user.role || 'student') as string;
          if (role === 'admin') {
            window.location.href = '/admin/dashboard';
          } else if (role === 'coordinator') {
            window.location.href = '/coordinator/dashboard';
          } else {
            window.location.href = '/student/dashboard';
          }
      } else {
          toast({
              title: "Login Failed",
              description: "Invalid credentials",
              variant: "destructive",
          });
      }

    } catch (error: any) {
      console.error("Login error:", error);
      
      // Provide more helpful error messages
      let errorMessage = "Invalid credentials";
      
      if (error.message) {
        const errorMsgLower = error.message.toLowerCase();
        
        if (errorMsgLower.includes("not verified") || errorMsgLower.includes("email not verified")) {
          errorMessage = "Please verify your email address before logging in. Check your inbox for the verification code.";
        } else if (errorMsgLower.includes("inactive")) {
          errorMessage = "Your account is inactive. Please contact support.";
        } else if (errorMsgLower.includes("invalid") || errorMsgLower.includes("incorrect")) {
          errorMessage = "Invalid email or password. Please try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="relative min-h-screen overflow-hidden text-slate-900">
      {/* Animated skyblue/white gradient */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(120deg, #ffffff 0%, #e0f2fe 28%, #7dd3fc 55%, #ffffff 100%)",
          backgroundSize: "200% 200%",
        }}
        animate={
          shouldReduceMotion
            ? undefined
            : {
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : {
                duration: 14,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
      />

      {/* Soft floating blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full bg-sky-300/50 blur-3xl"
          animate={
            shouldReduceMotion
              ? undefined
              : { x: [0, 40, 0], y: [0, 20, 0], scale: [1, 1.08, 1] }
          }
          transition={
            shouldReduceMotion
              ? undefined
              : { duration: 10, repeat: Infinity, ease: "easeInOut" }
          }
        />
        <motion.div
          className="absolute top-24 right-[-140px] h-[520px] w-[520px] rounded-full bg-white/70 blur-3xl"
          animate={
            shouldReduceMotion
              ? undefined
              : { x: [0, -30, 0], y: [0, 30, 0], scale: [1, 1.06, 1] }
          }
          transition={
            shouldReduceMotion
              ? undefined
              : { duration: 12, repeat: Infinity, ease: "easeInOut" }
          }
        />
        <motion.div
          className="absolute -bottom-28 left-1/3 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-sky-400/40 blur-3xl"
          animate={
            shouldReduceMotion
              ? undefined
              : { x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }
          }
          transition={
            shouldReduceMotion
              ? undefined
              : { duration: 11, repeat: Infinity, ease: "easeInOut" }
          }
        />
      </div>

      {/* Extra highlight */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.85),transparent_60%)]" />

      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: "easeOut" }}
        className="relative z-10 mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-12"
      >
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 w-fit text-slate-700 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card className="border border-white/60 bg-white/60 shadow-2xl backdrop-blur-md">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to your JU-AMS account</CardDescription>

          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <Button variant="link" type="button" className="px-0 text-primary">
                  Forgot Password?
                </Button>
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>

              {/* Register Link */}
              <p className="text-center text-muted-foreground">
                Don't have an account?{" "}
                <Button
                  variant="link"
                  type="button"
                  className="px-0 text-primary"
                  onClick={() => navigate("/register")}
                >
                  Register here
                </Button>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
