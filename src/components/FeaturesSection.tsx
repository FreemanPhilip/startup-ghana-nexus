import { Handshake, BookOpen, Target, BarChart3, MessageCircle, Shield } from "lucide-react";
import SectionHeading from "@/components/marketing/SectionHeading";
import Reveal from "@/components/marketing/Reveal";

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
          title="Everything your startup needs."
          description="From finding investors to booking mentors, SparkX Index provides the tools to accelerate your startup journey across Africa and beyond."
          className="mb-16 md:mb-20"
        />

        {/* A hairline grid rather than six floating cards: the rules do the
            separating, so the eye lands on the words instead of on six
            competing container edges. */}
        <div className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <Reveal
              key={feature.title}
              index={i}
              distance={20}
              className="group bg-background p-8 transition-colors duration-500 hover:bg-muted/40 lg:p-10"
            >
              <feature.icon
                className="h-5 w-5 text-brand transition-transform duration-500 group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
              <h3 className="mt-6 font-display text-[17px] font-semibold tracking-[-0.015em]">{feature.title}</h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">{feature.description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
