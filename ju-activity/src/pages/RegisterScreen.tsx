import { useCallback, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { authApi } from "@/lib/api";

const RegisterScreen = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  
  const [formData, setFormData] = useState({
    fullName: "",
    studentId: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [phase, setPhase] = useState<'form' | 'verify'>('form');
  const [verificationCodeInput, setVerificationCodeInput] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate password strength
  const isStrongPassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: "Password must be at least 8 characters long" };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: "Password must contain at least one uppercase letter" };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: "Password must contain at least one lowercase letter" };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: "Password must contain at least one number" };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, message: "Password must contain at least one special character" };
    }
    return { valid: true, message: "" };
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields are filled
    if (!formData.fullName || !formData.studentId || !formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const normalizedEmail = formData.email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    // Validate student ID format (basic validation)
    if (formData.studentId.trim().length < 3) {
      toast({
        title: "Invalid Student ID",
        description: "Student ID must be at least 3 characters",
        variant: "destructive",
      });
      return;
    }

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Validate password strength
    const passwordValidation = isStrongPassword(formData.password);
    if (!passwordValidation.valid) {
      toast({
        title: "Weak Password",
        description: passwordValidation.message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Register with backend API
      const result = await authApi.register({
        name: formData.fullName.trim(),
        email: normalizedEmail,
        password: formData.password,
        studentId: formData.studentId.trim(),
      });

      if (result.success) {
        if (result.user) {
          localStorage.setItem('user', JSON.stringify(result.user));
        }
        if (result.token) {
          localStorage.setItem('token', result.token);
        }

        toast({
          title: "Registered",
          description: "Your account is ready. Redirecting to dashboard...",
        });
        window.location.href = '/student/dashboard';
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      
      // Provide more helpful error messages
      let errorMessage = "Unable to register. Please try again.";
      
      if (error.message) {
        const errorMsgLower = error.message.toLowerCase();
        
        if (errorMsgLower.includes("already exists") || errorMsgLower.includes("already registered")) {
          errorMessage = "An account with this email already exists. Please sign in instead.";
        } else if (errorMsgLower.includes("password")) {
          errorMessage = "Password requirements not met. Please check and try again.";
        } else if (errorMsgLower.includes("email")) {
          errorMessage = "Invalid email format. Please check your email address.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!registeredEmail) {
      toast({
        title: "Error",
        description: "No registered email found. Please register again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resendVerification({ email: registeredEmail });
      toast({
        title: "Code Resent",
        description: "A new verification code has been sent to your email.",
      });
    } catch (error: any) {
      console.error("Resend error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to resend code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCodeInput.trim()) {
      toast({
        title: "Invalid code",
        description: "Please enter the verification code sent to your email.",
        variant: "destructive",
      });
      return;
    }

    if (!registeredEmail) {
      toast({
        title: "Error",
        description: "No registered email found. Please register again.",
        variant: "destructive",
      });
      return;
    }

    // Validate code format (usually 6 digits)
    if (!/^\d{6}$/.test(verificationCodeInput.trim())) {
      toast({
        title: "Invalid Code Format",
        description: "Please enter the 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await authApi.verifyEmail({
        email: registeredEmail,
        code: verificationCodeInput.trim(),
      });

      if (result.success && result.user) {
        // Store user in localStorage for session management
        localStorage.setItem('user', JSON.stringify(result.user));
        
        toast({
          title: "Email Verified",
          description: "Welcome to JU Activity Hub! Your account has been created successfully.",
        });
        
        // Redirect to dashboard
        window.location.href = '/student/dashboard';
      } else {
        throw new Error("Verification failed");
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      
      let errorMessage = "Code verification failed. Please try again.";
      
      if (error.message) {
        const errorMsgLower = error.message.toLowerCase();
        
        if (errorMsgLower.includes("incorrect") || errorMsgLower.includes("invalid code")) {
          errorMessage = "The verification code is incorrect. Please check and try again.";
        } else if (errorMsgLower.includes("expired")) {
          errorMessage = "The verification code has expired. Please request a new one.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Verification Failed",
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
        className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-12"
      >
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
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>Register as a new student</CardDescription>
          </CardHeader>

          <CardContent>
            {phase === 'form' ? (
              <form onSubmit={handleRegister} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleChange}
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    name="studentId"
                    type="text"
                    placeholder="Enter your student ID"
                    value={formData.studentId}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="student@jazeerauniversity.edu.so"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use your university email address
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters with uppercase, lowercase, number, and special character
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                  {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length >= 8 && (
                    <p className="text-xs text-green-600">Passwords match ✓</p>
                  )}
                </div>

                <Button type="submit" className="w-full sm:col-span-2" size="lg" disabled={isLoading}>
                  {isLoading ? 'Creating Account...' : 'Register'}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Enter the verification code we emailed to
                  </p>
                  <strong className="block text-foreground text-base">{registeredEmail}</strong>
                  <p className="text-xs text-muted-foreground mt-2">
                    Check your inbox and spam folder if you don't see it
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="verificationCode">Verification Code</Label>
                  <Input
                    id="verificationCode"
                    value={verificationCodeInput}
                    onChange={(e) => {
                      // Only allow numbers and limit to 6 digits
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setVerificationCodeInput(value);
                    }}
                    placeholder="000000"
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                    autoComplete="one-time-code"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    6-digit code
                  </p>
                </div>
                <Button
                  type="button"
                  className="w-full"
                  size="lg"
                  disabled={isLoading || verificationCodeInput.trim().length !== 6}
                  onClick={handleVerifyCode}
                >
                  {isLoading ? 'Verifying...' : 'Verify Email'}
                </Button>
                <div className="flex items-center justify-between text-sm">
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 text-sm"
                    onClick={handleResendCode}
                    disabled={isLoading}
                  >
                    Resend code
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 text-sm"
                    onClick={() => {
                      setPhase('form');
                      setVerificationCodeInput('');
                    }}
                    disabled={isLoading}
                  >
                    Edit registration info
                  </Button>
                </div>
              </div>
            )}

            <p className="text-center text-muted-foreground mt-6">
              Already have an account?{' '}
              <Button
                variant="link"
                type="button"
                className="px-0 text-primary"
                onClick={() => navigate("/login")}
              >
                Sign in here
              </Button>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default RegisterScreen;
