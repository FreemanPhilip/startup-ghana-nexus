import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const stats = [
  { value: "500+", label: "Startups" },
  { value: "$25M+", label: "Funding raised" },
  { value: "200+", label: "Investors" },
];

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 26 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] as const },
});

const HeroSection = () => {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  // The hero recedes as the page moves on, rather than simply scrolling away:
  // it hands the screen over to the first chapter.
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);

  return (
    <section
      ref={ref}
      className="dark relative isolate flex min-h-[100svh] items-center overflow-hidden bg-gradient-hero pt-16 text-foreground"
    >
      <motion.div
        style={reduced ? undefined : { scale: bgScale }}
        className="absolute inset-0 -z-20 will-change-transform"
        aria-hidden="true"
      >
        <img src={heroBg} alt="" className="h-full w-full object-cover opacity-[0.16]" />
      </motion.div>
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-navy/60 via-navy/75 to-background" />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[38%] -z-10 h-[460px] w-[900px] max-w-[150vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/15 blur-[140px]"
      />

      <motion.div
        style={reduced ? undefined : { y: contentY, opacity: contentOpacity }}
        className="container relative flex flex-col items-center py-24 text-center"
      >
        <motion.p
          {...rise(0)}
          className="mb-8 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground"
        >
          Africa's Premier Startup Ecosystem Platform
        </motion.p>

        <motion.h1 {...rise(0.08)} className="display-xl max-w-[17ch]">
          Connect. Build. <span className="text-gradient-brand">Scale.</span>
        </motion.h1>

        <motion.p {...rise(0.16)} className="lede mt-7 max-w-[46ch]">
          SparkX Index brings together founders, investors, and mentors to power the next generation of
          African innovation.
        </motion.p>

        <motion.div {...rise(0.24)} className="mt-11 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link to="/auth" className="sm:w-auto">
            <Button size="lg" className="h-12 w-full rounded-full px-8 text-[15px] font-medium sm:w-auto">
              Join The Index
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/sparkx-index" className="sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="h-12 w-full rounded-full border-foreground/15 bg-foreground/[0.06] px-8 text-[15px] font-medium backdrop-blur-sm hover:bg-foreground/10 sm:w-auto"
            >
              Explore Opportunities
            </Button>
          </Link>
        </motion.div>

        {/* Proof stays quiet — three numbers on a hairline, not a boxed panel.
            The headline should be the only loud thing on the first screen. */}
        <motion.dl
          {...rise(0.4)}
          className="mt-20 grid w-full max-w-lg grid-cols-3 gap-6 border-t border-foreground/10 pt-8"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <dd className="font-display text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{stat.value}</dd>
              <dt className="mt-1 text-[13px] leading-tight text-muted-foreground">{stat.label}</dt>
            </div>
          ))}
        </motion.dl>
      </motion.div>
    </section>
  );
};

export default HeroSection;
