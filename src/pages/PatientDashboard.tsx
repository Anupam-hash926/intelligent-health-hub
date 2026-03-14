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

import EmergencyLocator from "@/components/EmergencyLocator";

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

const PatientDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<"history" | "appointment" | "profile" | "emergency">("history");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [bookingState, setBookingState] = useState<"idle" | "checking" | "confirmed" | "alternate">("idle");

  // --- COMPREHENSIVE PROFILE STATES ---
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [patientDistance, setPatientDistance] = useState<number | "">("");
  
  const [profileMessage, setProfileMessage] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // History States
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/appointment")) setActiveTab("appointment");
    else if (path.includes("/emergency")) setActiveTab("emergency");
    else if (path.includes("/profile")) setActiveTab("profile");
    else setActiveTab("history");
  }, [location.pathname]);

  // Fetch History OR Profile based on active tab
  useEffect(() => {
    if (activeTab === "history") {
      setIsLoadingHistory(true);
      fetch(`http://127.0.0.1:8000/api/patients/4/history`)
        .then(res => res.json())
        .then(data => setHistoryData(data.data && data.data.length > 0 ? data.data : medicalHistory))
        .catch(() => setHistoryData(medicalHistory))
        .finally(() => setIsLoadingHistory(false));
    } 
    else if (activeTab === "profile") {
      // Auto-load profile data when they open the tab
      fetch(`http://127.0.0.1:8000/api/patients/4/profile`)
        .then(res => res.json())
        .then(data => {
          if (data.full_name) setFullName(data.full_name);
          if (data.email) setEmail(data.email);
          if (data.phone) setPhone(data.phone);
          if (data.dob) setDob(data.dob);
          if (data.distance_miles) setPatientDistance(data.distance_miles);
        })
        .catch(err => console.error("Could not fetch profile", err));
    }
  }, [activeTab]);

  const filteredHistory = historyData.filter(
    (h) =>
      (h.doctor && h.doctor.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (h.diagnosis && h.diagnosis.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (h.department && h.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // --- SAVE PROFILE LOGIC ---
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      // We will update the backend to accept this new comprehensive payload next!
      const res = await fetch(`http://127.0.0.1:8000/api/patients/4/update-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          full_name: fullName,
          email: email,
          phone: phone,
          dob: dob,
          distance_miles: patientDistance 
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

  // --- BOOKING LOGIC (AI Hidden from User) ---
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dob || !patientDistance) {
      alert("Please complete your Medical Profile (DOB & Distance) before booking so we can optimize your appointment.");
      navigate("/patient/profile");
      return;
    }

    setBookingState("checking");

    try {
      const today = new Date();
      const appointmentDate = new Date(selectedDate);
      const leadTimeDays = Math.ceil(Math.abs(appointmentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Ask AI behind the scenes
      const mlResponse = await fetch(`http://127.0.0.1:8000/api/ml/4/predict-noshow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_time_days: leadTimeDays }),
      });

      const mlData = await mlResponse.json();
      
      setTimeout(() => {
        if (mlData.prediction === "No-Show") {
          setBookingState("alternate");
        } else {
          setBookingState("confirmed");
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
            Welcome back, <span className="text-gradient">{fullName || "Alex"}</span>
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

        {/* --- COMPREHENSIVE PROFILE TAB --- */}
        {activeTab === "profile" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Medical Profile Settings</CardTitle>
                <CardDescription>Keep your information updated. This helps our system optimize your scheduling.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  
                  {/* Personal Info Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground border-b pb-2">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input 
                          placeholder="e.g. John Doe" 
                          value={fullName} 
                          onChange={(e) => setFullName(e.target.value)} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date of Birth</Label>
                        <Input 
                          type="date" 
                          value={dob} 
                          onChange={(e) => setDob(e.target.value)} 
                          required 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact & Location Section */}
                  <div className="space-y-4 pt-2">
                    <h3 className="text-sm font-semibold text-foreground border-b pb-2">Contact & Location</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Email Address</Label>
                        <Input 
                          type="email" 
                          placeholder="john@example.com" 
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input 
                          type="tel" 
                          placeholder="(555) 000-0000" 
                          value={phone} 
                          onChange={(e) => setPhone(e.target.value)} 
                          required 
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Distance to Preferred Hospital (miles)</Label>
                        <Input 
                          type="number" 
                          placeholder="e.g. 15" 
                          value={patientDistance} 
                          onChange={(e) => setPatientDistance(parseInt(e.target.value) || "")} 
                          required 
                        />
                        <p className="text-xs text-muted-foreground mt-1">Used to provide optimal travel buffer times.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 pt-4 border-t">
                    <Button type="submit" disabled={isSavingProfile}>
                      {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Profile Changes
                    </Button>
                    {profileMessage && (
                      <span className={`text-sm font-medium animate-in fade-in ${profileMessage.includes("Error") ? "text-destructive" : "text-success"}`}>
                        {profileMessage}
                      </span>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* --- APPOINTMENT TAB --- */}
        {activeTab === "appointment" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <AnimatePresence mode="wait">
              {bookingState === "idle" && (
                <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleBookAppointment} className="max-w-2xl space-y-6">
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="text-lg">Schedule New Appointment</CardTitle>
                    </CardHeader>
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
                        <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} min="2026-03-02" required />
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
                <motion.div key="checking" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-md mx-auto text-center py-16">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-display font-bold text-foreground mb-2">Processing Request...</h3>
                  <p className="text-muted-foreground text-sm">Finding the best available slot</p>
                </motion.div>
              )}

              {bookingState === "confirmed" && (
                <motion.div key="confirmed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto text-center py-16">
                  <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4"><Check className="h-8 w-8 text-success" /></div>
                  <h3 className="text-xl font-display font-bold text-foreground mb-2">Booking Confirmed!</h3>
                  <p className="text-muted-foreground text-sm">{selectedDept} · {selectedDate} · {selectedTime}</p>
                  <Button variant="outline" className="mt-6 w-full" onClick={resetBooking}>Book Another</Button>
                </motion.div>
              )}

              {bookingState === "alternate" && (
                <motion.div key="alternate" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto text-center py-16">
                  <div className="h-16 w-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4"><AlertTriangle className="h-8 w-8 text-warning" /></div>
                  <h3 className="text-xl font-display font-bold text-foreground mb-2">Alternate Time Suggested</h3>
                  <p className="text-muted-foreground text-sm mb-1">Your requested slot is unavailable. We suggest:</p>
                  <p className="font-semibold text-foreground">{selectedDept} · {selectedDate} · 03:00 PM</p>
                  <div className="flex gap-3 justify-center mt-6">
                    <Button variant="hero" onClick={() => setBookingState("confirmed")}>Accept Alternate</Button>
                    <Button variant="outline" onClick={resetBooking}>Try Another</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* --- HISTORY & EMERGENCY TABS REMAIN UNCHANGED --- */}
        {activeTab === "history" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {isLoadingHistory ? (
               <div className="flex justify-center p-8 text-primary animate-pulse">
                 <Loader2 className="h-8 w-8 animate-spin mr-2" />
                 <span className="text-lg font-medium">Fetching records...</span>
               </div>
            ) : (
              <div className="grid gap-3">
                {filteredHistory.map((record) => (
                  <Card key={record.record_id || record.id} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5"><Stethoscope className="h-5 w-5 text-primary" /></div>
                          <div>
                            <p className="font-semibold text-foreground">{record.diagnosis}</p>
                            <p className="text-sm text-muted-foreground">{record.doctor || "General Hospital"} · {record.department || "General"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 md:flex-col md:items-end">
                          <Badge variant="secondary">{record.status || "Completed"}</Badge>
                          <span className="text-xs text-muted-foreground">{record.date}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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