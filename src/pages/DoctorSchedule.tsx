import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Users, AlertTriangle, X,
  Stethoscope, FileText, Pill, Activity, Clock
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Schedule", url: "/doctor", icon: Calendar },
  { title: "Patients", url: "/doctor/patients", icon: Users },
];

const schedule = [
  { id: 1, time: "08:00", end: "08:30", patient: "John Davis", type: "routine", dept: "General", reason: "Annual checkup", age: 45, history: ["Hypertension (2024)", "Flu (2025)"], prescriptions: ["Lisinopril 10mg"] },
  { id: 2, time: "09:00", end: "09:30", patient: "Maria Garcia", type: "routine", dept: "Cardiology", reason: "Follow-up ECG", age: 62, history: ["Arrhythmia (2023)", "Stent placement (2024)"], prescriptions: ["Aspirin 81mg", "Metoprolol 25mg"] },
  { id: 3, time: "09:30", end: "10:30", patient: "Tom Brown", type: "emergency", dept: "Emergency", reason: "Chest pain — priority", age: 58, history: ["Diabetes Type 2 (2020)"], prescriptions: ["Metformin 500mg"] },
  { id: 4, time: "10:30", end: "11:00", patient: "Lisa White", type: "routine", dept: "General", reason: "Prescription renewal", age: 34, history: ["Asthma (2019)"], prescriptions: ["Albuterol inhaler"] },
  { id: 5, time: "11:00", end: "11:30", patient: "Robert Kim", type: "routine", dept: "Dermatology", reason: "Skin rash evaluation", age: 28, history: ["Eczema (2025)"], prescriptions: ["Hydrocortisone cream"] },
  { id: 6, time: "13:00", end: "14:00", patient: "Sarah Johnson", type: "emergency", dept: "Emergency", reason: "Severe migraine", age: 41, history: ["Chronic migraines (2022)"], prescriptions: ["Sumatriptan 50mg"] },
  { id: 7, time: "14:00", end: "14:30", patient: "David Chen", type: "routine", dept: "Orthopedics", reason: "Post-surgery follow-up", age: 55, history: ["Knee replacement (2025)"], prescriptions: ["Celecoxib 200mg"] },
  { id: 8, time: "15:00", end: "15:30", patient: "Emily Park", type: "routine", dept: "General", reason: "Blood work review", age: 39, history: ["Anemia (2025)"], prescriptions: ["Ferrous sulfate 325mg"] },
];

// Calendar Configuration
const START_HOUR = 7; // 7 AM
const END_HOUR = 18; // 6 PM
const HOUR_HEIGHT = 96; // 96px per hour row (h-24)

const parseTime = (timeStr: string) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h + (m / 60);
};

const DoctorSchedule = () => {
  const [selectedSlot, setSelectedSlot] = useState<typeof schedule[0] | null>(null);

  // Mock current time for the red line (e.g., 3:40 PM = 15.66)
  const currentTimeVal = 15.66; 

  return (
    <DashboardLayout navItems={navItems} role="Doctor">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Schedule, <span className="text-gradient">Dr. Chen</span>
          </h1>
          <p className="text-muted-foreground mt-1">Daily View — March 2, 2026</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Calendar Area */}
          <div className="flex-1 w-full bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="bg-muted/50 p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Today's Appointments
              </h2>
            </div>
            
            <div className="relative overflow-y-auto" style={{ maxHeight: '70vh' }}>
              {/* Grid Background */}
              {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => {
                const hour = START_HOUR + i;
                const displayHour = hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
                return (
                  <div key={hour} className="flex h-24 border-b border-border/40 last:border-0 relative">
                    <div className="w-16 flex-shrink-0 border-r border-border/40 pr-3 pt-2 text-right">
                      <span className="text-[11px] font-medium text-muted-foreground">{displayHour}</span>
                    </div>
                    <div className="flex-1" />
                  </div>
                );
              })}

              {/* Current Time Indicator (Red Line) */}
              {currentTimeVal >= START_HOUR && currentTimeVal <= END_HOUR && (
                <div 
                  className="absolute left-16 right-0 border-t-2 border-red-500 z-20 pointer-events-none" 
                  style={{ top: `${(currentTimeVal - START_HOUR) * HOUR_HEIGHT}px` }}
                >
                  <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
                </div>
              )}

              {/* Appointments Overlay */}
              <div className="absolute top-0 left-16 right-0 bottom-0 pointer-events-none">
                {schedule.map((slot) => {
                  const startVal = parseTime(slot.time);
                  const endVal = parseTime(slot.end);
                  const top = (startVal - START_HOUR) * HOUR_HEIGHT;
                  const height = (endVal - startVal) * HOUR_HEIGHT;
                  
                  const isEmergency = slot.type === "emergency";
                  const isSelected = selectedSlot?.id === slot.id;

                  return (
                    <div
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      className={`absolute left-2 right-4 rounded-md p-2 text-xs border cursor-pointer pointer-events-auto transition-all shadow-sm overflow-hidden
                        ${isEmergency 
                          ? 'bg-emergency/10 border-emergency/30 text-emergency-foreground hover:bg-emergency/20' 
                          : 'bg-primary/10 border-primary/30 text-primary-foreground hover:bg-primary/20'}
                        ${isSelected ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}
                      `}
                      style={{ top: `${top}px`, height: `${height}px` }}
                    >
                      <div className="font-semibold truncate">{slot.patient}</div>
                      <div className="text-[10px] opacity-80 truncate">{slot.time} - {slot.end}</div>
                      {height >= 48 && <div className="text-[10px] mt-1 opacity-90 truncate">{slot.reason}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Patient Quick-View Panel */}
          <AnimatePresence>
            {selectedSlot && (
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                className="w-full lg:w-[350px] shrink-0 sticky top-6"
              >
                <Card className="border-border shadow-md">
                  <CardHeader className="pb-3 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Appointment Details</CardTitle>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedSlot(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${selectedSlot.type === 'emergency' ? 'bg-emergency/20 text-emergency' : 'bg-primary/20 text-primary'}`}>
                        <Users className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-lg">{selectedSlot.patient}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedSlot.time} - {selectedSlot.end} · {selectedSlot.dept}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Visit Reason</p>
                      <div className={`p-3 rounded-lg text-sm font-medium ${selectedSlot.type === 'emergency' ? 'bg-emergency/10 text-emergency border border-emergency/20' : 'bg-secondary text-foreground'}`}>
                        {selectedSlot.reason}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Medical History
                      </p>
                      <div className="space-y-1.5">
                        {selectedSlot.history.map((h) => (
                          <p key={h} className="text-xs text-foreground bg-muted p-2 rounded-md">{h}</p>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Pill className="h-3 w-3" /> Current Prescriptions
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedSlot.prescriptions.map((p) => (
                          <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorSchedule;