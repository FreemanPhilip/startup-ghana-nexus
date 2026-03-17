import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="dark bg-gradient-hero py-24">
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
          <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl md:text-5xl">
            Ready to Join Africa's Startup Movement?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Whether you're a founder, investor, or mentor — SparkX Index is your gateway
            to opportunities, connections, and growth.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link to="/auth">
              <Button
                size="lg"
                className="bg-gradient-gold px-8 text-base font-semibold text-navy hover:opacity-90 glow-gold"
              >
                Create Your Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#pricing">
              <Button
                variant="outline"
                size="lg"
                className="border-foreground/20 px-8 text-base text-foreground hover:bg-foreground/10"
              >
                Learn More
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
