import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** Stagger position within a group. Each step adds 60ms. */
  index?: number;
  /** Travel distance in px. Larger for whole blocks, smaller for list items. */
  distance?: number;
  className?: string;
  as?: "div" | "section" | "li" | "figure";
}

/**
 * The one scroll-reveal used across the site.
 *
 * Every section previously wrote its own initial/whileInView/transition trio,
 * which drifted: different distances, different easings, some with a delay
 * that kept firing on re-entry. One component means the whole page rises with
 * the same hand.
 *
 * Honours prefers-reduced-motion by rendering the content already in place —
 * an immersive scroll should not be the reason someone cannot read the page.
 */
const Reveal = ({ children, index = 0, distance = 28, className = "", as = "div" }: RevealProps) => {
  const reduced = useReducedMotion();
  const Tag = motion[as];

  if (reduced) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <Tag
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px -8% 0px" }}
      transition={{ duration: 0.7, delay: Math.min(index, 5) * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
