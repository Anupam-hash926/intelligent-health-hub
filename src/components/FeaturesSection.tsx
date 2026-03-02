import { motion } from "framer-motion";
import { Zap, Brain, MapPin, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning-Fast Records",
    description:
      "Instant patient history retrieval using hash-based indexing. Access any record in O(1) time with our optimized RDBMS architecture.",
    tag: "Hashing / RDBMS",
  },
  {
    icon: Brain,
    title: "AI-Powered Scheduling",
    description:
      "Smart overbooking prevention and zero wait times using Logistic Regression to predict no-shows and optimize appointment slots.",
    tag: "Machine Learning",
  },
  {
    icon: MapPin,
    title: "Real-Time Emergency Routing",
    description:
      "Location-based immediate hospital matching with priority queues ensuring the most critical patients are routed first.",
    tag: "Priority Queues",
  },
  {
    icon: ShieldCheck,
    title: "Flawless Resource Management",
    description:
      "Conflict-free bed allocation and doctor scheduling with ACID-compliant transactions guaranteeing data integrity.",
    tag: "ACID / RDBMS",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 md:py-32 relative">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/3 blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-sm font-semibold text-primary uppercase tracking-wider mb-3"
          >
            Core Technology
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-display font-extrabold text-foreground"
          >
            Four Pillars of Innovation
          </motion.h2>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="group relative glass rounded-2xl p-8 hover:shadow-glow transition-all duration-500 cursor-default"
            >
              <div className="flex items-start gap-5">
                <div className="h-12 w-12 rounded-xl hero-gradient flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-display font-bold text-foreground">{feature.title}</h3>
                  </div>
                  <span className="inline-block text-xs font-semibold text-primary bg-secondary px-2.5 py-1 rounded-full mb-3">
                    {feature.tag}
                  </span>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
