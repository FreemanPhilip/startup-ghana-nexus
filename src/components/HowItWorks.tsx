import { Rocket, TrendingUp, GraduationCap, Building2 } from "lucide-react";
import ScrollStage, { type Chapter } from "@/components/marketing/ScrollStage";

/**
 * The four stakeholder groups, told as a scroll-pinned sequence rather than a
 * four-across card grid. Each audience gets the whole screen for a moment,
 * which is the point: a founder should read the founder chapter, not scan
 * four boxes and leave with none of them.
 */
const chapters: Chapter[] = [
  {
    id: "founders",
    kicker: "Build & Raise",
    title: "Startup Founders",
    description:
      "Showcase your startup, connect with investors, find mentors, and access exclusive funding opportunities.",
    icon: Rocket,
    points: ["Investor-ready profile", "Matched introductions", "Funding calls in one feed"],
  },
  {
    id: "investors",
    kicker: "Invest & Grow",
    title: "Investors",
    description: "Discover vetted startups, access deal flow, and use AI matching to find your next investment.",
    icon: TrendingUp,
    points: ["Verified deal flow", "AI-matched startups", "Shortlist and track"],
  },
  {
    id: "mentors",
    kicker: "Guide & Impact",
    title: "Mentors",
    description: "Share your expertise, book structured sessions, and shape the next generation of African founders.",
    icon: GraduationCap,
    points: ["Structured cohorts", "Session booking", "Impact you can see"],
  },
  {
    id: "partners",
    kicker: "Support & Scale",
    title: "Ecosystem Partners",
    description: "Promote accelerator programs, post opportunities, and engage with a thriving startup community.",
    icon: Building2,
    points: ["Programme listings", "Applicant pipeline", "Ecosystem reach"],
  },
];

const HowItWorks = () => (
  <ScrollStage chapters={chapters} eyebrow="Who is this for?" heading="One platform, every stakeholder." />
);

export default HowItWorks;
