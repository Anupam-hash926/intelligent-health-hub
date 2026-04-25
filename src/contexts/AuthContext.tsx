import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  currentUser: User | null;
  userRole: "patient" | "doctor" | "admin" | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({ currentUser: null, userRole: null, isLoading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<"patient" | "doctor" | "admin" | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // 1. Try to fetch the official trusted role from the Python backend
          const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
          const res = await fetch(`${API_BASE}/api/patients/${user.uid}/role`);
          const data = await res.json();
          
          if (res.ok && data.status === "success") {
            setUserRole(data.role);
            localStorage.setItem("user_role", data.role); // Keep local storage in sync
          } else {
            // RACE CONDITION FIX: 
            // If the DB says 404, it means Firebase logged them in before the Python /sync finished.
            // We fall back to the temporary local storage saved by Signup.tsx!
            const localRole = localStorage.getItem("user_role") as "patient" | "doctor" | "admin" | null;
            setUserRole(localRole || "patient"); // Absolute fallback
          }
        } catch (error) {
          console.error("Failed to fetch user role:", error);
          const localRole = localStorage.getItem("user_role") as "patient" | "doctor" | "admin" | null;
          setUserRole(localRole || "patient");
        }
      } else {
        setUserRole(null);
        localStorage.removeItem("user_role"); // Clear role on logout
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userRole, isLoading }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};