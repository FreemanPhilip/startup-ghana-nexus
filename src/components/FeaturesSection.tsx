import { motion } from "framer-motion";
import { Handshake, BookOpen, Target, BarChart3, MessageCircle, Shield } from "lucide-react";
import SectionHeading from "@/components/marketing/SectionHeading";

const features = [
  {
    icon: Handshake,
    title: "Startup–Investor Matching",
    description:
      "AI-powered recommendations connect startups with the right investors based on industry, stage, and funding needs.",
  },
  {
    icon: BookOpen,
    title: "Mentorship Booking",
    description:
      "Discover verified mentors, book 1:1 sessions, and grow with structured guidance from experienced leaders.",
  },
  {
    icon: Target,
    title: "Opportunities Board",
    description:
      "Access funding calls, grants, accelerator programs, competitions, and job opportunities in one place.",
  },
  {
    icon: BarChart3,
    title: "Ecosystem Intelligence",
    description:
      "Real-time data dashboards tracking funding trends, startup growth, industry breakdowns, and ecosystem health.",
  },
  {
    icon: MessageCircle,
    title: "Social Networking",
    description:
      "Post updates, share milestones, follow founders and startups, and engage with the community in your feed.",
  },
  {
    icon: Shield,
    title: "Trust & Verification",
    description:
      "KYC-verified profiles with badges for startups, investors, and mentors build confidence across the platform.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="startups" className="section-y">
      <div className="container">
        <SectionHeading
          eyebrow="Explore The Index"
          title="Everything Your Startup Needs"
          description="From finding investors to booking mentors, SparkX Index provides the tools to accelerate your startup journey across Africa and beyond."
          className="mb-14"
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: Math.min(i, 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="group relative rounded-2xl border border-border bg-card p-7 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-[0_18px_40px_-24px_hsl(14_88%_45%/0.5)]"
            >
              {/* One accent colour across the grid. Alternating gold and
                  emerald made six equal features look like two categories. */}
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-inset ring-brand/15 transition-colors duration-300 group-hover:bg-brand/15">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-display text-lg font-bold tracking-[-0.01em]">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
