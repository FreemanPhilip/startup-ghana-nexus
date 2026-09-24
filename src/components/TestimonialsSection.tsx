import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import SectionHeading from "@/components/marketing/SectionHeading";

const testimonials = [
  {
    quote:
      "SparkX Index connected us with two investors within our first month. We closed our seed round in under 90 days — something we'd been struggling with for a year.",
    name: "Kwame Asante",
    role: "Founder",
    company: "TechNova Africa",
    initials: "KA",
  },
  {
    quote:
      "The ecosystem intelligence dashboard gives me insights I can't find anywhere else. I've discovered 15 promising startups through the platform this quarter alone.",
    name: "Ama Owusu",
    role: "Investor",
    company: "Impact Ventures GH",
    initials: "AO",
  },
  {
    quote:
      "As a mentor, I can finally track my impact and connect with founders who actually need my expertise. The booking system is seamless and professional.",
    name: "Dr. Kofi Mensah",
    role: "Mentor",
    company: "Ghana Tech Lab",
    initials: "KM",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const TestimonialsSection = () => {
  return (
    <section className="section-y">
      <div className="container">
        <SectionHeading
          eyebrow="What People Say"
          title={
            <>
              Trusted by Africa's <span className="text-gradient-brand">Startup Community</span>
            </>
          }
          description="Hear from the founders, investors, and mentors building the future of African innovation."
          className="mb-14"
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid gap-4 md:grid-cols-3"
        >
          {testimonials.map((t) => (
            <motion.figure
              key={t.name}
              variants={itemVariants}
              className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-[0_18px_40px_-24px_hsl(14_88%_45%/0.5)]"
            >
              {/* Three quotes of equal weight were previously gold, emerald and
                  blue, which implied a distinction that does not exist. One
                  accent, and the words carry the difference. */}
              <div className="mb-4 flex gap-0.5" aria-label="Rated 5 out of 5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current text-brand" aria-hidden="true" />
                ))}
              </div>

              <Quote className="mb-3 h-7 w-7 text-brand/25" aria-hidden="true" />

              <blockquote className="mb-6 flex-1 text-sm leading-relaxed text-foreground/85">
                "{t.quote}"
              </blockquote>

              <figcaption className="flex items-center gap-3 border-t border-border pt-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-brand/10 text-xs font-bold text-brand">{t.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-display text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.role}, {t.company}
                  </p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
