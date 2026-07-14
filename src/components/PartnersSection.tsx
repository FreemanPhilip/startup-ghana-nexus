import { motion } from "framer-motion";
import { Handshake } from "lucide-react";

const partners = [
  { name: "Ghana Startup Association", abbr: "GSA" },
  { name: "National Investment Bank", abbr: "NIB" },
  { name: "Impact Hub Accra", abbr: "IHA" },
  { name: "Tony Elumelu Foundation", abbr: "TEF" },
  { name: "Ghana Tech Lab", abbr: "GTL" },
  { name: "Startup Bootcamp", abbr: "SBC" },
  { name: "Africa Finance Corporation", abbr: "AFC" },
  { name: "Ghana Venture Capital", abbr: "GVC" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const PartnersSection = () => {
  return (
    <section className="py-24 border-t border-b border-border bg-muted/30">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald/10 px-3 py-1 text-xs font-semibold text-emerald mb-4">
            <Handshake className="h-3 w-3" />
            Our Ecosystem
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Backed by Leading{" "}
            <span className="text-gradient-gold">Organizations</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Working alongside the institutions shaping Africa's startup ecosystem.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-4"
        >
          {partners.map((p) => (
            <motion.div
              key={p.abbr}
              variants={itemVariants}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card px-6 py-4 hover:border-gold/30 hover:bg-card/80 hover:shadow-md transition-all duration-300 cursor-default"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm font-display font-bold text-muted-foreground group-hover:bg-gold/10 group-hover:text-gold transition-colors duration-300">
                {p.abbr}
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                {p.name}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default PartnersSection;
