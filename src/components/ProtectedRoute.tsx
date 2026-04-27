import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Array<"patient" | "doctor" | "admin">;
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { currentUser, userRole, isLoading } = useAuth();

  // 1. Wait for Firebase and Database to finish loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 2. If not logged in at all, kick to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // 3. If they are logged in, but have the wrong role
  if (!userRole || !allowedRoles.includes(userRole)) {
    
    // Figure out their correct dashboard and role name for the message
    let correctPath = "/patient";
    let roleDisplay = "Patient";
    
    if (userRole === "admin") {
      correctPath = "/admin";
      roleDisplay = "System Admin";
    } else if (userRole === "doctor") {
      correctPath = "/doctor";
      roleDisplay = "Doctor";
    }

    // Determine what portal they were TRYING to access based on the allowed roles
    const attemptedPortal = allowedRoles[0].charAt(0).toUpperCase() + allowedRoles[0].slice(1);

    // Show Access Denied UI
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-6 p-8 border border-destructive/20 rounded-xl bg-card shadow-lg relative overflow-hidden">
          {/* Background subtle glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-destructive/5 blur-3xl rounded-full" />
          
          <div className="relative">
            <div className="h-20 w-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="h-10 w-10" />
            </div>
            
            <h2 className="text-2xl font-display font-bold text-foreground mb-3">
              Access Denied
            </h2>
            
            <p className="text-muted-foreground mb-6 leading-relaxed">
              You do not have permission to access the <span className="font-semibold text-foreground">{attemptedPortal} Portal</span>. 
              Your account is currently registered as a <span className="font-semibold text-primary">{roleDisplay}</span>.
            </p>
            
            <Button asChild className="w-full py-6 text-base" variant="default">
              <Link to={correctPath}>
                <ArrowLeft className="mr-2 h-5 w-5" />
                Return to My Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 4. If they pass all checks, let them in!
  return <>{children}</>;
};

export default ProtectedRoute;