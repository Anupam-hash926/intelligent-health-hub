import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { Users, Clock, CheckCircle, Phone, CalendarHeart, Calendar as CalendarIcon, Droplet, Settings, User, Building, Loader2, Activity, ArrowRightCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const DoctorDashboard = () => {
  // 1. Get the securely authenticated user
  const { currentUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState<"appointments" | "settings">("appointments");
  const [appointments, setAppointments] = useState<any[]>([]);
  
  // --- NEW STATE: Live Queue Data ---
  const [liveQueue, setLiveQueue] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone: "",
    department: "",
  });

  const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  // 2. Fetch specific doctor's schedule (Confirmed & Completed)
  const fetchAppointments = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/appointments/doctor/${currentUser.uid}/appointments`);
      const data = await res.json();
      if (data.status === "success") {
        setAppointments(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch doctor appointments", err);
      toast.error("Failed to load your schedule.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- NEW: Fetch only patients currently waiting in the hospital ---
  // --- FIXED: Fetch only THIS DOCTOR'S patients currently waiting in the hospital ---
  const fetchLiveQueue = async () => {
    // 1. We must ensure we have the user's ID before making the request
    if (!currentUser) return; 
    
    try {
      // 2. Hit the new, secure endpoint using the doctor's specific UID
      const res = await fetch(`${API_BASE}/api/appointments/doctor/${currentUser.uid}/live-queue`);
      const data = await res.json();
      
      if (data.status === "success") {
        setLiveQueue(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch live queue", err);
    }
  };


  // Fetch Doctor's Profile to pre-fill settings and get their name
  const fetchProfile = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${API_BASE}/api/appointments/doctor/${currentUser.uid}/profile`);
      const data = await res.json();
      if (data.status === "success" && data.data) {
        setProfileForm({
          full_name: data.data.full_name || "",
          phone: data.data.phone || "",
          department: data.data.department || "",
        });
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchAppointments();
      fetchLiveQueue();
      fetchProfile(); 
      
      // Auto-refresh the live queue every 30 seconds
      const intervalId = setInterval(() => {
        fetchLiveQueue();
      }, 30000);
      
      return () => clearInterval(intervalId);
    }
  }, [currentUser]);

  // --- NEW: Call Next Patient Action ---
  const handleCallPatient = async (appointmentId: number) => {
    try {
      // Create a PUT request to update status to 'in_consultation'
      const res = await fetch(`${API_BASE}/api/appointments/${appointmentId}/consult`, {
        method: "PUT"
      });
      
      if (res.ok) {
        toast.success("Patient called! They are moving to your office.");
        fetchLiveQueue(); // Refresh waiting room
        fetchAppointments(); // Refresh schedule
      } else {
        toast.error("Failed to call patient.");
      }
    } catch (error) {
      console.error("Error calling patient:", error);
      toast.error("Network error.");
    }
  };

  const handleComplete = async (appointmentId: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/appointments/${appointmentId}/complete`, {
        method: "PUT"
      });
      
      if (res.ok) {
        toast.success("Appointment marked as completed!");
        setAppointments((prevAppointments) => 
          prevAppointments.filter((apt) => apt.appointment_id !== appointmentId)
        );
      } else {
        toast.error("Failed to complete appointment.");
      }
    } catch (error) {
      console.error("Error completing appointment:", error);
      toast.error("Network error.");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/appointments/doctor/${currentUser.uid}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      
      if (res.ok) {
        toast.success("Profile updated successfully!");
      } else {
        toast.error("Failed to update profile.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error saving profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const navItems = [
    { title: "My Schedule", url: "/doctor", icon: CalendarHeart },
    { title: "My Patients", url: "/doctor/patients", icon: Users },
  ];

  return (
    <DashboardLayout navItems={navItems} role="Doctor">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              {profileForm.full_name ? (
                <span className="text-primary">{profileForm.full_name}'s </span>
              ) : (
                <span>Doctor </span>
              )}
              <span className="text-gradient">Portal</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              {profileForm.department ? `Department of ${profileForm.department}` : "Manage your patients, schedule, and profile securely."}
            </p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-2 border-b border-border pb-2">
          <button
            onClick={() => setActiveTab("appointments")}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === "appointments" ? "bg-card text-primary border border-border border-b-0" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarIcon className="h-4 w-4" /> My Appointments
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === "settings" ? "bg-card text-primary border border-border border-b-0" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Settings className="h-4 w-4" /> Profile Settings
          </button>
        </div>

        {/* APPOINTMENTS VIEW */}
        {activeTab === "appointments" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
            
            {/* LEFT COLUMN: The Timeline */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Today's Consultations</h2>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : appointments.length === 0 ? (
                <Card className="border-border border-dashed bg-muted/30">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <CheckCircle className="h-12 w-12 text-success/50 mb-4" />
                    <h3 className="text-xl font-display font-bold text-foreground mb-2">Schedule is clear!</h3>
                    <p className="text-muted-foreground">You have no pending appointments right now.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                  {appointments.map((apt) => (
                    <div key={apt.appointment_id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      
                      {/* Timeline Icon */}
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${apt.is_overbooked ? 'bg-warning/20 text-warning' : 'bg-primary/20 text-primary'}`}>
                        <Clock className="h-4 w-4" />
                      </div>

                      {/* Appointment Card */}
                      <Card className={`w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] border-border transition-all hover:shadow-md ${apt.is_overbooked ? 'ring-1 ring-warning/50 border-warning/30' : ''}`}>
                        <CardHeader className={`p-4 pb-3 flex flex-row items-center justify-between border-b bg-muted/20 ${apt.is_overbooked ? 'border-warning/20' : 'border-border/50'}`}>
                           <div className="font-semibold text-foreground flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {apt.appointment_time}
                           </div>
                           {apt.is_overbooked && <Badge variant="warning" className="text-[10px] h-5 bg-warning/10 text-warning border-warning/20">Double Booked</Badge>}
                        </CardHeader>
                        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <h3 className="font-bold text-lg text-foreground">{apt.patient_name}</h3>
                            
                            <div className="flex flex-wrap items-center gap-4 mt-2">
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Phone className="h-3.5 w-3.5" /> {apt.phone || "Not Provided"}
                              </div>
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Droplet className="h-3.5 w-3.5 text-red-500" />
                                {apt.blood_group && apt.blood_group !== "Not Recorded" ? (
                                  <span className="font-medium text-foreground">{apt.blood_group}</span>
                                ) : (
                                  <span className="text-destructive font-medium italic text-xs">Not Recorded</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button onClick={() => handleComplete(apt.appointment_id)} className="w-full sm:w-auto mt-auto" variant={apt.is_overbooked ? "outline" : "default"}>
                            <CheckCircle className="h-4 w-4 mr-2" /> Complete
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Live Priority Queue */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <Activity className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Live Waiting Room</h2>
              </div>
              
              <Card className="border-border shadow-sm border-t-4 border-t-primary">
                <CardHeader className="pb-3 bg-muted/30">
                  <CardTitle className="text-sm">Patients Currently Waiting</CardTitle>
                  <p className="text-xs text-muted-foreground">Ranked by Effective Priority</p>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {liveQueue.length === 0 ? (
                       <div className="p-6 text-center text-sm text-muted-foreground">
                         No patients are currently in the waiting room.
                       </div>
                    ) : (
                      liveQueue.map((patient, index) => (
                        <div key={patient.appointment_id} className="p-4 hover:bg-muted/20 transition-colors flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground">{patient.patient_name}</span>
                                {index === 0 && <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] h-5">Next</Badge>}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Wait Time: <span className="text-warning font-medium">{patient.wait_time_minutes} mins</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground uppercase tracking-wider">Priority</div>
                              <div className="text-xl font-bold text-primary">{patient.effective_priority}</div>
                            </div>
                          </div>
                          
                          <Button 
                            size="sm" 
                            className="w-full bg-accent hover:bg-accent/90 text-white"
                            onClick={() => handleCallPatient(patient.appointment_id)}
                          >
                            Call Patient to Office <ArrowRightCircle className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <Card className="border-border max-w-2xl mt-4">
            <CardHeader>
              <CardTitle>Complete Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name (with Title)</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="e.g. Dr. Sarah Chen" 
                      className="pl-9"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Department</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <select 
                      className="w-full h-10 rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                      value={profileForm.department}
                      onChange={(e) => setProfileForm({...profileForm, department: e.target.value})}
                      required
                    >
                      <option value="">Select Department...</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Emergency">Emergency</option>
                      <option value="General Medicine">General Medicine</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Dermatology">Dermatology</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Contact Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="+1-555-0100" 
                      className="pl-9"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isSaving} className="mt-4">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Profile
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;