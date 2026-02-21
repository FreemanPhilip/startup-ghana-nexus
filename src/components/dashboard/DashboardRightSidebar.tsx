import { CheckCircle, Target, Calendar, Video, Eye, BarChart3, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const DashboardRightSidebar = () => {
  const { profile } = useAuth();

  return (
    <aside className="hidden w-72 shrink-0 space-y-5 overflow-y-auto border-l border-border bg-card p-4 xl:block">
      {/* Premium verified card */}
      {profile?.membership === "premium" ? (
        <div className="rounded-xl bg-primary p-5 text-primary-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <div>
              <p className="text-sm font-bold">Premium Verified</p>
              <p className="text-[10px] uppercase tracking-wider opacity-80">Identity Confirmed</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed opacity-90">
            Your profile carries the ecosystem trust badge, increasing investor visibility by 3.5x.
          </p>
          <Button
            size="sm"
            variant="secondary"
            className="mt-3 w-full text-xs font-semibold"
          >
            Share Achievement
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <p className="text-sm font-bold">Upgrade to Premium</p>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Get verified, unlock direct messaging, and increase your visibility by 3.5x.
          </p>
          <Button
            size="sm"
            className="mt-3 w-full bg-gradient-gold text-navy font-semibold hover:opacity-90 text-xs"
          >
            Upgrade Now
          </Button>
        </div>
      )}

      {/* Funding Roadmap */}
      <div className="rounded-xl border border-border p-5">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold">Funding Roadmap</h3>
        </div>
        <div className="mt-4 flex items-center justify-center">
          <div className="relative flex h-28 w-28 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                strokeDasharray="65, 100"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-xl font-bold">65%</p>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Target Met</p>
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Raised</span>
            <span className="font-semibold">$325,000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Target</span>
            <span className="font-semibold">$500,000</span>
          </div>
        </div>
        <Button variant="outline" size="sm" className="mt-3 w-full text-xs">
          Update Financial Roadmap
        </Button>
      </div>

      {/* Mentorship */}
      <div className="rounded-xl border border-border p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold">Mentorship</h3>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="mt-3 space-y-3">
          {[
            { month: "OCT", day: "12", title: "Growth Marketing", mentor: "Ama Osei" },
            { month: "OCT", day: "15", title: "Regulatory Compliance", mentor: "Kwame Boateng" },
          ].map((session) => (
            <div key={session.day} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
              <div className="text-center">
                <p className="text-[9px] font-bold uppercase text-destructive">{session.month}</p>
                <p className="text-lg font-bold leading-none">{session.day}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-semibold">{session.title}</p>
                <p className="text-[10px] text-muted-foreground">{session.mentor}</p>
              </div>
              <Video className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="mt-3 w-full text-xs">
          Find New Mentor
        </Button>
      </div>

      {/* Profile Analytics */}
      <div className="rounded-xl border border-border p-5">
        <h3 className="text-sm font-bold">Profile Analytics</h3>
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Profile viewers</span>
            </div>
            <span className="text-xs font-bold text-primary">1,240</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Post impressions</span>
            </div>
            <span className="text-xs font-bold text-primary">8,432</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DashboardRightSidebar;
