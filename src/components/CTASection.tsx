import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="bg-gradient-hero py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-gold animate-float">
            <Star className="h-8 w-8 text-navy" fill="currentColor" />
          </div>
          <h2 className="font-display text-3xl font-bold text-primary-foreground sm:text-4xl md:text-5xl">
            Ready to Join Ghana's Startup Movement?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/60">
            Whether you're a founder, investor, or mentor — AGS is your gateway
            to opportunities, connections, and growth.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="bg-gradient-gold px-8 text-base font-semibold text-navy hover:opacity-90 glow-gold"
            >
              Create Your Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-primary-foreground/20 px-8 text-base text-primary-foreground hover:bg-primary-foreground/10"
            >
              Learn More
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
