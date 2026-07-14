import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    quote: "SparkX Index connected us with two investors within our first month. We closed our seed round in under 90 days — something we'd been struggling with for a year.",
    name: "Kwame Asante",
    role: "Founder",
    company: "TechNova Africa",
    initials: "KA",
    accentColor: "gold",
  },
  {
    quote: "The ecosystem intelligence dashboard gives me insights I can't find anywhere else. I've discovered 15 promising startups through the platform this quarter alone.",
    name: "Ama Owusu",
    role: "Investor",
    company: "Impact Ventures GH",
    initials: "AO",
    accentColor: "emerald",
  },
  {
    quote: "As a mentor, I can finally track my impact and connect with founders who actually need my expertise. The booking system is seamless and professional.",
    name: "Dr. Kofi Mensah",
    role: "Mentor",
    company: "Ghana Tech Lab",
    initials: "KM",
    accentColor: "blue",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const accentMap: Record<string, { badge: string; stars: string; quote: string }> = {
  gold: {
    badge: "bg-gold/10 text-gold",
    stars: "text-gold",
    quote: "text-gold/30",
  },
  emerald: {
    badge: "bg-emerald/10 text-emerald",
    stars: "text-emerald",
    quote: "text-emerald/30",
  },
  blue: {
    badge: "bg-blue-500/10 text-blue-500",
    stars: "text-blue-500",
    quote: "text-blue-500/30",
  },
};

const TestimonialsSection = () => {
  return (
    <section className="py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
            <Quote className="h-3 w-3" />
            What People Say
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Trusted by Africa's{" "}
            <span className="text-gradient-gold">Startup Community</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Hear from the founders, investors, and mentors building the future of African innovation.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-6 md:grid-cols-3"
        >
          {testimonials.map((t) => {
            const accent = accentMap[t.accentColor];
            return (
              <motion.div
                key={t.name}
                variants={itemVariants}
                className="group rounded-2xl border border-border bg-card p-6 flex flex-col hover:border-gold/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex gap-0.5 mb-4">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className={`h-3.5 w-3.5 fill-current ${accent.stars}`} />
                  ))}
                </div>

                <Quote className={`h-8 w-8 mb-3 ${accent.quote}`} />

                <p className="text-sm text-foreground/80 leading-relaxed flex-1 mb-6">
                  "{t.quote}"
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className={`text-xs font-bold ${accent.badge}`}>
                      {t.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold font-display">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.role}, {t.company}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
