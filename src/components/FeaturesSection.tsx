import { motion } from "framer-motion";
import {
  Handshake,
  BookOpen,
  Target,
  BarChart3,
  MessageCircle,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: Handshake,
    title: "Startup–Investor Matching",
    description:
      "AI-powered recommendations connect startups with the right investors based on industry, stage, and funding needs.",
    color: "gold" as const,
  },
  {
    icon: BookOpen,
    title: "Mentorship Booking",
    description:
      "Discover verified mentors, book 1:1 sessions, and grow with structured guidance from experienced leaders.",
    color: "emerald" as const,
  },
  {
    icon: Target,
    title: "Opportunities Board",
    description:
      "Access funding calls, grants, accelerator programs, competitions, and job opportunities in one place.",
    color: "gold" as const,
  },
  {
    icon: BarChart3,
    title: "Ecosystem Intelligence",
    description:
      "Real-time data dashboards tracking funding trends, startup growth, industry breakdowns, and ecosystem health.",
    color: "emerald" as const,
  },
  {
    icon: MessageCircle,
    title: "Social Networking",
    description:
      "Post updates, share milestones, follow founders and startups, and engage with the community in your feed.",
    color: "gold" as const,
  },
  {
    icon: Shield,
    title: "Trust & Verification",
    description:
      "KYC-verified profiles with badges for startups, investors, and mentors build confidence across the platform.",
    color: "emerald" as const,
  },
];

const colorStyles = {
  gold: "bg-gold/10 text-gold",
  emerald: "bg-emerald/10 text-emerald",
};

const FeaturesSection = () => {
  return (
    <section id="startups" className="py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <span className="mb-3 inline-block rounded-full bg-gold/10 px-4 py-1 text-sm font-semibold text-gold">
            Platform Features
          </span>
          <h2 className="font-display text-3xl font-bold sm:text-4xl md:text-5xl">
            Everything Your Startup Needs
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            From finding investors to booking mentors, SparkX Index provides the tools to
            accelerate your startup journey across Africa.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group rounded-2xl border border-border bg-card p-8 transition-all hover:border-gold/30 hover:shadow-lg"
            >
              <div
                className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${colorStyles[feature.color]}`}
              >
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-display text-lg font-bold">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
