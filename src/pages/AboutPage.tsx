import { motion } from "framer-motion";
import {
  Target, Globe, Zap, Users, TrendingUp, Award, Heart, Shield,
  Lightbulb, Handshake, Rocket, ArrowRight, Star, BarChart3,
  CheckCircle2, Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1 },
  }),
};

/* ───────────────── HERO ───────────────── */
const AboutHero = () => (
  <section className="relative overflow-hidden bg-background pt-28 pb-20">
    <div className="container relative z-10">
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="mx-auto max-w-3xl text-center"
      >
        <motion.span variants={fadeUp} custom={0}
          className="mb-4 inline-block rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-sm font-medium text-gold"
        >
          About SparkX Index
        </motion.span>
        <motion.h1 variants={fadeUp} custom={1}
          className="font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl"
        >
          Empowering Africa's{" "}
          <span className="text-gradient-gold">Startup Ecosystem</span>
        </motion.h1>
        <motion.p variants={fadeUp} custom={2}
          className="mt-6 text-lg text-muted-foreground sm:text-xl"
        >
          SparkX Index is Africa's premier platform connecting founders, investors, mentors, and partners to build, scale, and fund the next generation of transformative startups.
        </motion.p>
      </motion.div>

      {/* Asymmetric grid */}
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="mt-14 grid gap-4 md:grid-cols-5 md:grid-rows-2"
      >
        {/* Large card left */}
        <motion.div variants={fadeUp} custom={0}
          className="relative flex items-end overflow-hidden rounded-2xl bg-gradient-to-br from-emerald to-emerald-light p-8 text-primary-foreground md:col-span-3 md:row-span-2 min-h-[320px]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(245,183,0,0.15),transparent_60%)]" />
          <div className="relative z-10">
            <Rocket className="mb-3 h-8 w-8 text-gold" />
            <h3 className="font-display text-2xl font-bold sm:text-3xl">Building the Future of African Innovation</h3>
            <p className="mt-2 max-w-md text-primary-foreground/80">
              From Lagos to Nairobi, Cape Town to Accra — we're uniting the continent's brightest minds under one platform.
            </p>
          </div>
        </motion.div>

        {/* Stat card top-right */}
        <motion.div variants={fadeUp} custom={1}
          className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 text-center md:col-span-2"
        >
          <Zap className="mb-2 h-6 w-6 text-gold" />
          <span className="font-display text-3xl font-bold text-foreground">90%</span>
          <span className="mt-1 text-sm text-muted-foreground">Faster Response Time</span>
        </motion.div>

        {/* Stat card bottom-right */}
        <motion.div variants={fadeUp} custom={2}
          className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 text-center md:col-span-2"
        >
          <TrendingUp className="mb-2 h-6 w-6 text-emerald" />
          <span className="font-display text-3xl font-bold text-foreground">50%</span>
          <span className="mt-1 text-sm text-muted-foreground">Growth Efficiency</span>
        </motion.div>
      </motion.div>
    </div>
  </section>
);

/* ───────────────── MISSION & VISION ───────────────── */
const MissionVision = () => (
  <section className="bg-background py-20">
    <div className="container">
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="grid gap-8 md:grid-cols-2"
      >
        {/* Mission */}
        <motion.div variants={fadeUp} custom={0}
          className="rounded-2xl border border-border bg-card p-8 shadow-sm"
        >
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald/10">
            <Target className="h-6 w-6 text-emerald" />
          </div>
          <h3 className="font-display text-2xl font-bold text-foreground">Our Mission</h3>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            To democratize access to resources, capital, and mentorship for African startups — breaking barriers and creating pathways for founders to build world-class companies regardless of location or background.
          </p>
        </motion.div>

        {/* Vision */}
        <motion.div variants={fadeUp} custom={1}
          className="rounded-2xl border border-border bg-card p-8 shadow-sm"
        >
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10">
            <Globe className="h-6 w-6 text-gold" />
          </div>
          <h3 className="font-display text-2xl font-bold text-foreground">Our Vision</h3>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            To become the definitive digital infrastructure powering Africa's startup ecosystem — where every founder has the tools, networks, and funding to transform ideas into continent-shaping enterprises.
          </p>
        </motion.div>
      </motion.div>
    </div>
  </section>
);

/* ───────────────── IMPACT METRICS ───────────────── */
const metrics = [
  { value: "500+", label: "Startups Onboarded", icon: Rocket },
  { value: "95%", label: "User Satisfaction", icon: Star },
  { value: "$25M+", label: "Funding Facilitated", icon: TrendingUp },
  { value: "200+", label: "Investors & Mentors", icon: Users },
];

const ImpactMetrics = () => (
  <section className="border-y border-border bg-muted/30 py-20">
    <div className="container">
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="mx-auto mb-14 max-w-2xl text-center"
      >
        <motion.h2 variants={fadeUp} custom={0}
          className="font-display text-3xl font-bold text-foreground sm:text-4xl"
        >
          Making <span className="text-gradient-gold">SparkX Index</span> better for everyone
        </motion.h2>
      </motion.div>

      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="grid grid-cols-2 gap-6 md:grid-cols-4"
      >
        {metrics.map((m, i) => (
          <motion.div key={m.label} variants={fadeUp} custom={i}
            className="flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center shadow-sm"
          >
            <m.icon className="mb-3 h-6 w-6 text-gold" />
            <span className="font-display text-3xl font-bold text-foreground sm:text-4xl">{m.value}</span>
            <span className="mt-1 text-sm text-muted-foreground">{m.label}</span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

/* ───────────────── FOUNDER MESSAGE ───────────────── */
const FounderMessage = () => (
  <section className="bg-background py-20">
    <div className="container">
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="grid items-center gap-12 md:grid-cols-2"
      >
        <motion.div variants={fadeUp} custom={0}>
          <span className="mb-3 inline-block text-sm font-medium uppercase tracking-wider text-gold">
            A Word from the Founder
          </span>
          <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Why I Built SparkX Index
          </h2>
          <p className="mt-6 leading-relaxed text-muted-foreground">
            "Africa doesn't lack talent or ideas — it lacks connected infrastructure. I founded SparkX Index because I witnessed too many brilliant founders struggle in isolation. Our platform exists to ensure that no great African startup fails because of a lack of access to the right people, capital, or knowledge."
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            "Today, we're building the rails that will power the next wave of African innovation — one connection, one mentorship session, one funding round at a time."
          </p>
          <div className="mt-6">
            <p className="font-display text-lg font-bold text-foreground">SparkX Founder</p>
            <p className="text-sm text-muted-foreground">Founder & CEO, SparkX Index</p>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} custom={1}
          className="flex items-center justify-center"
        >
          <div className="relative h-80 w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-emerald/20 to-gold/10">
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 h-24 w-24 rounded-full bg-gradient-to-br from-emerald to-emerald-light" />
              <Quote className="mb-2 h-8 w-8 text-gold/40" />
              <p className="text-sm italic text-muted-foreground">
                "Building Africa's startup future, together."
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  </section>
);

/* ───────────────── PARTNERS ───────────────── */
const partners = [
  "AfriLabs", "Google for Startups", "Y Combinator", "Techstars",
  "500 Global", "Africa CDC", "AU Commission", "World Bank",
];

const PartnersSection = () => (
  <section className="border-y border-border bg-muted/30 py-20">
    <div className="container">
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="mx-auto mb-12 max-w-2xl text-center"
      >
        <motion.h2 variants={fadeUp} custom={0}
          className="font-display text-3xl font-bold text-foreground sm:text-4xl"
        >
          Trusted by Leading Institutions
        </motion.h2>
        <motion.p variants={fadeUp} custom={1}
          className="mt-3 text-muted-foreground"
        >
          Backed by the best across Africa and beyond
        </motion.p>
      </motion.div>

      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {partners.map((p, i) => (
          <motion.div key={p} variants={fadeUp} custom={i}
            className="flex h-20 items-center justify-center rounded-xl border border-border bg-card px-4 text-center transition-all hover:scale-105 hover:border-gold/40 hover:shadow-md"
          >
            <span className="font-display text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
              {p}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

/* ───────────────── DARK VISION SECTION ───────────────── */
const visionCards = [
  { icon: Zap, title: "Seamless Experiences", desc: "Intuitive tools that founders actually love using — no complexity, just results." },
  { icon: BarChart3, title: "Unified Frameworks", desc: "One platform connecting every pillar of the startup journey from idea to IPO." },
  { icon: Handshake, title: "Partnership Growth", desc: "Strategic alliances that amplify impact across borders and industries." },
];

const DarkVisionSection = () => (
  <section className="dark relative overflow-hidden bg-gradient-hero py-24">
    {/* Glowing orb */}
    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="h-[400px] w-[400px] rounded-full bg-emerald/10 blur-[120px]" />
    </div>
    <div className="pointer-events-none absolute left-1/3 top-1/3">
      <div className="h-[200px] w-[200px] rounded-full bg-gold/8 blur-[80px]" />
    </div>

    <div className="container relative z-10">
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="mx-auto mb-16 max-w-2xl text-center"
      >
        <motion.span variants={fadeUp} custom={0}
          className="mb-4 inline-block rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5 text-sm text-gold"
        >
          Our Approach
        </motion.span>
        <motion.h2 variants={fadeUp} custom={1}
          className="font-display text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl"
        >
          We are value creators with{" "}
          <span className="text-gradient-gold">hyperfocus</span>
        </motion.h2>
      </motion.div>

      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="grid gap-6 md:grid-cols-3"
      >
        {visionCards.map((c, i) => (
          <motion.div key={c.title} variants={fadeUp} custom={i}
            className="group rounded-2xl border border-foreground/10 bg-foreground/5 p-8 backdrop-blur-md transition-all hover:border-gold/30 hover:bg-foreground/10"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10">
              <c.icon className="h-6 w-6 text-gold" />
            </div>
            <h3 className="font-display text-xl font-bold text-foreground">{c.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

/* ───────────────── TEAM ───────────────── */
const team = [
  { name: "Alex Mensah", role: "Founder & CEO", desc: "Serial entrepreneur with 10+ years in African tech ecosystems." },
  { name: "Amara Osei", role: "CTO", desc: "Full-stack engineer passionate about scalable platforms for emerging markets." },
  { name: "David Kiptoo", role: "Head of Partnerships", desc: "Connecting institutions and startups across the continent." },
  { name: "Fatima Diallo", role: "Head of Community", desc: "Building vibrant networks for founders, mentors, and investors." },
];

const TeamSection = () => (
  <section className="bg-background py-20">
    <div className="container">
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="mx-auto mb-14 max-w-2xl text-center"
      >
        <motion.h2 variants={fadeUp} custom={0}
          className="font-display text-3xl font-bold text-foreground sm:text-4xl"
        >
          Meet the Team
        </motion.h2>
        <motion.p variants={fadeUp} custom={1}
          className="mt-3 text-muted-foreground"
        >
          The people behind Africa's most ambitious startup platform
        </motion.p>
      </motion.div>

      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        {team.map((t, i) => (
          <motion.div key={t.name} variants={fadeUp} custom={i}
            className="group overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-gold/30 hover:shadow-md"
          >
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald/20 to-gold/10">
              <Users className="h-8 w-8 text-emerald transition-transform group-hover:scale-110" />
            </div>
            <h3 className="text-center font-display text-lg font-bold text-foreground">{t.name}</h3>
            <p className="mt-1 text-center text-sm font-medium text-gold">{t.role}</p>
            <p className="mt-3 text-center text-sm text-muted-foreground">{t.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

/* ───────────────── VALUES ───────────────── */
const values = [
  { icon: Heart, title: "Community First", desc: "Every decision starts with our founders and ecosystem members." },
  { icon: Shield, title: "Trust & Transparency", desc: "Open, honest, and accountable in everything we do." },
  { icon: Lightbulb, title: "Relentless Innovation", desc: "We push boundaries to deliver tools that truly matter." },
  { icon: Globe, title: "Pan-African Impact", desc: "We build for the continent — inclusive, borderless, and bold." },
  { icon: Award, title: "Excellence", desc: "We hold ourselves to the highest standard of quality and delivery." },
  { icon: Handshake, title: "Collaboration", desc: "Together we go further — partnerships over competition." },
];

const ValuesSection = () => (
  <section className="border-y border-border bg-muted/30 py-20">
    <div className="container">
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="mx-auto mb-14 max-w-2xl text-center"
      >
        <motion.h2 variants={fadeUp} custom={0}
          className="font-display text-3xl font-bold text-foreground sm:text-4xl"
        >
          Our Core Values
        </motion.h2>
      </motion.div>

      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {values.map((v, i) => (
          <motion.div key={v.title} variants={fadeUp} custom={i}
            className="flex items-start gap-4 rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald/10">
              <v.icon className="h-5 w-5 text-emerald" />
            </div>
            <div>
              <h4 className="font-display text-base font-bold text-foreground">{v.title}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{v.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

/* ───────────────── TESTIMONIALS ───────────────── */
const testimonials = [
  { quote: "SparkX Index connected us with the right investors in weeks, not months. Game-changer for African startups.", name: "Kofi Asante", role: "CEO, PayStack Africa" },
  { quote: "The mentorship matching alone is worth it. I found a mentor who truly understood the African market.", name: "Ngozi Eze", role: "Founder, GreenTech Solutions" },
  { quote: "As an investor, SparkX gives me curated deal flow from across the continent. Exceptional platform.", name: "James Mwangi", role: "Partner, Savannah Ventures" },
];

const TestimonialsSection = () => (
  <section className="bg-background py-20">
    <div className="container">
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="mx-auto mb-14 max-w-2xl text-center"
      >
        <motion.h2 variants={fadeUp} custom={0}
          className="font-display text-3xl font-bold text-foreground sm:text-4xl"
        >
          Trusted by the Best in the Industry
        </motion.h2>
      </motion.div>

      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="grid gap-6 md:grid-cols-3"
      >
        {testimonials.map((t, i) => (
          <motion.div key={t.name} variants={fadeUp} custom={i}
            className="rounded-2xl border border-border bg-card p-8 shadow-sm"
          >
            <Quote className="mb-4 h-6 w-6 text-gold/40" />
            <p className="leading-relaxed text-muted-foreground">"{t.quote}"</p>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald/10">
                <span className="font-display text-sm font-bold text-emerald">{t.name[0]}</span>
              </div>
              <div>
                <p className="font-display text-sm font-bold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

/* ───────────────── FINAL CTA ───────────────── */
const FinalCTA = () => (
  <section className="dark relative overflow-hidden bg-gradient-hero py-24">
    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="h-[300px] w-[300px] rounded-full bg-gold/10 blur-[100px]" />
    </div>
    <div className="container relative z-10">
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="mx-auto max-w-2xl text-center"
      >
        <motion.h2 variants={fadeUp} custom={0}
          className="font-display text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl"
        >
          Join Us in Building the Future
        </motion.h2>
        <motion.p variants={fadeUp} custom={1}
          className="mt-4 text-lg text-muted-foreground"
        >
          Be part of Africa's most ambitious startup ecosystem. Connect with founders, investors, and mentors today.
        </motion.p>
        <motion.div variants={fadeUp} custom={2} className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link to="/auth">
            <Button size="lg" className="bg-gradient-gold px-8 text-base font-semibold text-navy hover:opacity-90 glow-gold">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/auth">
            <Button variant="outline" size="lg" className="border-foreground/20 px-8 text-base text-foreground hover:bg-foreground/10">
              Join the Network
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  </section>
);

/* ───────────────── PAGE ───────────────── */
const AboutPage = () => (
  <div className="min-h-screen">
    <Navbar />
    <AboutHero />
    <MissionVision />
    <ImpactMetrics />
    <FounderMessage />
    <PartnersSection />
    <DarkVisionSection />
    <TeamSection />
    <ValuesSection />
    <TestimonialsSection />
    <FinalCTA />
    <Footer />
  </div>
);

export default AboutPage;
