import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Building2, Users, DollarSign, Globe, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const EcosystemStats = () => {
  const [counts, setCounts] = useState({
    startups: 0,
    investors: 0,
    members: 0,
    opportunities: 0,
    groups: 0,
    mentors: 0,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchCounts = async () => {
      const [
        { count: startupCount },
        { count: investorCount },
        { count: memberCount },
        { count: oppCount },
        { count: groupCount },
        { count: mentorCount },
      ] = await Promise.all([
        supabase.from("startups").select("*", { count: "exact", head: true }),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "investor"),
        supabase.from("public_profiles").select("*", { count: "exact", head: true }),
        supabase.from("opportunities").select("*", { count: "exact", head: true }),
        supabase.from("groups").select("*", { count: "exact", head: true }),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "mentor"),
      ]);

      setCounts({
        startups: startupCount ?? 0,
        investors: investorCount ?? 0,
        members: memberCount ?? 0,
        opportunities: oppCount ?? 0,
        groups: groupCount ?? 0,
        mentors: mentorCount ?? 0,
      });
      setLoaded(true);
    };
    fetchCounts();
  }, []);

  const stats = [
    { icon: Building2, value: counts.startups, label: "Registered Startups", suffix: "" },
    { icon: Users, value: counts.members, label: "Ecosystem Members", suffix: "" },
    { icon: TrendingUp, value: counts.investors, label: "Active Investors", suffix: "" },
    { icon: Briefcase, value: counts.opportunities, label: "Opportunities Posted", suffix: "" },
    { icon: Globe, value: counts.groups, label: "Active Groups", suffix: "" },
    { icon: DollarSign, value: counts.mentors, label: "Mentors Available", suffix: "" },
  ];

  return (
    <section id="ecosystem" className="dark section-y relative isolate overflow-hidden bg-gradient-hero text-foreground">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-2xl text-center md:mb-20"
        >
          <span className="mb-3 inline-block rounded-full text-xs font-semibold uppercase tracking-[0.16em] text-brand">
            Ecosystem Intelligence
          </span>
          <h2 className="display-lg">
            Africa's Startup Ecosystem at a Glance
          </h2>
          <p className="lede mx-auto mt-5 max-w-[52ch]">
            Real-time data and insights powering smarter decisions for founders,
            investors, and policymakers.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-foreground/10 bg-foreground/5 p-6 backdrop-blur-sm"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
                  <stat.icon className="h-5 w-5 text-brand" />
                </div>
              </div>
              <p className="font-display text-3xl font-bold text-foreground">
                {loaded ? stat.value.toLocaleString() : "—"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EcosystemStats;
