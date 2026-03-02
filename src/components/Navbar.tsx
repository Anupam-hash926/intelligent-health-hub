import { Link } from "react-router-dom";
import { Activity, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg hero-gradient flex items-center justify-center">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg text-foreground">
            MedFlow<span className="text-gradient">AI</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">About</a>
          <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Contact</a>
          <ThemeToggle />
          <Link to="/login">
            <Button size="sm">Login Portal</Button>
          </Link>
        </div>

        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden glass border-t border-border px-4 pb-4 space-y-3">
          <a href="#features" className="block text-sm font-medium text-muted-foreground py-2" onClick={() => setMobileOpen(false)}>Features</a>
          <a href="#about" className="block text-sm font-medium text-muted-foreground py-2" onClick={() => setMobileOpen(false)}>About</a>
          <a href="#contact" className="block text-sm font-medium text-muted-foreground py-2" onClick={() => setMobileOpen(false)}>Contact</a>
          <Link to="/login" onClick={() => setMobileOpen(false)}>
            <Button size="sm" className="w-full">Login Portal</Button>
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
