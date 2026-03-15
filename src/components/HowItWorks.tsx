import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const roles = [
  {
    title: "Startup Founders",
    description: "Showcase your startup, connect with investors, find mentors, and access exclusive funding opportunities.",
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
    <section className="border-t border-border bg-muted/30 py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <span className="mb-3 inline-block rounded-full bg-emerald/10 px-4 py-1 text-sm font-semibold text-emerald">
            Who Is This For?
          </span>
          <h2 className="font-display text-3xl font-bold sm:text-4xl md:text-5xl">
            One Platform, Every Stakeholder
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Whether you're building, investing, mentoring, or supporting — SparkX Index has a place for you.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map((role, i) => (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-gold/30 hover:shadow-lg"
            >
              <span className="inline-block rounded-full bg-gradient-gold px-3 py-0.5 text-xs font-bold text-navy">
                {role.badge}
              </span>
              <h3 className="mt-4 font-display text-lg font-bold">{role.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {role.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Testimonial */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mt-20 max-w-2xl text-center"
        >
          <Quote className="mx-auto mb-4 h-8 w-8 text-gold/40" />
          <blockquote className="text-lg font-medium italic leading-relaxed text-foreground/80">
            "SparkX Index connected us with the right investors at exactly the right time.
            Within three months, we closed our seed round and found an incredible
            mentor who transformed our go-to-market strategy."
          </blockquote>
          <div className="mt-6">
            <p className="font-display font-bold">Kwame Asante</p>
            <p className="text-sm text-muted-foreground">Founder, TechNova Africa</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
