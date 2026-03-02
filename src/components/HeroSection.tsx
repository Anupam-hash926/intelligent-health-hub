import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-20 left-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-secondary/40 blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-8">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              Powered by AI & Advanced Algorithms
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-extrabold tracking-tight text-foreground leading-[1.1] mb-6">
              Next-Generation{" "}
              <span className="text-gradient">Healthcare</span>{" "}
              Management
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              AI-driven scheduling, real-time emergency routing, and instant patient record retrieval — 
              all powered by cutting-edge data structures and machine learning.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/login">
              <Button variant="hero" size="lg" className="text-base px-8 py-6">
                Book an Appointment
                <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="emergency" size="lg" className="text-base px-8 py-6">
              <AlertTriangle className="mr-1 h-5 w-5" />
              EMERGENCY: Find Nearest Hospital
            </Button>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {[
              { value: "50K+", label: "Patients Served" },
              { value: "<2s", label: "Avg. Record Retrieval" },
              { value: "99.9%", label: "Scheduling Accuracy" },
              { value: "24/7", label: "Emergency Routing" },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-xl p-4 shadow-sm">
                <p className="text-2xl md:text-3xl font-display font-bold text-gradient">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
