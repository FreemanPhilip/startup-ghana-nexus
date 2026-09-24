import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import SectionHeading from "@/components/marketing/SectionHeading";

const roles = [
  {
    title: "Startup Founders",
    description:
      "Showcase your startup, connect with investors, find mentors, and access exclusive funding opportunities.",
    badge: "Build & Raise",
  },
  {
    title: "Investors",
    description: "Discover vetted startups, access deal flow, and use AI matching to find your next investment.",
    badge: "Invest & Grow",
  },
  {
    title: "Mentors",
    description: "Share your expertise, book structured sessions, and shape the next generation of African founders.",
    badge: "Guide & Impact",
  },
  {
    title: "Ecosystem Partners",
    description: "Promote accelerator programs, post opportunities, and engage with a thriving startup community.",
    badge: "Support & Scale",
  },
];

const HowItWorks = () => {
  return (
    <section className="section-y border-t border-border bg-muted/30">
      <div className="container">
        <SectionHeading
          eyebrow="Who Is This For?"
          title="One Platform, Every Stakeholder"
          description="Whether you're building, investing, mentoring, or supporting — SparkX Index has a place for you."
          className="mb-14"
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map((role, i) => (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-[0_18px_40px_-24px_hsl(14_88%_45%/0.5)]"
            >
              {/* A quiet tinted chip rather than a solid gold pill: four of
                  these side by side were shouting over the role names, which
                  are the thing a visitor is actually scanning for. */}
              <span className="inline-flex w-fit rounded-full bg-brand/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-brand ring-1 ring-inset ring-brand/15">
                {role.badge}
              </span>
              <h3 className="mt-4 font-display text-lg font-bold tracking-[-0.01em]">{role.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{role.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.figure
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-16 max-w-3xl rounded-2xl border border-border bg-card p-8 text-center sm:p-10"
        >
          <Quote className="mx-auto mb-5 h-7 w-7 text-brand/50" aria-hidden="true" />
          <blockquote className="font-display text-xl font-medium leading-relaxed tracking-[-0.01em] text-balance sm:text-2xl">
            "SparkX Index connected us with the right investors at exactly the right time. Within three months,
            we closed our seed round and found an incredible mentor who transformed our go-to-market strategy."
          </blockquote>
          <figcaption className="mt-6">
            <p className="font-display font-bold">Kwame Asante</p>
            <p className="text-sm text-muted-foreground">Founder, TechNova Africa</p>
          </figcaption>
        </motion.figure>
      </div>
    </section>
  );
};

export default HowItWorks;
