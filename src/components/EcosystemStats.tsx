import { motion } from "framer-motion";
import { TrendingUp, Building2, Users, DollarSign, Globe, Briefcase } from "lucide-react";

const stats = [
  { icon: Building2, value: "500+", label: "Registered Startups", change: "+12% this quarter" },
  { icon: DollarSign, value: "$25M+", label: "Total Funding Raised", change: "+$3.2M this month" },
  { icon: Users, value: "200+", label: "Active Investors", change: "18 new this month" },
  { icon: TrendingUp, value: "85%", label: "Match Success Rate", change: "+5% improvement" },
  { icon: Globe, value: "12", label: "Regions Covered", change: "Across Ghana" },
  { icon: Briefcase, value: "150+", label: "Opportunities Posted", change: "34 active now" },
];

const EcosystemStats = () => {
  return (
    <section id="ecosystem" className="bg-gradient-hero py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <span className="mb-3 inline-block rounded-full border border-emerald/30 bg-emerald/10 px-4 py-1 text-sm font-semibold text-emerald-light">
            Ecosystem Intelligence
          </span>
          <h2 className="font-display text-3xl font-bold text-primary-foreground sm:text-4xl md:text-5xl">
            Ghana's Startup Ecosystem at a Glance
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/60">
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
              className="rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 p-6 backdrop-blur-sm"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                  <stat.icon className="h-5 w-5 text-gold" />
                </div>
                <span className="text-xs font-medium text-emerald-light">
                  {stat.change}
                </span>
              </div>
              <p className="font-display text-3xl font-bold text-primary-foreground">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-primary-foreground/50">
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
