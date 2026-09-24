import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import SparkXLogo from "@/components/SparkXLogo";

const CTASection = () => {
  return (
    <section className="dark section-y relative isolate overflow-hidden bg-gradient-hero text-foreground">
      {/* The same warm bloom that opens the page, closing it — so the site
          begins and ends on the brand rather than drifting. */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 -z-10 h-[360px] w-[760px] max-w-[140vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/20 blur-[120px]"
      />

      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <SparkXLogo variant="mark" tone="dark" className="mx-auto mb-7 h-14 w-14 animate-float" alt="" />
          <h2 className="font-display text-3xl font-bold tracking-[-0.02em] text-balance sm:text-4xl md:text-[3rem] md:leading-[1.08]">
            Ready to Join Africa's Startup Movement?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg">
            Whether you're a founder, investor, or mentor — SparkX Index is your gateway to opportunities,
            connections, and growth.
          </p>
          <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
            <Link to="/auth">
              <Button size="lg" className="glow-brand h-12 w-full px-8 text-base font-semibold sm:w-auto">
                Create Your Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/about">
              <Button
                variant="outline"
                size="lg"
                className="h-12 w-full border-foreground/20 bg-foreground/5 px-8 text-base backdrop-blur-sm hover:bg-foreground/10 sm:w-auto"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
