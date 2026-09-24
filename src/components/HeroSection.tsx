import { motion } from "framer-motion";
import { ArrowRight, Rocket, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const stats = [
  { icon: Rocket, value: "500+", label: "Startups" },
  { icon: TrendingUp, value: "$25M+", label: "Funding Raised" },
  { icon: Users, value: "200+", label: "Investors" },
];

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
});

const HeroSection = () => {
  return (
    <section className="dark relative isolate overflow-hidden bg-gradient-hero pt-16 text-foreground">
      {/* Photography is atmosphere, not content: held well back so the
          headline keeps its contrast instead of competing with a texture. */}
      <div className="absolute inset-0 -z-10 opacity-[0.18]">
        <img src={heroBg} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-navy/70 via-navy/80 to-background" />
      {/* A single warm bloom in the brand orange, anchoring the eye centre-top. */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 -z-10 h-[420px] w-[820px] max-w-[140vw] -translate-x-1/2 -translate-y-1/3 rounded-full bg-brand/20 blur-[120px]"
      />

      <div className="container relative flex min-h-[88vh] flex-col items-center justify-center py-24 text-center">
        <motion.div
          {...rise(0)}
          className="mb-7 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5 text-sm font-medium text-brand"
        >
          <Rocket className="h-4 w-4" />
          Africa's Premier Startup Ecosystem Platform
        </motion.div>

        <motion.h1
          {...rise(0.08)}
          className="max-w-5xl font-display text-[2.75rem] font-bold leading-[1.05] tracking-[-0.03em] sm:text-6xl md:text-7xl lg:text-[5rem]"
        >
          Connect. Build. <span className="text-gradient-brand">Scale.</span>
        </motion.h1>

        <motion.p
          {...rise(0.16)}
          className="mt-7 max-w-xl text-balance text-lg leading-relaxed text-muted-foreground sm:text-xl"
        >
          SparkX Index brings together founders, investors, and mentors to power the next generation of
          African innovation.
        </motion.p>

        <motion.div {...rise(0.24)} className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link to="/auth" className="sm:w-auto">
            <Button size="lg" className="glow-brand h-12 w-full px-8 text-base font-semibold sm:w-auto">
              Join The Index
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/sparkx-index" className="sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="h-12 w-full border-foreground/20 bg-foreground/5 px-8 text-base backdrop-blur-sm hover:bg-foreground/10 sm:w-auto"
            >
              Explore Opportunities
            </Button>
          </Link>
        </motion.div>

        {/* Proof, as one bordered strip rather than three floating clusters —
            it reads as a single claim about the ecosystem's size. */}
        <motion.dl
          {...rise(0.36)}
          className="mt-16 grid w-full max-w-2xl grid-cols-3 divide-x divide-foreground/10 rounded-2xl border border-foreground/10 bg-foreground/[0.04] backdrop-blur-sm"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1 px-2 py-6 sm:px-6">
              <stat.icon className="mb-1 h-4 w-4 text-brand" aria-hidden="true" />
              <dt className="sr-only">{stat.label}</dt>
              <dd className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{stat.value}</dd>
              <span aria-hidden="true" className="text-xs text-muted-foreground sm:text-sm">
                {stat.label}
              </span>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
};

export default HeroSection;
