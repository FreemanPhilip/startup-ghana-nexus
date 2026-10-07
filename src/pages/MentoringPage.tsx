import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CalendarCheck, ClipboardList, Users, Video, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Reveal from "@/components/marketing/Reveal";
import SectionHeading from "@/components/marketing/SectionHeading";
import sessionPhoto from "@/assets/solutions-dropdown.jpg";

/**
 * SparkX Mentoring.
 *
 * Mentoring runs inside the SparkX Index portal, so every route out of this
 * page lands on /auth — the one place a visitor can either sign in or create
 * the account the product needs. The page makes no claims it cannot back:
 * there are no counts of mentors or sessions, and no portraits standing in
 * for people who have not agreed to appear here. What it shows instead is
 * what the product actually does with a mentoring relationship.
 */

const heroIn = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08 } }),
};

const steps = [
  {
    icon: <Users className="h-5 w-5" />,
    title: "Get matched",
    body: "Tell us your sector, your stage and the problem in front of you. You are paired with an operator who has worked through the same thing, not whoever happens to be free.",
  },
  {
    icon: <CalendarCheck className="h-5 w-5" />,
    title: "Book a session",
    body: "Pick a slot from your mentor's real availability and set the agenda before you meet, so the half hour is spent on the work rather than on catching up.",
  },
  {
    icon: <ClipboardList className="h-5 w-5" />,
    title: "Keep the thread",
    body: "Notes and agreed actions stay attached to the relationship. The next session starts where the last one ended instead of from the beginning.",
  },
];

const forMentees = [
  "Matched on sector, stage and the problem you brought",
  "Sessions booked against real availability",
  "An agenda agreed before you meet",
  "Notes and actions that carry between sessions",
];

const forMentors = [
  "Set the hours you are free and keep them yours",
  "See who you are working with and what you agreed",
  "Mentees arrive with context, not a blank page",
  "Your hours and sessions tracked as you give them",
];

const MentoringPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />

    {/* ── Hero ──────────────────────────────────────────────────────────── */}
    <section className="bg-navy pt-16 text-white">
      <div className="container grid items-center gap-14 py-20 md:py-28 lg:grid-cols-2">
        <motion.div initial="hidden" animate="visible" variants={heroIn}>
          <span className="label-xs text-brand">SparkX Mentoring</span>
          <h1 className="display-lg mt-4">Structured mentorship sessions</h1>
          <p className="lede mt-5 max-w-xl text-white/70">
            Mentorship with a shape to it. Matched to someone who has done what you are doing,
            booked against a real calendar, and recorded so the next session builds on the last.
          </p>

          <div className="mt-9">
            <Link to="/auth">
              <Button size="lg" className="h-12 rounded-xl px-7 text-[15px] font-semibold">
                Get started <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* The link asked for: straight to the platform's sign-in. */}
          <p className="mt-4 text-sm text-white/55">
            Already have an account?{" "}
            <Link to="/auth" className="font-semibold text-white underline underline-offset-4 hover:text-brand">
              Log in
            </Link>
          </p>
        </motion.div>

        <motion.div initial="hidden" animate="visible" custom={1} variants={heroIn} className="relative">
          <img
            src={sessionPhoto}
            alt="Founders and mentors working together around a laptop"
            className="w-full rounded-2xl border border-white/10 object-cover shadow-2xl"
            loading="eager"
          />
          {/* A session as the portal renders one, sitting over the photo —
              the product rather than a stock illustration of it. */}
          <div className="absolute -bottom-6 -left-4 hidden w-64 rounded-xl border border-border bg-card p-4 shadow-2xl sm:block">
            <div className="flex items-center gap-2">
              <span className="a-mentor accent-tile h-8 w-8">
                <Video className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-foreground">Mentor session</p>
                <p className="text-[11px] text-muted-foreground">Thursday · 30 minutes</p>
              </div>
            </div>
            <div className="mt-3 space-y-1.5 border-t border-border pt-3">
              {["Pricing for the new tier", "Hiring the first engineer"].map((item) => (
                <p key={item} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <CheckCircle2 className="mt-px h-3 w-3 shrink-0 text-primary" aria-hidden="true" />
                  {item}
                </p>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>

    {/* ── How it works ──────────────────────────────────────────────────── */}
    <section className="section-y">
      <div className="container">
        <SectionHeading
          align="left"
          title="How mentoring works here"
          description="Three steps, and the third is the one most mentoring misses."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((step, i) => (
            <Reveal key={step.title} index={i} className="panel p-7">
              <div className="flex items-center gap-3">
                <span className="a-mentor accent-tile h-10 w-10">{step.icon}</span>
                <span className="numeric text-sm font-semibold text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{step.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>

    {/* ── Both sides of the relationship ────────────────────────────────── */}
    <section className="bg-card section-y">
      <div className="container grid gap-5 lg:grid-cols-2">
        {[
          { title: "If you are being mentored", items: forMentees },
          { title: "If you are mentoring", items: forMentors },
        ].map((col, i) => (
          <Reveal key={col.title} index={i} className="panel p-8 md:p-10">
            <h3 className="text-xl font-semibold">{col.title}</h3>
            <ul className="mt-6 space-y-3.5">
              {col.items.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15px] text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </section>

    {/* ── Close ─────────────────────────────────────────────────────────── */}
    <section className="bg-navy py-20 text-center text-white md:py-28">
      <div className="container">
        <h2 className="display-md mx-auto max-w-2xl">Find a mentor, or become one</h2>
        <p className="lede mx-auto mt-4 max-w-xl text-white/70">
          Mentoring runs inside SparkX Index, alongside the founders, investors and operators
          already there.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link to="/auth">
            <Button size="lg" className="h-12 rounded-xl px-7 text-[15px] font-semibold">
              Get started <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
          <Link
            to="/auth"
            className="text-sm font-semibold text-white underline underline-offset-4 hover:text-brand"
          >
            Log in
          </Link>
        </div>
      </div>
    </section>

    <Footer />
  </div>
);

export default MentoringPage;
