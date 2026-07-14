import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is SparkX Index?",
    answer:
      "SparkX Index is Africa's premier startup ecosystem platform — a data-driven social network connecting founders, investors, mentors, and ecosystem partners. It combines startup profiles, investor matching, mentorship booking, opportunities, and real-time ecosystem intelligence in one place.",
  },
  {
    question: "Who can join the platform?",
    answer:
      "Anyone operating in Africa's startup ecosystem: startup founders and teams, angel investors and VCs, industry mentors and advisors, and ecosystem support organizations like incubators, accelerators, and development agencies.",
  },
  {
    question: "Is it free to use?",
    answer:
      "Yes — the Standard plan is completely free and includes a startup profile, community feed access, opportunity browsing, and 3 mentor sessions per month. Premium ($49/month) unlocks verified badges, unlimited mentor sessions, direct messaging, advanced search, featured listings, and exclusive funding opportunities.",
  },
  {
    question: "How does verification work?",
    answer:
      "We use a KYC-based verification process. Upload your identification documents and business registration through the platform. Our team reviews submissions within 48 hours. Verified profiles receive a trust badge visible to investors and partners, increasing your credibility in the ecosystem.",
  },
  {
    question: "Can investors directly message startups?",
    answer:
      "Premium members can send direct messages to any verified startup on the platform. Standard members can interact through the community feed and book mentor sessions. All messaging is encrypted and monitored for quality.",
  },
  {
    question: "How are mentor sessions booked?",
    answer:
      "Browse available mentors by expertise, industry, or availability. Standard members get 3 free sessions per month; Premium members get unlimited sessions. Sessions are booked through the calendar integration and can be conducted via video call or in-person at partner locations.",
  },
  {
    question: "What data is shown on the ecosystem dashboard?",
    answer:
      "The dashboard provides real-time analytics: registered startups by stage and industry, active investors and their focus areas, funding trends, mentor availability, opportunity listings, and regional ecosystem health metrics — all sourced from live platform data.",
  },
  {
    question: "How do I get started?",
    answer:
      "Click 'Get Started' to create your free account. Select your role (Founder, Investor, Mentor, or Partner), complete your profile, and you're live. The onboarding wizard walks you through each step in under 5 minutes.",
  },
];

const FAQSection = () => {
  return (
    <section className="py-24">
      <div className="container max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
            <HelpCircle className="h-3 w-3" />
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Frequently Asked{" "}
            <span className="text-gradient-gold">Questions</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Everything you need to know about getting started with SparkX Index.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-xl border border-border bg-card px-5 data-[state=open]:border-gold/30 transition-colors"
              >
                <AccordionTrigger className="text-sm font-display font-semibold text-foreground hover:no-underline hover:text-gold py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
