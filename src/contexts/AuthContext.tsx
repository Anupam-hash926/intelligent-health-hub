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
          const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
          const res = await fetch(`${API_BASE}/api/patients/${user.uid}/role`);
          const data = await res.json();
          
          // 🔥 CRITICAL FIX: Explicitly check that data.role is NOT null!
          if (res.ok && data.status === "success" && data.role && data.role !== "null") {
            setUserRole(data.role);
            localStorage.setItem("user_role", data.role); 
          } else {
            // If the DB returned null, check local storage
            let localRole = localStorage.getItem("user_role");
            
            // Purge bad local storage data if it exists
            if (localRole === "null" || localRole === "undefined" || !localRole) {
              localRole = "patient"; // Absolute final fallback
            }
            
            setUserRole(localRole as "patient" | "doctor" | "admin");
          }
        } catch (error) {
          console.error("Failed to fetch user role:", error);
          let localRole = localStorage.getItem("user_role");
          if (!localRole || localRole === "null") localRole = "patient";
          setUserRole(localRole as "patient" | "doctor" | "admin");
        }
      } else {
        setUserRole(null);
        localStorage.removeItem("user_role");
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