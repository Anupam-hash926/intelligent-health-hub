import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Mail, Lock, ArrowRight, User, Stethoscope, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

// --- FIREBASE IMPORT ---
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase"; // Assuming you have the @ alias setup, or use "../lib/firebase"

type Role = "patient" | "doctor" | "admin";

const roles: { key: Role; label: string; icon: React.ElementType; desc: string }[] = [
  { key: "patient", label: "Patient", icon: User, desc: "Access your records & appointments" },
  { key: "doctor", label: "Doctor", icon: Stethoscope, desc: "Manage patients & schedules" },
  { key: "admin", label: "Admin", icon: ShieldCheck, desc: "Full system administration" },
];

const Signup = () => {
  const [selectedRole, setSelectedRole] = useState<Role>("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Basic Validation
    if (!email || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      // 2. Tell Firebase to create this new user!
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. Success! Save role locally (Person 3 will link this to Supabase later)
      localStorage.setItem("user_role", selectedRole);
      
      toast.success("Account created successfully!", {
        description: "Welcome to MedFlowAI. Redirecting...",
      });
      
      // 4. Send them to their specific dashboard
      setTimeout(() => {
        const routes: Record<Role, string> = { patient: "/patient", doctor: "/doctor", admin: "/admin" };
        navigate(routes[selectedRole]);
      }, 1500);

    } catch (error: any) {
      console.error("Firebase Signup Error:", error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error("An account with this email already exists.");
      } else if (error.code === 'auth/invalid-email') {
        toast.error("Please enter a valid email address.");
      } else {
        toast.error("Failed to create account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Left decorative panel (Matches Login) */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient relative items-center justify-center p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsla(0,0%,100%,0.1),transparent_60%)]" />
        <div className="relative text-center max-w-md">
          <div className="h-16 w-16 rounded-2xl bg-primary-foreground/10 backdrop-blur flex items-center justify-center mx-auto mb-8">
            <Activity className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="text-4xl font-display font-extrabold text-primary-foreground mb-4">
            Join MedFlowAI
          </h2>
          <p className="text-primary-foreground/80 text-lg leading-relaxed">
            Create your account to experience the future of AI-powered healthcare management.
          </p>
        </div>
      </div>

      {/* Right signup form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-2 lg:hidden">
              <div className="h-9 w-9 rounded-lg hero-gradient flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg text-foreground">
                MedFlow<span className="text-gradient">AI</span>
              </span>
            </Link>
            <Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-secondary">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </div>

          <h1 className="text-3xl font-display font-extrabold text-foreground mb-2">Create an Account</h1>
          <p className="text-muted-foreground mb-8">Sign up to get started with our platform</p>

          {/* Role selector */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {roles.map((role) => (
              <button
                key={role.key}
                type="button"
                onClick={() => setSelectedRole(role.key)}
                className={`relative rounded-xl p-4 text-center transition-all duration-300 border-2 cursor-pointer ${
                  selectedRole === role.key
                    ? "border-primary bg-secondary shadow-glow"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <role.icon
                  className={`h-6 w-6 mx-auto mb-2 transition-colors ${
                    selectedRole === role.key ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <p className={`text-sm font-semibold ${
                  selectedRole === role.key ? "text-primary" : "text-foreground"
                }`}>
                  {role.label}
                </p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@hospital.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground font-medium">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-type your password"
                  className="pl-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full text-base py-6 mt-2" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-1 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Log in here
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;