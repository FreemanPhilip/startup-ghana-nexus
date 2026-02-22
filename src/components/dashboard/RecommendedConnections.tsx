import { Sparkles, Landmark, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const connections = [
  { name: "Accra Venture Partners", desc: "Early-stage FinTech", icon: Landmark },
  { name: "GCF Impact Fund", desc: "Series A Infrastructure", icon: DollarSign },
  { name: "Pan-African Angels", desc: "Pre-Seed emerging tech", icon: Users },
];

const RecommendedConnections = () => {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold">Recommended Connections</h3>
        </div>
        <button className="text-xs font-medium text-primary hover:underline">View all</button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {connections.map((c) => (
          <div key={c.name} className="flex flex-col items-center rounded-lg border border-border p-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <c.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-2 text-xs font-semibold leading-tight">{c.name}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{c.desc}</p>
            <Button variant="outline" size="sm" className="mt-3 h-7 w-full text-xs text-primary border-primary hover:bg-primary/5">
              Connect
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedConnections;
