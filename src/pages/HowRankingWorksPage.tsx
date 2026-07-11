import { CheckCircle2, ShieldCheck, TrendingUp, Users, Clock, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const buckets = [
  {
    icon: CheckCircle2,
    title: "Profile Completeness",
    max: 30,
    description:
      "A well-documented startup is easier to trust and discover. Startups earn 5 points each for a logo, a description longer than 100 characters, a website, team size, founding year, and sector.",
    items: ["Logo (+5)", "Description over 100 characters (+5)", "Website (+5)", "Team size (+5)", "Founded year (+5)", "Sector (+5)"],
  },
  {
    icon: ShieldCheck,
    title: "Verification",
    max: 20,
    description:
      "Verified startups have been reviewed by the SparkX Index team or claimed by their founders. Verification adds a flat 20 points.",
    items: ["Verified badge (+20)"],
  },
  {
    icon: TrendingUp,
    title: "Funding Activity",
    max: 25,
    description:
      "Real funding signals momentum. Startups earn points for having any recorded round, for raising in the last 12 months, and for multiple rounds over time.",
    items: ["At least one funding round (+10)", "Round announced in the last 12 months (+10)", "More than one round (+5)"],
  },
  {
    icon: Users,
    title: "Engagement",
    max: 15,
    description:
      "Community traction matters. Claimed startups earn 1 point for every 5 followers on their SparkX profile, up to a maximum of 15.",
    items: ["1 point per 5 followers", "Capped at 15 points"],
  },
  {
    icon: Clock,
    title: "Freshness",
    max: 10,
    description:
      "Active profiles rank higher than stale ones. Startups earn the full 10 points if updated in the last 30 days, 5 points within 90 days, and 0 after that.",
    items: ["Updated within 30 days (+10)", "Updated within 90 days (+5)", "Older than 90 days (+0)"],
  },
];

const HowRankingWorksPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-16">
        <header className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" /> SparkX Score
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">How the SparkX Ranking Works</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Every startup on the SparkX Index is scored out of 100. The score blends five signals — profile depth,
            verification, funding traction, community engagement, and how fresh the information is.
          </p>
        </header>

        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-border bg-card p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Score breakdown</h2>
            <span className="text-sm text-muted-foreground">Total: 100</span>
          </div>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full">
            <div className="bg-emerald-500" style={{ width: "30%" }} title="Profile 30" />
            <div className="bg-blue-500" style={{ width: "20%" }} title="Verification 20" />
            <div className="bg-amber-500" style={{ width: "25%" }} title="Funding 25" />
            <div className="bg-purple-500" style={{ width: "15%" }} title="Engagement 15" />
            <div className="bg-rose-500" style={{ width: "10%" }} title="Freshness 10" />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />Profile 30</span>
            <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-blue-500" />Verification 20</span>
            <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500" />Funding 25</span>
            <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-purple-500" />Engagement 15</span>
            <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-500" />Freshness 10</span>
          </div>
        </div>

        <div className="mx-auto mt-8 grid max-w-4xl gap-4 md:grid-cols-2">
          {buckets.map(b => (
            <div key={b.title} className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <b.icon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{b.title}</h3>
                </div>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  up to {b.max} pts
                </span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{b.description}</p>
              <ul className="mt-3 space-y-1 text-sm">
                {b.items.map(it => (
                  <li key={it} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">How often does it update?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            SparkX Scores are recalculated automatically whenever a startup profile is edited or a funding round is
            added, and a full refresh runs every night to keep the index current across the entire ecosystem.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HowRankingWorksPage;
