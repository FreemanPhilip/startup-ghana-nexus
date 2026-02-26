import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Standard",
    price: "Free",
    description: "Get started and explore the ecosystem.",
    features: [
      "Basic startup profile",
      "Browse opportunities",
      "Community feed access",
      "3 mentor session requests/month",
      "Basic search filters",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Premium",
    price: "GH₵149",
    period: "/month",
    description: "Unlock the full power of AGS.",
    features: [
      "Verified profile badge",
      "Advanced search & matching",
      "Unlimited mentor bookings",
      "Direct messaging to anyone",
      "Featured listing on homepage",
      "Exclusive funding opportunities",
      "Ecosystem reports download",
      "Priority support",
    ],
    cta: "Go Premium",
    highlighted: true,
  },
];

const PricingSection = () => {
  return (
    <section className="py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <span className="mb-3 inline-block rounded-full bg-gold/10 px-4 py-1 text-sm font-semibold text-gold">
            Membership
          </span>
          <h2 className="font-display text-3xl font-bold sm:text-4xl md:text-5xl">
            Choose Your Plan
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Start free and upgrade when you're ready to unlock premium ecosystem access.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className={`relative rounded-2xl border p-8 ${
                plan.highlighted
                  ? "border-gold/50 bg-card glow-gold"
                  : "border-border bg-card"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-gold px-3 py-1 text-xs font-bold text-navy">
                    <Star className="h-3 w-3" fill="currentColor" /> Most Popular
                  </span>
                </div>
              )}
              <h3 className="font-display text-xl font-bold">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold">{plan.price}</span>
                {plan.period && (
                  <span className="text-muted-foreground">{plan.period}</span>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className={`mt-8 w-full ${
                  plan.highlighted
                    ? "bg-gradient-gold font-semibold text-navy hover:opacity-90"
                    : ""
                }`}
                variant={plan.highlighted ? "default" : "outline"}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
