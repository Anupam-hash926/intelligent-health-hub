import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History, CalendarPlus, AlertTriangle, Search, Clock,
  MapPin, Bed, ChevronRight, X, Check, Loader2, FileText,
  Pill, Stethoscope, TrendingUp
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { title: "Medical History", url: "/patient", icon: History },
  { title: "Book Appointment", url: "/patient/appointment", icon: CalendarPlus },
  { title: "Emergency", url: "/patient/emergency", icon: AlertTriangle },
];

// Dummy data
const medicalHistory = [
  { id: 1, date: "2026-02-15", doctor: "Dr. Sarah Chen", department: "Cardiology", diagnosis: "Mild Hypertension", prescription: "Amlodipine 5mg", status: "Completed" },
  { id: 2, date: "2026-01-20", doctor: "Dr. James Wilson", department: "General Medicine", diagnosis: "Seasonal Flu", prescription: "Oseltamivir 75mg", status: "Completed" },
  { id: 3, date: "2025-12-10", doctor: "Dr. Emily Park", department: "Orthopedics", diagnosis: "Lower Back Pain", prescription: "Physiotherapy + Ibuprofen", status: "Follow-up" },
  { id: 4, date: "2025-11-05", doctor: "Dr. Michael Ross", department: "Dermatology", diagnosis: "Eczema", prescription: "Hydrocortisone Cream", status: "Completed" },
  { id: 5, date: "2025-10-18", doctor: "Dr. Sarah Chen", department: "Cardiology", diagnosis: "Routine Checkup", prescription: "None", status: "Completed" },
];

const departments = ["Cardiology", "General Medicine", "Orthopedics", "Dermatology", "Neurology", "Pediatrics"];
const timeSlots = [
  { time: "09:00 AM", demand: "low" },
  { time: "10:00 AM", demand: "high" },
  { time: "11:00 AM", demand: "low" },
  { time: "02:00 PM", demand: "high" },
  { time: "03:00 PM", demand: "low" },
  { time: "04:00 PM", demand: "medium" },
];

const nearbyHospitals = [
  { name: "City General Hospital", distance: "1.2 km", beds: 23, eta: "4 min", rating: 4.8 },
  { name: "St. Mary's Medical Center", distance: "3.5 km", beds: 8, eta: "10 min", rating: 4.6 },
  { name: "Metro Emergency Care", distance: "5.1 km", beds: 45, eta: "15 min", rating: 4.9 },
];

const PatientDashboard = () => {
  const [activeTab, setActiveTab] = useState<"history" | "appointment" | "emergency">("history");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [bookingState, setBookingState] = useState<"idle" | "checking" | "confirmed" | "alternate">("idle");
  const [showEmergencyResults, setShowEmergencyResults] = useState(false);

  const filteredHistory = medicalHistory.filter(
    (h) =>
      h.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingState("checking");
    setTimeout(() => {
      setBookingState(Math.random() > 0.3 ? "confirmed" : "alternate");
    }, 2500);
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
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Welcome back, <span className="text-gradient">Alex</span>
          </h1>
          <p className="text-muted-foreground mt-1">Manage your health records and appointments</p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: FileText, label: "Total Visits", value: "12", color: "text-primary" },
            { icon: CalendarPlus, label: "Upcoming", value: "2", color: "text-accent" },
            { icon: Pill, label: "Active Rx", value: "3", color: "text-warning" },
            { icon: TrendingUp, label: "Health Score", value: "92%", color: "text-success" },
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

        {/* Tab navigation */}
        <div className="flex gap-2 border-b border-border pb-2">
          {[
            { key: "history" as const, label: "Medical History", icon: History },
            { key: "appointment" as const, label: "Book Appointment", icon: CalendarPlus },
            { key: "emergency" as const, label: "Emergency", icon: AlertTriangle },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
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

        {/* Medical History Tab */}
        {activeTab === "history" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Instant search — O(1) retrieval..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid gap-3">
              {filteredHistory.map((record) => (
                <Card key={record.id} className="border-border hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                          <Stethoscope className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{record.diagnosis}</p>
                          <p className="text-sm text-muted-foreground">{record.doctor} · {record.department}</p>
                          <p className="text-xs text-muted-foreground mt-1">Rx: {record.prescription}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 md:flex-col md:items-end">
                        <Badge variant={record.status === "Follow-up" ? "destructive" : "secondary"}>
                          {record.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{record.date}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredHistory.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No records found</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Book Appointment Tab */}
        {activeTab === "appointment" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <AnimatePresence mode="wait">
              {bookingState === "idle" && (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleBookAppointment}
                  className="max-w-2xl space-y-6"
                >
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="text-lg">Schedule New Appointment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="space-y-2">
                        <Label>Department</Label>
                        <select
                          value={selectedDept}
                          onChange={(e) => setSelectedDept(e.target.value)}
                          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                          required
                        >
                          <option value="">Select department...</option>
                          {departments.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Preferred Date</Label>
                        <Input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          min="2026-03-02"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Time Slot</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {timeSlots.map((slot) => (
                            <button
                              key={slot.time}
                              type="button"
                              onClick={() => setSelectedTime(slot.time)}
                              className={`p-3 rounded-lg border text-sm text-left transition-all ${
                                selectedTime === slot.time
                                  ? "border-primary bg-secondary text-primary font-medium"
                                  : "border-border bg-card text-foreground hover:border-primary/40"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{slot.time}</span>
                                <Clock className="h-3 w-3 text-muted-foreground" />
                              </div>
                              <Badge
                                variant="secondary"
                                className={`mt-1 text-[10px] ${
                                  slot.demand === "high"
                                    ? "bg-emergency/10 text-emergency"
                                    : slot.demand === "medium"
                                    ? "bg-warning/10 text-warning"
                                    : "bg-success/10 text-success"
                                }`}
                              >
                                {slot.demand === "high" ? "High Demand" : slot.demand === "medium" ? "Moderate" : "Available"}
                              </Badge>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Reason for Visit</Label>
                        <textarea
                          className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                          placeholder="Describe your symptoms or reason..."
                        />
                      </div>

                      <Button type="submit" variant="hero" size="lg" className="w-full" disabled={!selectedDept || !selectedDate || !selectedTime}>
                        Book Appointment
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.form>
              )}

              {bookingState === "checking" && (
                <motion.div
                  key="checking"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="max-w-md mx-auto text-center py-16"
                >
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-display font-bold text-foreground mb-2">Processing Your Request</h3>
                  <p className="text-muted-foreground text-sm">
                    Checking availability and predicting optimal slot using ML models...
                  </p>
                  <div className="mt-6 space-y-2 text-xs text-muted-foreground">
                    <p className="animate-pulse-soft">→ Running Logistic Regression no-show prediction...</p>
                    <p className="animate-pulse-soft" style={{ animationDelay: "0.5s" }}>→ Checking priority queue for conflicts...</p>
                    <p className="animate-pulse-soft" style={{ animationDelay: "1s" }}>→ Validating ACID transaction...</p>
                  </div>
                </motion.div>
              )}

              {bookingState === "confirmed" && (
                <motion.div
                  key="confirmed"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-md mx-auto text-center py-16"
                >
                  <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-success" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-foreground mb-2">Booking Confirmed!</h3>
                  <p className="text-muted-foreground text-sm">
                    {selectedDept} · {selectedDate} · {selectedTime}
                  </p>
                  <Button variant="outline" className="mt-6" onClick={resetBooking}>
                    Book Another
                  </Button>
                </motion.div>
              )}

              {bookingState === "alternate" && (
                <motion.div
                  key="alternate"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-md mx-auto text-center py-16"
                >
                  <div className="h-16 w-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-warning" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-foreground mb-2">Suggested Alternate Time</h3>
                  <p className="text-muted-foreground text-sm mb-1">
                    Your preferred slot has high no-show risk. We suggest:
                  </p>
                  <p className="font-semibold text-foreground">{selectedDept} · {selectedDate} · 03:00 PM</p>
                  <div className="flex gap-3 justify-center mt-6">
                    <Button variant="hero" onClick={() => setBookingState("confirmed")}>Accept</Button>
                    <Button variant="outline" onClick={resetBooking}>Try Another</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Emergency Tab */}
        {activeTab === "emergency" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <Card className="border-2 border-emergency/30 bg-emergency/5">
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-10 w-10 text-emergency mx-auto mb-3" />
                <h3 className="text-xl font-display font-bold text-foreground mb-2">Emergency Assistance</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Find the nearest hospital with available beds using real-time priority queue routing.
                </p>
                <Button
                  variant="emergency"
                  size="lg"
                  onClick={() => setShowEmergencyResults(true)}
                >
                  <MapPin className="mr-2 h-5 w-5" />
                  Find Nearest Hospital
                </Button>
              </CardContent>
            </Card>

            {showEmergencyResults && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Map placeholder */}
                <Card className="border-border overflow-hidden">
                  <div className="h-48 bg-muted flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_50%,hsl(var(--primary)/0.1),transparent_60%)]" />
                    <div className="text-center">
                      <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Interactive Map — GPS Location Active</p>
                    </div>
                  </div>
                </Card>

                <div className="grid gap-3">
                  {nearbyHospitals.map((hospital, i) => (
                    <Card key={hospital.name} className={`border-border ${i === 0 ? "ring-2 ring-success/50" : ""}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              {i === 0 && <Badge className="bg-success text-success-foreground text-[10px]">Nearest</Badge>}
                              <p className="font-semibold text-foreground">{hospital.name}</p>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{hospital.distance}</span>
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />ETA: {hospital.eta}</span>
                              <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{hospital.beds} beds</span>
                            </div>
                          </div>
                          <Button size="sm" variant={i === 0 ? "default" : "outline"}>
                            Route <ChevronRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
