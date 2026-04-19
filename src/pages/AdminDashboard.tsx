import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BedDouble, Users, Stethoscope, Brain,
  Loader2, Check, Plus, Edit, Trash2, X, Search, AlertCircle,
  ShieldAlert, AlertTriangle, Clock, Database, Filter
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const navItems = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard },
  { title: "AI Triage", url: "/admin/triage", icon: Brain }, 
  { title: "Bed Management", url: "/admin/beds", icon: BedDouble },
  { title: "Directory", url: "/admin/directory", icon: Users },
  { title: "Global Records", url: "/admin/records", icon: Database },
];

const dummyDoctors = [
  { id: 1, name: "Dr. Sarah Chen", dept: "Cardiology", email: "schen@med.com", phone: "+1-555-0101", status: "Active" },
  { id: 2, name: "Dr. James Wilson", dept: "General Medicine", email: "jwilson@med.com", phone: "+1-555-0102", status: "Active" },
  { id: 3, name: "Dr. Emily Park", dept: "Orthopedics", email: "epark@med.com", phone: "+1-555-0103", status: "On Leave" },
  { id: 4, name: "Dr. Michael Ross", dept: "Dermatology", email: "mross@med.com", phone: "+1-555-0104", status: "Active" },
];

const dummyPatients = [
  { id: 1, name: "John Davis", dept: "Cardiology", age: 45, email: "jdavis@mail.com", phone: "+1-555-0201", status: "Active" },
  { id: 2, name: "Maria Garcia", dept: "Cardiology", age: 62, email: "mgarcia@mail.com", phone: "+1-555-0202", status: "Admitted" },
  { id: 3, name: "Tom Brown", dept: "Emergency", age: 58, email: "tbrown@mail.com", phone: "+1-555-0203", status: "Critical" },
];

const allDepartments = ["Cardiology", "General Medicine", "Orthopedics", "Dermatology", "Neurology", "Pediatrics", "Emergency"];

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "triage" | "beds" | "directory" | "records">("overview");
  
  // --- EXISTING STATES ---
  const [beds, setBeds] = useState<any[]>([]); 
  const [dbError, setDbError] = useState<string | null>(null);
  const [allocatingBed, setAllocatingBed] = useState<number | null>(null);
  const [selectedBedForAllocation, setSelectedBedForAllocation] = useState<number | null>(null);
  const [allocateForm, setAllocateForm] = useState({ patientId: "" });
  const [directoryTab, setDirectoryTab] = useState<"patients" | "doctors">("patients");
  const [searchDir, setSearchDir] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [doctors, setDoctors] = useState(dummyDoctors);
  const [patients, setPatients] = useState(dummyPatients);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", department: "", age: "", status: "Active" });
  const [appointments, setAppointments] = useState<any[]>([]);

  // --- UPDATED: GLOBAL RECORDS SEARCH STATES ---
  const [records, setRecords] = useState<any[]>([]);
  const [searchName, setSearchName] = useState(""); 
  const [searchMonths, setSearchMonths] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Fetch ML Appointments
  const fetchAppointments = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${API_BASE}/api/admin/appointments`);
      const data = await res.json();
      if (data.status === "success") {
        setAppointments(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch appointments", err);
    }
  };

  // --- UPDATED: Handle Search Function ---
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearching(true);
    
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      let url = `${API_BASE}/api/admin/records?`;
      const params = new URLSearchParams();
      
      if (searchName) params.append("name", searchName.trim());
      if (searchMonths) params.append("months", searchMonths);
      
      const fullUrl = url + params.toString();
      
      const res = await fetch(fullUrl);
      const data = await res.json();
      
      if (data.status === "success") {
        setRecords(data.data);
      } else {
        toast.error("Failed to fetch data from server.");
      }
    } catch (err) {
      console.error("SEARCH ERROR:", err); 
      toast.error("Failed to search hospital records.");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/beds")) {
      setActiveTab("beds");
    } else if (path.includes("/directory")) {
      setActiveTab("directory");
    } else if (path.includes("/triage")) {
      setActiveTab("triage");
    } else if (path.includes("/records")) {
      setActiveTab("records");
    } else {
      setActiveTab("overview");
    }
  }, [location.pathname]);

  const fetchLiveBeds = async () => {
    try {
      setDbError(null);
      const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${API_BASE}/api/beds/status`);
      if (response.ok) {
        const liveData = await response.json();
        setBeds(liveData); 
      } else {
        setDbError(`Backend returned error code: ${response.status}. Check your Python console.`);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setDbError("Failed to connect to the Python backend. Is uvicorn running?");
    }
  };

  useEffect(() => {
    fetchLiveBeds();
    fetchAppointments(); // Fetch AI appointments on load
    handleSearch(); // Fetch all records on initial load
  }, []);

  const handleTriageAction = async (appointmentId: number, actionType: "confirm" | "double_book" | "dismiss") => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      await fetch(`${API_BASE}/api/admin/appointments/${appointmentId}/action`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionType }),
      });
      fetchAppointments();
    } catch (err) {
      console.error("Action failed", err);
    }
  };

  const totalPatients = patients.length;
  const availableDoctors = doctors.filter(d => d.status === "Active").length;
  const freeBeds = beds.filter(b => !b.occupied).length;
  const getDeptCount = (dept: string, list: { dept: string }[]) => list.filter(i => i.dept === dept).length;

  const handleAllocate = async (bedId: number) => {
    setAllocatingBed(bedId);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${API_BASE}/api/beds/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bed_id: bedId,
          patient_id: parseInt(allocateForm.patientId) || 999 
        })
      });
      const result = await response.json();
      if (response.ok) {
        fetchLiveBeds(); 
      } else {
        alert(`Allocation Failed: ${result.detail}`);
      }
    } catch (error) {
      alert("Network error.");
    } finally {
      setAllocatingBed(null);
      setAllocateForm({ patientId: "" });
      setSelectedBedForAllocation(null);
    }
  };

  const handleDeallocate = async (bedId: number) => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${API_BASE}/api/beds/release/${bedId}`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchLiveBeds(); 
      }
    } catch (error) {
      console.error("Release error:", error);
    }
  };

  const handleAddOrEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.department) return;
    if (editingId !== null) {
      if (directoryTab === "patients") {
        setPatients(patients.map(p => p.id === editingId ? { ...p, name: formData.name, email: formData.email, phone: formData.phone, dept: formData.department, age: parseInt(formData.age) || 0, status: formData.status } : p));
      } else {
        setDoctors(doctors.map(d => d.id === editingId ? { ...d, name: formData.name, email: formData.email, phone: formData.phone, dept: formData.department, status: formData.status } : d));
      }
      setEditingId(null);
    } else {
      const newId = Math.max(...(directoryTab === "patients" ? patients : doctors).map(i => i.id), 0) + 1;
      if (directoryTab === "patients") {
        setPatients([...patients, { id: newId, name: formData.name, email: formData.email, phone: formData.phone, dept: formData.department, age: parseInt(formData.age) || 0, status: formData.status }]);
      } else {
        setDoctors([...doctors, { id: newId, name: formData.name, email: formData.email, phone: formData.phone, dept: formData.department, status: formData.status }]);
      }
    }
    setFormData({ name: "", email: "", phone: "", department: "", age: "", status: "Active" });
    setShowAddForm(false);
  };

  const handleDelete = (id: number) => {
    if (directoryTab === "patients") {
      setPatients(patients.filter(p => p.id !== id));
    } else {
      setDoctors(doctors.filter(d => d.id !== id));
    }
  };

  const handleEdit = (id: number) => {
    const item = directoryTab === "patients" ? patients.find(p => p.id === id) : doctors.find(d => d.id === id);
    if (item) {
      setFormData({ name: item.name, email: item.email, phone: item.phone, department: item.dept, age: "age" in item ? (item as any).age.toString() : "", status: item.status });
      setEditingId(id);
      setShowAddForm(true);
    }
  };

  const filteredDoctors = doctors.filter(d => (selectedDept === "All" || d.dept === selectedDept) && d.name.toLowerCase().includes(searchDir.toLowerCase()));
  const filteredPatients = patients.filter(p => (selectedDept === "All" || p.dept === selectedDept) && p.name.toLowerCase().includes(searchDir.toLowerCase()));

  return (
    <DashboardLayout navItems={navItems} role="Admin">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Admin <span className="text-gradient">Command Center</span>
          </h1>
          <p className="text-muted-foreground mt-1">System-wide monitoring and resource management</p>
        </div>

        <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto">
          {[
            { key: "overview" as const, label: "Overview", icon: LayoutDashboard, path: "/admin" },
            { key: "triage" as const, label: "AI Triage", icon: Brain, path: "/admin/triage" }, 
            { key: "beds" as const, label: "Bed Management", icon: BedDouble, path: "/admin/beds" },
            { key: "directory" as const, label: "Master Directory", icon: Users, path: "/admin/directory" },
            { key: "records" as const, label: "Global Records", icon: Database, path: "/admin/records" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => navigate(tab.path)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.key ? "bg-card text-primary border border-border border-b-0" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Users, label: "Total Patients", value: totalPatients.toString(), color: "text-primary" },
                { icon: Stethoscope, label: "Available Doctors", value: availableDoctors.toString(), color: "text-accent" },
                { icon: BedDouble, label: "Free Beds", value: `${freeBeds}/${beds.length}`, color: "text-success" },
                { icon: Brain, label: "Pending AI Triage", value: appointments.length.toString(), color: "text-warning", special: true }, 
              ].map((stat) => (
                <Card key={stat.label} className={`border-border ${stat.special ? "ring-1 ring-warning/30" : ""}`}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${stat.special ? "bg-warning/10" : "bg-secondary"}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      {stat.special && <p className="text-[10px] text-warning font-medium">Needs Review</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Department Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {allDepartments.map(dept => (
                    <div key={dept} className="bg-muted rounded-lg p-3">
                      <p className="font-semibold text-sm text-foreground">{dept}</p>
                      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>{getDeptCount(dept, dummyDoctors)} doctors</span>
                        <span>{getDeptCount(dept, dummyPatients)} patients</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* TRIAGE TAB */}
        {activeTab === "triage" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
             {appointments.length === 0 ? (
               <Card className="border-border border-dashed bg-muted/30">
                 <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Check className="h-12 w-12 text-success/50 mb-4" />
                    <h3 className="text-xl font-display font-bold text-foreground mb-2">You're all caught up!</h3>
                    <p className="text-muted-foreground">No pending appointments require ML triage review right now.</p>
                 </CardContent>
               </Card>
             ) : (
              <div className="grid gap-4">
                {appointments.map((apt) => (
                  <Card key={apt.appointment_id} className="border-border overflow-hidden">
                    <div className={`h-1 w-full ${apt.no_show_risk > 50 ? 'bg-destructive' : apt.no_show_risk > 20 ? 'bg-warning' : 'bg-success'}`} />
                    <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-foreground">{apt.full_name || "Unknown Patient"}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            <span>{apt.appointment_time}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Stethoscope className="h-4 w-4" />
                            <span>Dr. {apt.doctor_name || apt.doctor_id}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-start md:items-center md:px-8 md:border-x border-border">
                        <span className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">AI No-Show Risk</span>
                        {apt.no_show_risk > 50 ? (
                          <Badge variant="destructive" className="px-3 py-1 text-sm bg-destructive/10 text-destructive border-destructive/20">
                            <ShieldAlert className="h-4 w-4 mr-1" /> {apt.no_show_risk}% High Risk
                          </Badge>
                        ) : apt.no_show_risk > 20 ? (
                          <Badge variant="warning" className="px-3 py-1 text-sm bg-warning/10 text-warning border-warning/20">
                            <AlertTriangle className="h-4 w-4 mr-1" /> {apt.no_show_risk}% Medium Risk
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="px-3 py-1 text-sm bg-success/10 text-success border-success/20">
                            <Check className="h-4 w-4 mr-1" /> {apt.no_show_risk || 0}% Safe
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-2">
                        <Button size="sm" variant="outline" className="border-success text-success hover:bg-success/10" onClick={() => handleTriageAction(apt.appointment_id, "confirm")}>
                          Confirm Slot
                        </Button>
                        <Button size="sm" variant="outline" className="border-warning text-warning hover:bg-warning/10" onClick={() => handleTriageAction(apt.appointment_id, "double_book")}>
                          Double Book
                        </Button>
                        <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => handleTriageAction(apt.appointment_id, "dismiss")}>
                          Dismiss
                        </Button>
                      </div>

                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* --- UPDATED: GLOBAL RECORDS TAB --- */}
        {activeTab === "records" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            
            <Card className="border-border shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="w-full sm:flex-1 space-y-2">
                    <Label>Search by Patient or Doctor Name</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="e.g. 'Sarah' or 'Davis'" 
                        className="pl-9"
                        value={searchName} 
                        onChange={(e) => setSearchName(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="w-full sm:w-56 space-y-2">
                    <Label>Timeframe</Label>
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <select 
                        value={searchMonths}
                        onChange={(e) => setSearchMonths(e.target.value)}
                        className="w-full h-10 rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                      >
                        <option value="">All Time</option>
                        <option value="upcoming">Upcoming/Future</option>
                        <option value="1">Past 1 Month</option>
                        <option value="6">Past 6 Months</option>
                        <option value="12">Past 1 Year</option>
                      </select>
                    </div>
                  </div>

                  <Button type="submit" disabled={isSearching} className="w-full sm:w-auto px-8">
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Search"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-border overflow-hidden">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-xs sticky top-0 shadow-sm z-10">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Patient Name</th>
                      <th className="px-6 py-4 font-semibold">Phone</th>
                      <th className="px-6 py-4 font-semibold">Date & Time</th>
                      <th className="px-6 py-4 font-semibold">Assigned Doctor</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {records.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                          No appointment records found matching those filters.
                        </td>
                      </tr>
                    ) : (
                      records.map((record) => (
                        <tr key={record.appointment_id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4 font-medium text-foreground">{record.patient_name}</td>
                          <td className="px-6 py-4 text-muted-foreground">{record.phone}</td>
                          <td className="px-6 py-4 text-muted-foreground">{record.appointment_time}</td>
                          <td className="px-6 py-4 text-muted-foreground">{record.doctor_name}</td>
                          <td className="px-6 py-4">
                            <Badge variant={record.status === 'completed' ? 'default' : record.status === 'reschedule_requested' ? 'destructive' : 'secondary'}>
                              {record.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

          </motion.div>
        )}

        {/* BEDS TAB */}
        {activeTab === "beds" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            
            {dbError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3">
                <AlertCircle className="h-6 w-6" />
                <div>
                  <h3 className="font-bold">Database Connection Failed</h3>
                  <p className="text-sm">{dbError}</p>
                </div>
              </div>
            )}

            {!dbError && beds.length === 0 && (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Loading real-time beds from PostgreSQL...</p>
              </div>
            )}

            {["ICU", "General", "Emergency"].map(ward => {
              const wardBeds = beds.filter(b => b.ward === ward);
              const wardFree = wardBeds.filter(b => !b.occupied).length;
              if (wardBeds.length === 0) return null;

              return (
                <Card key={ward} className="border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{ward} Ward</CardTitle>
                      <Badge variant="secondary">{wardFree}/{wardBeds.length} Available</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                      {wardBeds.map(bed => (
                        <div
                          key={bed.id}
                          className={`relative group rounded-lg p-3 text-center text-xs border transition-all ${
                            bed.occupied ? "bg-emergency/10 border-emergency/30 text-emergency" : "bg-success/10 border-success/30 text-success cursor-pointer hover:bg-success/20"
                          }`}
                          onClick={() => !bed.occupied && setSelectedBedForAllocation(bed.id)}
                        >
                          <BedDouble className="h-5 w-5 mx-auto mb-1" />
                          <p className="font-bold">#{bed.id}</p>
                          {bed.occupied ? (
                            <div>
                              <p className="text-[9px] truncate text-foreground font-semibold">Pt. ID: {bed.patient}</p>
                              <Button size="sm" variant="ghost" className="h-5 text-[10px] text-emergency mt-1 p-0" onClick={() => handleDeallocate(bed.id)}>Release</Button>
                            </div>
                          ) : selectedBedForAllocation === bed.id ? (
                            <div className="mt-1">
                              {allocatingBed === bed.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mx-auto text-primary" />
                              ) : (
                                <div className="space-y-1">
                                  <Input type="number" placeholder="ID" className="h-5 text-[10px] px-1" value={allocateForm.patientId} onChange={(e) => setAllocateForm({ patientId: e.target.value })} onClick={(e) => e.stopPropagation()} />
                                  <Button size="sm" className="h-5 text-[10px] w-full p-0" onClick={() => handleAllocate(bed.id)}>Allocate</Button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-[10px] text-muted-foreground mt-1">Click to add</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>
        )}

        {/* DIRECTORY TAB */}
        {activeTab === "directory" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex gap-2">
                <Button variant={directoryTab === "patients" ? "default" : "outline"} size="sm" onClick={() => { setDirectoryTab("patients"); setSearchDir(""); setSelectedDept("All"); }}>
                  <Users className="h-4 w-4 mr-1" /> Patients ({patients.length})
                </Button>
                <Button variant={directoryTab === "doctors" ? "default" : "outline"} size="sm" onClick={() => { setDirectoryTab("doctors"); setSearchDir(""); setSelectedDept("All"); }}>
                  <Stethoscope className="h-4 w-4 mr-1" /> Doctors ({doctors.length})
                </Button>
              </div>
              <Button size="sm" onClick={() => { setShowAddForm(!showAddForm); setEditingId(null); setFormData({ name: "", email: "", phone: "", department: "", age: "", status: "Active" }); }}>
                <Plus className="h-4 w-4 mr-1" /> Add {directoryTab === "patients" ? "Patient" : "Doctor"}
              </Button>
            </div>

            {showAddForm && (
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{editingId ? "Edit" : "Add New"} {directoryTab === "patients" ? "Patient" : "Doctor"}</CardTitle>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setShowAddForm(false); setEditingId(null); setFormData({ name: "", email: "", phone: "", department: "", age: "", status: "Active" }); }}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <form className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3" onSubmit={handleAddOrEdit}>
                    <div className="space-y-1">
                      <Label className="text-xs">Full Name</Label>
                      <Input placeholder="Enter name..." className="h-8 text-sm" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Email</Label>
                      <Input type="email" placeholder="email@example.com" className="h-8 text-sm" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Phone</Label>
                      <Input placeholder="+1-555-..." className="h-8 text-sm" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Department</Label>
                      <select className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} required>
                        <option value="">Select department...</option>
                        {allDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    {directoryTab === "patients" && (
                      <div className="space-y-1">
                        <Label className="text-xs">Age</Label>
                        <Input type="number" placeholder="Age" className="h-8 text-sm" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} />
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label className="text-xs">Status</Label>
                      <select className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                        <option value="Active">Active</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Admitted">Admitted</option>
                        <option value="Discharged">Discharged</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" size="sm" className="w-full">
                        <Check className="h-3 w-3 mr-1" /> {editingId ? "Update" : "Save"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-9 h-9" value={searchDir} onChange={(e) => setSearchDir(e.target.value)} />
              </div>
              <select className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground" value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                <option value="All">All Departments</option>
                {allDepartments.map(d => <option key={d} value={d}>{d} ({getDeptCount(d, directoryTab === "patients" ? patients : doctors)})</option>)}
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              {allDepartments.map(dept => {
                const count = getDeptCount(dept, directoryTab === "patients" ? patients : doctors);
                if (count === 0) return null;
                return (
                  <Badge key={dept} variant="secondary" className={`cursor-pointer ${selectedDept === dept ? "bg-primary text-primary-foreground" : ""}`} onClick={() => setSelectedDept(selectedDept === dept ? "All" : dept)}>
                    {dept}: {count}
                  </Badge>
                );
              })}
            </div>

            <Card className="border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-3 font-semibold text-muted-foreground">Name</th>
                      <th className="text-left p-3 font-semibold text-muted-foreground">Department</th>
                      <th className="text-left p-3 font-semibold text-muted-foreground hidden md:table-cell">Email</th>
                      <th className="text-left p-3 font-semibold text-muted-foreground hidden sm:table-cell">Phone</th>
                      {directoryTab === "patients" && <th className="text-left p-3 font-semibold text-muted-foreground">Age</th>}
                      <th className="text-left p-3 font-semibold text-muted-foreground">Status</th>
                      <th className="text-right p-3 font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(directoryTab === "patients" ? filteredPatients : filteredDoctors).map((item) => (
                      <tr key={item.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-medium text-foreground">{item.name}</td>
                        <td className="p-3 text-muted-foreground">{item.dept}</td>
                        <td className="p-3 text-muted-foreground hidden md:table-cell">{item.email}</td>
                        <td className="p-3 text-muted-foreground hidden sm:table-cell">{item.phone}</td>
                        {directoryTab === "patients" && <td className="p-3 text-muted-foreground">{"age" in item ? (item as { age: number }).age : ""}</td>}
                        <td className="p-3">
                          <Badge variant={item.status === "Active" ? "secondary" : item.status === "Critical" ? "destructive" : item.status === "Admitted" ? "default" : "outline"} className="text-[10px]">
                            {item.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(item.id)}><Edit className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;