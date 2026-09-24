import { motion } from "framer-motion";

interface SectionHeadingProps {
  /** Small label above the title. */
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
}

/**
 * One heading treatment for every marketing band.
 *
 * Each section used to size its own eyebrow, title and description, so the
 * page stepped between three different type scales on the way down. This
 * fixes the scale in one place; sections choose alignment, not sizes.
 */
const SectionHeading = ({
  eyebrow,
  title,
  description,
  align = "center",
  className = "",
}: SectionHeadingProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    className={`${align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"} ${className}`}
  >
    {eyebrow && (
      <span className="mb-4 inline-block rounded-full border border-brand/25 bg-brand/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand">
        {eyebrow}
      </span>
    )}
    <h2 className="font-display text-3xl font-bold tracking-[-0.02em] text-balance sm:text-4xl md:text-[2.75rem] md:leading-[1.1]">
      {title}
    </h2>
    {description && (
      <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg">{description}</p>
    )}
  </motion.div>
);

export default SectionHeading;
