import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Mail, Lock, ArrowRight, User, Stethoscope, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { toast } from "sonner";

type Role = "patient" | "doctor" | "admin";

const roles: { key: Role; label: string; icon: React.ElementType; desc: string }[] = [
  { key: "patient", label: "Patient", icon: User, desc: "Access your records & appointments" },
  { key: "doctor", label: "Doctor", icon: Stethoscope, desc: "Manage patients & schedules" },
  { key: "admin", label: "Admin", icon: ShieldCheck, desc: "Full system administration" },
];

const Login = () => {
  const [selectedRole, setSelectedRole] = useState<Role>("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    toast.success(`Logged in as ${selectedRole}: ${email}`, {
      description: "Redirecting to your dashboard...",
    });
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient relative items-center justify-center p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsla(0,0%,100%,0.1),transparent_60%)]" />
        <div className="relative text-center max-w-md">
          <div className="h-16 w-16 rounded-2xl bg-primary-foreground/10 backdrop-blur flex items-center justify-center mx-auto mb-8">
            <Activity className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="text-4xl font-display font-extrabold text-primary-foreground mb-4">
            MedFlowAI
          </h2>
          <p className="text-primary-foreground/80 text-lg leading-relaxed">
            Secure access to your Smart Hospital Management System. AI-powered healthcare at your fingertips.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { val: "50K+", lbl: "Patients" },
              { val: "200+", lbl: "Doctors" },
              { val: "99.9%", lbl: "Uptime" },
            ].map((s) => (
              <div key={s.lbl} className="bg-primary-foreground/10 backdrop-blur rounded-xl p-3">
                <p className="text-xl font-bold text-primary-foreground">{s.val}</p>
                <p className="text-xs text-primary-foreground/70">{s.lbl}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="h-9 w-9 rounded-lg hero-gradient flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">
              MedFlow<span className="text-gradient">AI</span>
            </span>
          </Link>

          <h1 className="text-3xl font-display font-extrabold text-foreground mb-2">Welcome back</h1>
          <p className="text-muted-foreground mb-8">Sign in to your account to continue</p>

          {/* Role selector */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {roles.map((role) => (
              <button
                key={role.key}
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
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight hidden sm:block">
                  {role.desc}
                </p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  placeholder="••••••••"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-border" />
                <span className="text-muted-foreground">Remember me</span>
              </label>
              <a href="#" className="text-primary hover:underline font-medium">Forgot password?</a>
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full text-base py-6">
              Sign In as {roles.find((r) => r.key === selectedRole)?.label}
              <ArrowRight className="ml-1 h-5 w-5" />
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Don't have an account?{" "}
            <a href="#" className="text-primary font-semibold hover:underline">Contact Admin</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
