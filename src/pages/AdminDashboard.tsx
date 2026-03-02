import { useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard, BedDouble, Users, Stethoscope, Brain,
  Loader2, Check, Plus, Edit, Trash2, X, Search
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const navItems = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard },
  { title: "Bed Management", url: "/admin/beds", icon: BedDouble },
  { title: "Directory", url: "/admin/directory", icon: Users },
];

// Dummy beds
const initialBeds = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  ward: i < 8 ? "ICU" : i < 16 ? "General" : "Emergency",
  occupied: Math.random() > 0.45,
  patient: Math.random() > 0.45 ? `Patient-${100 + i}` : null,
}));

const dummyDoctors = [
  { id: 1, name: "Dr. Sarah Chen", dept: "Cardiology", email: "schen@med.com", phone: "+1-555-0101", status: "Active" },
  { id: 2, name: "Dr. James Wilson", dept: "General Medicine", email: "jwilson@med.com", phone: "+1-555-0102", status: "Active" },
  { id: 3, name: "Dr. Emily Park", dept: "Orthopedics", email: "epark@med.com", phone: "+1-555-0103", status: "On Leave" },
  { id: 4, name: "Dr. Michael Ross", dept: "Dermatology", email: "mross@med.com", phone: "+1-555-0104", status: "Active" },
  { id: 5, name: "Dr. Aisha Patel", dept: "Neurology", email: "apatel@med.com", phone: "+1-555-0105", status: "Active" },
  { id: 6, name: "Dr. Robert Kim", dept: "Pediatrics", email: "rkim@med.com", phone: "+1-555-0106", status: "Active" },
  { id: 7, name: "Dr. Laura Martinez", dept: "Cardiology", email: "lmartinez@med.com", phone: "+1-555-0107", status: "Active" },
];

const dummyPatients = [
  { id: 1, name: "John Davis", dept: "Cardiology", age: 45, email: "jdavis@mail.com", phone: "+1-555-0201", status: "Active" },
  { id: 2, name: "Maria Garcia", dept: "Cardiology", age: 62, email: "mgarcia@mail.com", phone: "+1-555-0202", status: "Admitted" },
  { id: 3, name: "Tom Brown", dept: "Emergency", age: 58, email: "tbrown@mail.com", phone: "+1-555-0203", status: "Critical" },
  { id: 4, name: "Lisa White", dept: "General Medicine", age: 34, email: "lwhite@mail.com", phone: "+1-555-0204", status: "Active" },
  { id: 5, name: "Robert Kim", dept: "Dermatology", age: 28, email: "rkim2@mail.com", phone: "+1-555-0205", status: "Active" },
  { id: 6, name: "Sarah Johnson", dept: "Neurology", age: 41, email: "sjohnson@mail.com", phone: "+1-555-0206", status: "Active" },
  { id: 7, name: "David Chen", dept: "Orthopedics", age: 55, email: "dchen@mail.com", phone: "+1-555-0207", status: "Discharged" },
  { id: 8, name: "Emma Wilson", dept: "Pediatrics", age: 8, email: "parent@mail.com", phone: "+1-555-0208", status: "Admitted" },
  { id: 9, name: "Alex Turner", dept: "General Medicine", age: 72, email: "aturner@mail.com", phone: "+1-555-0209", status: "Active" },
];

const allDepartments = ["Cardiology", "General Medicine", "Orthopedics", "Dermatology", "Neurology", "Pediatrics", "Emergency"];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "beds" | "directory">("overview");
  const [beds, setBeds] = useState(initialBeds);
  const [allocatingBed, setAllocatingBed] = useState<number | null>(null);
  const [allocateForm, setAllocateForm] = useState({ patientName: "" });
  const [directoryTab, setDirectoryTab] = useState<"patients" | "doctors">("patients");
  const [searchDir, setSearchDir] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDept, setSelectedDept] = useState<string>("All");

  const totalPatients = dummyPatients.length;
  const availableDoctors = dummyDoctors.filter(d => d.status === "Active").length;
  const freeBeds = beds.filter(b => !b.occupied).length;

  const handleAllocate = (bedId: number) => {
    setAllocatingBed(bedId);
    setTimeout(() => {
      setBeds(prev => prev.map(b => b.id === bedId ? { ...b, occupied: true, patient: allocateForm.patientName || "New Patient" } : b));
      setAllocatingBed(null);
      setAllocateForm({ patientName: "" });
    }, 2000);
  };

  const handleDeallocate = (bedId: number) => {
    setBeds(prev => prev.map(b => b.id === bedId ? { ...b, occupied: false, patient: null } : b));
  };

  const filteredDoctors = dummyDoctors.filter(d =>
    (selectedDept === "All" || d.dept === selectedDept) &&
    d.name.toLowerCase().includes(searchDir.toLowerCase())
  );

  const filteredPatients = dummyPatients.filter(p =>
    (selectedDept === "All" || p.dept === selectedDept) &&
    p.name.toLowerCase().includes(searchDir.toLowerCase())
  );

  const getDeptCount = (dept: string, list: { dept: string }[]) => list.filter(i => i.dept === dept).length;

  return (
    <DashboardLayout navItems={navItems} role="Admin">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Admin <span className="text-gradient">Command Center</span>
          </h1>
          <p className="text-muted-foreground mt-1">System-wide monitoring and resource management</p>
        </div>

        {/* Tab nav */}
        <div className="flex gap-2 border-b border-border pb-2">
          {[
            { key: "overview" as const, label: "Overview", icon: LayoutDashboard },
            { key: "beds" as const, label: "Bed Management", icon: BedDouble },
            { key: "directory" as const, label: "Master Directory", icon: Users },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearchDir(""); setSelectedDept("All"); }}
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

        {/* Overview */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Users, label: "Total Patients", value: totalPatients.toString(), color: "text-primary" },
                { icon: Stethoscope, label: "Available Doctors", value: availableDoctors.toString(), color: "text-accent" },
                { icon: BedDouble, label: "Free Beds", value: `${freeBeds}/${beds.length}`, color: "text-success" },
                { icon: Brain, label: "Predicted No-Shows", value: "12%", color: "text-warning", special: true },
              ].map((stat) => (
                <Card key={stat.label} className={`border-border ${stat.special ? "ring-1 ring-warning/30" : ""}`}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${stat.special ? "bg-warning/10" : "bg-secondary"}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      {stat.special && <p className="text-[10px] text-warning font-medium">ML Prediction</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Department summary */}
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

        {/* Bed Management */}
        {activeTab === "beds" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {["ICU", "General", "Emergency"].map(ward => {
              const wardBeds = beds.filter(b => b.ward === ward);
              const wardFree = wardBeds.filter(b => !b.occupied).length;
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
                            bed.occupied
                              ? "bg-emergency/10 border-emergency/30 text-emergency"
                              : "bg-success/10 border-success/30 text-success cursor-pointer hover:bg-success/20"
                          }`}
                        >
                          <BedDouble className="h-5 w-5 mx-auto mb-1" />
                          <p className="font-bold">#{bed.id}</p>
                          {bed.occupied ? (
                            <div>
                              <p className="text-[9px] truncate text-foreground">{bed.patient}</p>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 text-[10px] text-emergency mt-1 p-0"
                                onClick={() => handleDeallocate(bed.id)}
                              >
                                Release
                              </Button>
                            </div>
                          ) : (
                            <div className="mt-1">
                              {allocatingBed === bed.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mx-auto text-primary" />
                              ) : (
                                <div className="space-y-1">
                                  <Input
                                    placeholder="Patient"
                                    className="h-5 text-[10px] px-1"
                                    value={allocateForm.patientName}
                                    onChange={(e) => setAllocateForm({ patientName: e.target.value })}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <Button
                                    size="sm"
                                    className="h-5 text-[10px] w-full p-0"
                                    onClick={() => handleAllocate(bed.id)}
                                  >
                                    Allocate
                                  </Button>
                                </div>
                              )}
                            </div>
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

        {/* Master Directory */}
        {activeTab === "directory" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Sub tabs */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex gap-2">
                <Button
                  variant={directoryTab === "patients" ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setDirectoryTab("patients"); setSearchDir(""); setSelectedDept("All"); }}
                >
                  <Users className="h-4 w-4 mr-1" /> Patients ({dummyPatients.length})
                </Button>
                <Button
                  variant={directoryTab === "doctors" ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setDirectoryTab("doctors"); setSearchDir(""); setSelectedDept("All"); }}
                >
                  <Stethoscope className="h-4 w-4 mr-1" /> Doctors ({dummyDoctors.length})
                </Button>
              </div>
              <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
                <Plus className="h-4 w-4 mr-1" /> Add {directoryTab === "patients" ? "Patient" : "Doctor"}
              </Button>
            </div>

            {/* Add form */}
            {showAddForm && (
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Add New {directoryTab === "patients" ? "Patient" : "Doctor"}</CardTitle>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowAddForm(false)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <form className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3" onSubmit={(e) => { e.preventDefault(); setShowAddForm(false); }}>
                    <div className="space-y-1">
                      <Label className="text-xs">Full Name</Label>
                      <Input placeholder="Enter name..." className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Email</Label>
                      <Input type="email" placeholder="email@example.com" className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Phone</Label>
                      <Input placeholder="+1-555-..." className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Department</Label>
                      <select className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground">
                        {allDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    {directoryTab === "patients" && (
                      <div className="space-y-1">
                        <Label className="text-xs">Age</Label>
                        <Input type="number" placeholder="Age" className="h-8 text-sm" />
                      </div>
                    )}
                    <div className="flex items-end">
                      <Button type="submit" size="sm" className="w-full">
                        <Check className="h-3 w-3 mr-1" /> Save
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-9 h-9" value={searchDir} onChange={(e) => setSearchDir(e.target.value)} />
              </div>
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="All">All Departments</option>
                {allDepartments.map(d => <option key={d} value={d}>{d} ({getDeptCount(d, directoryTab === "patients" ? dummyPatients : dummyDoctors)})</option>)}
              </select>
            </div>

            {/* Department counts */}
            <div className="flex flex-wrap gap-2">
              {allDepartments.map(dept => {
                const count = getDeptCount(dept, directoryTab === "patients" ? dummyPatients : dummyDoctors);
                if (count === 0) return null;
                return (
                  <Badge
                    key={dept}
                    variant="secondary"
                    className={`cursor-pointer ${selectedDept === dept ? "bg-primary text-primary-foreground" : ""}`}
                    onClick={() => setSelectedDept(selectedDept === dept ? "All" : dept)}
                  >
                    {dept}: {count}
                  </Badge>
                );
              })}
            </div>

            {/* Table */}
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
                          <Badge variant={
                            item.status === "Active" ? "secondary" :
                            item.status === "Critical" ? "destructive" :
                            item.status === "Admitted" ? "default" : "outline"
                          } className="text-[10px]">
                            {item.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {((directoryTab === "patients" ? filteredPatients : filteredDoctors).length === 0) && (
                  <p className="text-center py-8 text-muted-foreground">No records found</p>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
