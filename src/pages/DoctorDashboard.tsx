import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Users, Clock, AlertTriangle, X,
  Stethoscope, FileText, Pill, Activity, ChevronRight
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
  { id: 3, time: "09:30", end: "10:00", patient: "Tom Brown", type: "emergency", dept: "Emergency", reason: "Chest pain — priority routed", age: 58, history: ["Diabetes Type 2 (2020)"], prescriptions: ["Metformin 500mg"] },
  { id: 4, time: "10:30", end: "11:00", patient: "Lisa White", type: "routine", dept: "General", reason: "Prescription renewal", age: 34, history: ["Asthma (2019)"], prescriptions: ["Albuterol inhaler"] },
  { id: 5, time: "11:00", end: "11:30", patient: "Robert Kim", type: "routine", dept: "Dermatology", reason: "Skin rash evaluation", age: 28, history: ["Eczema (2025)"], prescriptions: ["Hydrocortisone cream"] },
  { id: 6, time: "13:00", end: "13:30", patient: "Sarah Johnson", type: "emergency", dept: "Emergency", reason: "Severe migraine — priority routed", age: 41, history: ["Chronic migraines (2022)"], prescriptions: ["Sumatriptan 50mg"] },
  { id: 7, time: "14:00", end: "14:30", patient: "David Chen", type: "routine", dept: "Orthopedics", reason: "Post-surgery follow-up", age: 55, history: ["Knee replacement (2025)"], prescriptions: ["Celecoxib 200mg"] },
  { id: 8, time: "15:00", end: "15:30", patient: "Emily Park", type: "routine", dept: "General", reason: "Blood work review", age: 39, history: ["Anemia (2025)"], prescriptions: ["Ferrous sulfate 325mg"] },
];

const DoctorDashboard = () => {
  const [selectedSlot, setSelectedSlot] = useState<typeof schedule[0] | null>(null);

  const routineCount = schedule.filter(s => s.type === "routine").length;
  const emergencyCount = schedule.filter(s => s.type === "emergency").length;

  return (
    <DashboardLayout navItems={navItems} role="Doctor">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Good Morning, <span className="text-gradient">Dr. Chen</span>
          </h1>
          <p className="text-muted-foreground mt-1">Today's schedule — March 2, 2026</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Calendar, label: "Total Appointments", value: schedule.length.toString(), color: "text-primary" },
            { icon: Stethoscope, label: "Routine", value: routineCount.toString(), color: "text-accent" },
            { icon: AlertTriangle, label: "Emergency", value: emergencyCount.toString(), color: "text-emergency" },
            { icon: Clock, label: "Next Free", value: "12:00 PM", color: "text-success" },
          ].map((stat) => (
            <Card key={stat.label} className="border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Timeline */}
          <div className="flex-1 space-y-3">
            <h2 className="text-lg font-display font-bold text-foreground">Daily Timeline</h2>
            <div className="space-y-2">
              {schedule.map((slot) => (
                <motion.div
                  key={slot.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setSelectedSlot(slot)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    selectedSlot?.id === slot.id
                      ? "border-primary bg-secondary/50 shadow-md"
                      : "border-border bg-card hover:border-primary/30"
                  } ${slot.type === "emergency" ? "border-l-4 border-l-emergency" : "border-l-4 border-l-accent"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-center shrink-0 w-16">
                        <p className="text-sm font-bold text-foreground">{slot.time}</p>
                        <p className="text-[10px] text-muted-foreground">{slot.end}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{slot.patient}</p>
                          {slot.type === "emergency" && (
                            <Badge className="bg-emergency/10 text-emergency text-[10px]">
                              <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                              URGENT
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{slot.reason}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Patient Quick-View Panel */}
          <AnimatePresence>
            {selectedSlot && (
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                className="lg:w-96 shrink-0"
              >
                <Card className="border-border sticky top-6">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Patient Summary</CardTitle>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedSlot(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{selectedSlot.patient}</p>
                        <p className="text-sm text-muted-foreground">Age: {selectedSlot.age} · {selectedSlot.dept}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Visit Reason</p>
                      <p className="text-sm text-foreground bg-secondary p-3 rounded-lg">{selectedSlot.reason}</p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Medical History
                      </p>
                      <div className="space-y-1.5">
                        {selectedSlot.history.map((h) => (
                          <p key={h} className="text-sm text-foreground bg-muted p-2 rounded-md">{h}</p>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Pill className="h-3 w-3" /> Current Prescriptions
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedSlot.prescriptions.map((p) => (
                          <Badge key={p} variant="secondary">{p}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Activity className="h-3 w-3" /> Vitals (Last Recorded)
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: "BP", value: "120/80" },
                          { label: "HR", value: "72 bpm" },
                          { label: "Temp", value: "98.6°F" },
                          { label: "SpO2", value: "98%" },
                        ].map((v) => (
                          <div key={v.label} className="bg-muted p-2 rounded-md text-center">
                            <p className="text-xs text-muted-foreground">{v.label}</p>
                            <p className="text-sm font-semibold text-foreground">{v.value}</p>
                          </div>
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

export default DoctorDashboard;
