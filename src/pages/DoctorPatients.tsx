import { Users, Search, Activity, Calendar } from "lucide-react"; // <-- Added Calendar here!
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { title: "Schedule", url: "/doctor", icon: Calendar }, 
  { title: "Patients", url: "/doctor/patients", icon: Users },
];

const patientData = [
  { id: "P-101", name: "John Davis", age: 45, gender: "Male", lastVisit: "Feb 10, 2026", status: "Stable" },
  { id: "P-102", name: "Maria Garcia", age: 62, gender: "Female", lastVisit: "Feb 28, 2026", status: "Monitoring" },
  { id: "P-103", name: "Tom Brown", age: 58, gender: "Male", lastVisit: "Today", status: "Critical" },
  { id: "P-104", name: "Lisa White", age: 34, gender: "Female", lastVisit: "Jan 15, 2026", status: "Stable" },
  { id: "P-105", name: "Robert Kim", age: 28, gender: "Male", lastVisit: "Nov 02, 2025", status: "Stable" },
  { id: "P-106", name: "Sarah Johnson", age: 41, gender: "Female", lastVisit: "Today", status: "Critical" },
  { id: "P-107", name: "David Chen", age: 55, gender: "Male", lastVisit: "Mar 01, 2026", status: "Recovery" },
  { id: "P-108", name: "Emily Park", age: 39, gender: "Female", lastVisit: "Dec 12, 2025", status: "Stable" },
];

const DoctorPatients = () => {
  return (
    <DashboardLayout navItems={navItems} role="Doctor">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              Patient Directory
            </h1>
            <p className="text-muted-foreground mt-1">Manage and view all registered patients.</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="text" placeholder="Search patients..." className="pl-9 bg-card border-border" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patientData.map((patient) => (
            <Card key={patient.id} className="border-border hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{patient.name}</h3>
                      <p className="text-xs text-muted-foreground">{patient.id} · {patient.age} yrs · {patient.gender}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Activity className="h-3 w-3" />
                    Last visit: {patient.lastVisit}
                  </div>
                  <Badge 
                    variant="outline" 
                    className={
                      patient.status === 'Critical' ? 'border-emergency text-emergency bg-emergency/10' : 
                      patient.status === 'Monitoring' ? 'border-accent text-accent bg-accent/10' : 
                      'border-success text-success bg-success/10'
                    }
                  >
                    {patient.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorPatients;