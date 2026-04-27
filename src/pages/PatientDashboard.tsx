import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  History, CalendarPlus, AlertTriangle, Search, Clock,
  MapPin, Bed, ChevronRight, Check, Loader2, FileText,
  Pill, Stethoscope, TrendingUp, User, Save
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import EmergencyLocator from "@/components/EmergencyLocator";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { title: "Medical History", url: "/patient", icon: History },
  { title: "Book Appointment", url: "/patient/appointment", icon: CalendarPlus },
  { title: "My Profile", url: "/patient/profile", icon: User },
  { title: "Emergency", url: "/patient/emergency", icon: AlertTriangle },
];

const medicalHistory = [
  { id: 1, date: "2026-02-15", doctor: "Dr. Sarah Chen", department: "Cardiology", diagnosis: "Mild Hypertension", prescription: "Amlodipine 5mg", status: "Completed" },
  { id: 2, date: "2026-01-20", doctor: "Dr. James Wilson", department: "General Medicine", diagnosis: "Seasonal Flu", prescription: "Oseltamivir 75mg", status: "Completed" },
];

const departments = ["Cardiology", "General Medicine", "Orthopedics", "Dermatology", "Neurology", "Pediatrics"];
const timeSlots = [
  { time: "09:00 AM", demand: "low" }, { time: "10:00 AM", demand: "high" },
  { time: "11:00 AM", demand: "low" }, { time: "02:00 PM", demand: "high" },
  { time: "03:00 PM", demand: "low" }, { time: "04:00 PM", demand: "medium" },
];

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const PatientDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<"history" | "appointment" | "profile" | "emergency">("history");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [bookingState, setBookingState] = useState<"idle" | "checking" | "confirmed" | "alternate">("idle");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [patientDistance, setPatientDistance] = useState<number | "">("");
  const [bloodGroup, setBloodGroup] = useState("");
  
  const [profileMessage, setProfileMessage] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Determine active tab based on URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/appointment")) setActiveTab("appointment");
    else if (path.includes("/emergency")) setActiveTab("emergency");
    else if (path.includes("/profile")) setActiveTab("profile");
    else setActiveTab("history");
  }, [location.pathname]);

  // Fetch Profile Data IMMEDIATELY on load
  useEffect(() => {
    if (!currentUser?.uid) return;

    setIsProfileLoading(true);
    fetch(`http://127.0.0.1:8000/api/patients/${currentUser.uid}/profile`)
      .then(res => res.json())
      .then(data => {
        if (data.full_name) setFullName(data.full_name);
        if (data.email) setEmail(data.email);
        if (data.phone) setPhone(data.phone);
        if (data.dob) setDob(data.dob);
        if (data.distance_miles) setPatientDistance(data.distance_miles);
        if (data.blood_group) setBloodGroup(data.blood_group);
      })
      .catch(err => console.error("Could not fetch profile", err))
      .finally(() => setIsProfileLoading(false));
  }, [currentUser?.uid]);

  // Fetch History Data ONLY when on History tab
  useEffect(() => {
    if (!currentUser?.uid) return;

    if (activeTab === "history") {
      setIsLoadingHistory(true);
      fetch(`http://127.0.0.1:8000/api/appointments/patient/${currentUser.uid}`)
        .then(res => res.json())
        .then(data => setHistoryData(data.data && data.data.length > 0 ? data.data : medicalHistory))
        .catch(() => setHistoryData(medicalHistory))
        .finally(() => setIsLoadingHistory(false));
    }
  }, [activeTab, currentUser?.uid]);

  const filteredHistory = historyData.filter(
    (h) =>
      (h.doctor && h.doctor.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (h.diagnosis && h.diagnosis.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (h.department && h.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.uid) return;

    if (!bloodGroup) {
      setProfileMessage("Error: Blood Group is required.");
      toast.error("Please select a Blood Group");
      return;
    }

    // --- FIX: Updated validation to require exactly 10 digits ---
    if (phone.length !== 10) {
      setProfileMessage("Error: Phone number must be exactly 10 digits.");
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/patients/${currentUser.uid}/update-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          full_name: fullName,
          email: email,
          phone: phone,
          dob: dob,
          distance_miles: patientDistance,
          blood_group: bloodGroup
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setProfileMessage("Profile updated successfully!");
      setTimeout(() => setProfileMessage(""), 3000);
    } catch (error) {
      setProfileMessage("Error saving profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.uid) return;
    
    if (!dob || patientDistance === "" || !bloodGroup) {
      toast.error("Please complete your profile (including Blood Group) first.");
      navigate("/patient/profile");
      return;
    }

    setBookingState("checking");

    try {
      const today = new Date();
      const appointmentDate = new Date(selectedDate);
      const leadTimeDays = Math.ceil(Math.abs(appointmentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      const mlResponse = await fetch(`http://127.0.0.1:8000/api/ml/${currentUser.uid}/predict-noshow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_time_days: leadTimeDays }),
      });

      const mlData = await mlResponse.json();
      
      setTimeout(async () => {
        try {
          const combinedDateTime = `${selectedDate} ${selectedTime}`; 
          const deptToDoctorMap: Record<string, string> = {
            "Cardiology": "1", "General Medicine": "2", "Orthopedics": "3",
            "Dermatology": "4", "Neurology": "5", "Pediatrics": "6",
          };
          const assignedDoctorId = deptToDoctorMap[selectedDept] || "1";

          await fetch("http://127.0.0.1:8000/api/appointments/book", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              patient_id: currentUser.uid,
              doctor_id: assignedDoctorId,
              appointment_time: combinedDateTime,
              status: "scheduled",
              priority_score: 1, 
              no_show_risk: mlData.no_show_risk_percentage || 0
            })
          });

          setBookingState("confirmed");
        } catch (err) {
          console.error("Failed to save booking");
        }
      }, 2000);
    } catch (error) {
      setTimeout(() => setBookingState("confirmed"), 1500);
    }
  };

  const resetBooking = () => {
    setBookingState("idle");
    setSelectedDept("");
    setSelectedDate("");
    setSelectedTime("");
  };

  return (
    <DashboardLayout navItems={navItems} role="Patient">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Welcome back,{" "}
            {isProfileLoading ? (
              <span className="inline-block h-8 w-32 md:w-48 bg-muted animate-pulse rounded-md align-middle"></span>
            ) : (
              <span className="text-gradient">{fullName || currentUser?.email?.split('@')[0] || "Guest"}</span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">Manage your health records and appointments</p>
        </div>

        <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto">
          {[
            { key: "history" as const, label: "Medical History", icon: History, path: "/patient" },
            { key: "appointment" as const, label: "Book Appointment", icon: CalendarPlus, path: "/patient/appointment" },
            { key: "profile" as const, label: "My Profile", icon: User, path: "/patient/profile" },
            { key: "emergency" as const, label: "Emergency", icon: AlertTriangle, path: "/patient/emergency" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => navigate(tab.path)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-card text-primary border border-border border-b-0"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === "profile" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>Medical Profile Settings</CardTitle>
                <CardDescription>Enter realistic data to ensure accurate AI triage and scheduling.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground border-b pb-2">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name <span className="text-destructive">*</span></Label>
                        <Input 
                          placeholder="e.g. John Doe" 
                          value={fullName} 
                          onChange={(e) => setFullName(e.target.value)} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date of Birth <span className="text-destructive">*</span></Label>
                        <Input 
                          type="date" 
                          value={dob} 
                          min="1900-01-01"
                          max={new Date().toISOString().split("T")[0]}
                          onChange={(e) => {
                            const selectedDob = new Date(e.target.value);
                            const today = new Date();
                            let calculatedAge = today.getFullYear() - selectedDob.getFullYear();
                            
                            if (calculatedAge > 125) {
                              toast.error("Please enter a realistic Date of Birth (Max age: 125)");
                              return;
                            }
                            setDob(e.target.value);
                          }} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Blood Group <span className="text-destructive">*</span></Label>
                        <Select value={bloodGroup} onValueChange={setBloodGroup} required>
                          <SelectTrigger className={!bloodGroup ? "border-destructive/50 focus:ring-destructive/20" : ""}>
                            <SelectValue placeholder="Select Blood Group" />
                          </SelectTrigger>
                          <SelectContent>
                            {bloodGroups.map((bg) => (
                              <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h3 className="text-sm font-semibold text-foreground border-b pb-2">Contact & Location</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Email Address <span className="text-destructive">*</span></Label>
                        <Input 
                          type="email" 
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone Number <span className="text-destructive">*</span></Label>
                        <Input 
                          type="tel" 
                          placeholder="1234567890" // --- FIX: Updated placeholder ---
                          value={phone} 
                          onChange={(e) => {
                            const val = e.target.value;
                            // --- FIX: Updated to allow up to 10 digits ---
                            if (/^\d*$/.test(val) && val.length <= 10) {
                              setPhone(val);
                            }
                          }} 
                          required 
                        />
                        {/* --- FIX: Updated helper text --- */}
                        <p className="text-xs text-muted-foreground mt-1">Must be exactly 10 digits.</p>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Distance to Hospital (miles) <span className="text-destructive">*</span></Label>
                        <Input 
                          type="number" 
                          placeholder="e.g. 15" 
                          value={patientDistance} 
                          min="0"
                          max="500"
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (val > 500) {
                              toast.error("Distance cannot exceed 500 miles.");
                              return;
                            }
                            setPatientDistance(val || "");
                          }} 
                          required 
                        />
                        <p className="text-xs text-muted-foreground mt-1">Maximum allowed distance for triage is 500 miles.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 pt-4 border-t">
                    <Button type="submit" disabled={isSavingProfile}>
                      {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Profile Changes
                    </Button>
                    {profileMessage && (
                      <span className={`text-sm font-medium ${profileMessage.includes("Error") ? "text-destructive" : "text-success"}`}>
                        {profileMessage}
                      </span>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === "appointment" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <AnimatePresence mode="wait">
              {bookingState === "idle" && (
                <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleBookAppointment} className="max-w-2xl space-y-6">
                  <Card className="border-border">
                    <CardHeader><CardTitle className="text-lg">Schedule New Appointment</CardTitle></CardHeader>
                    <CardContent className="space-y-5">
                      <div className="space-y-2">
                        <Label>Department</Label>
                        <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground" required>
                          <option value="">Select department...</option>
                          {departments.map((d) => (<option key={d} value={d}>{d}</option>))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Preferred Date</Label>
                        <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} min={new Date().toISOString().split("T")[0]} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Time Slot</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {timeSlots.map((slot) => (
                            <button key={slot.time} type="button" onClick={() => setSelectedTime(slot.time)} className={`p-3 rounded-lg border text-sm text-left transition-all ${selectedTime === slot.time ? "border-primary bg-secondary text-primary font-medium" : "border-border bg-card text-foreground hover:border-primary/40"}`}>
                              <div className="flex items-center justify-between"><span>{slot.time}</span><Clock className="h-3 w-3 text-muted-foreground" /></div>
                            </button>
                          ))}
                        </div>
                      </div>
                      <Button type="submit" variant="hero" size="lg" className="w-full" disabled={!selectedDept || !selectedDate || !selectedTime}>
                        Book Appointment <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.form>
              )}
              {bookingState === "checking" && (
                <div className="max-w-md mx-auto text-center py-16"><Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" /><h3 className="text-xl font-bold">Processing...</h3></div>
              )}
              {bookingState === "confirmed" && (
                <div className="max-w-md mx-auto text-center py-16"><div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4"><Check className="h-8 w-8 text-success" /></div><h3 className="text-xl font-bold">Confirmed!</h3><Button variant="outline" className="mt-6 w-full" onClick={resetBooking}>Back</Button></div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
             {isLoadingHistory ? <Loader2 className="animate-spin mx-auto mt-10" /> : 
              <div className="grid gap-3">
                {filteredHistory.map((record) => (
                   record.status === "reschedule_requested" ? (
                    <Card key={record.id} className="border-destructive bg-destructive/5"><CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-3"><div className="flex gap-3"><AlertTriangle className="text-destructive h-5 w-5 mt-1" /><div><p className="font-bold text-destructive">Reschedule Needed</p><p className="text-sm">High no-show risk detected for {record.department}.</p></div></div><Button variant="outline" onClick={() => setActiveTab("appointment")}>Reschedule</Button></CardContent></Card>
                   ) : (
                    <Card key={record.id} className="border-border"><CardContent className="p-4 flex justify-between items-center"><div><p className="font-semibold">{record.diagnosis || "Consultation"}</p><p className="text-sm text-muted-foreground">{record.doctor} · {record.department}</p></div><Badge>{record.status}</Badge></CardContent></Card>
                   )
                ))}
              </div>
             }
          </motion.div>
        )}

        {activeTab === "emergency" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <EmergencyLocator />
          </motion.div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;