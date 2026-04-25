import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { Users, Clock, CheckCircle, Phone, CalendarHeart, Calendar as CalendarIcon, Droplet } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// These match the IDs from your Supabase Database!
const doctorsList = [
  { id: "1", name: "Dr. Sarah Chen", dept: "Cardiology" },
  { id: "2", name: "Dr. James Wilson", dept: "General Medicine" },
  { id: "3", name: "Dr. Emily Park", dept: "Orthopedics" },
  { id: "4", name: "Dr. Michael Ross", dept: "Dermatology" },
  { id: "5", name: "Dr. Robert Lee", dept: "Neurology" },
  { id: "6", name: "Dr. Amanda Smith", dept: "Pediatrics" },
];

const DoctorDashboard = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  
  // Simulated Auth: Defaulting to Doctor 1 (Sarah Chen)
  const [currentDoctorId, setCurrentDoctorId] = useState("1"); 

  const fetchAppointments = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/doctors/${currentDoctorId}/appointments`);
      const data = await res.json();
      if (data.status === "success") {
        setAppointments(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch doctor appointments", err);
    }
  };

  // EVERY time you change the dropdown, it fetches that specific doctor's schedule!
  useEffect(() => {
    fetchAppointments();
  }, [currentDoctorId]); 

  const handleComplete = async (appointmentId: number) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/doctors/appointments/${appointmentId}/complete`, {
        method: "PUT",
      });
      fetchAppointments();
    } catch (err) {
      console.error("Failed to complete appointment", err);
    }
  };

  const currentDoctor = doctorsList.find(d => d.id === currentDoctorId);

  return (
    <DashboardLayout navItems={[{ title: "My Schedule", url: "/doctor", icon: CalendarHeart }]} role="Doctor">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* HEADER & DOCTOR SWITCHER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              <span className="text-primary">{currentDoctor?.name}'s</span> Schedule
            </h1>
            <p className="text-muted-foreground mt-1">Department of {currentDoctor?.dept}</p>
          </div>

          {/* SIMULATED LOGIN DROPDOWN */}
          <div className="flex flex-col gap-1.5 w-full md:w-auto">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Simulate Login As:</label>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground font-medium focus:ring-2 focus:ring-primary outline-none"
              value={currentDoctorId}
              onChange={(e) => setCurrentDoctorId(e.target.value)}
            >
              {doctorsList.map(doc => (
                <option key={doc.id} value={doc.id}>{doc.name} ({doc.dept})</option>
              ))}
            </select>
          </div>
        </div>

        {/* AGENDA / CALENDAR TIMELINE VIEW */}
        <div className="grid gap-6 mt-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Today's Consultations</h2>
          </div>

          {appointments.length === 0 ? (
            <Card className="border-border border-dashed bg-muted/30">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle className="h-12 w-12 text-success/50 mb-4" />
                <h3 className="text-xl font-display font-bold text-foreground mb-2">Schedule is clear!</h3>
                <p className="text-muted-foreground">No pending appointments for {currentDoctor?.dept} right now.</p>
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
                          {/* Phone Number */}
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" /> {apt.phone}
                          </div>
                          
                          {/* Blood Group Display */}
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
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;