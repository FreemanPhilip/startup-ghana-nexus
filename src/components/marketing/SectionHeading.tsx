import Reveal from "@/components/marketing/Reveal";

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
 * page stepped between three type scales on the way down. The scale lives in
 * index.css (.display-lg, .lede); sections choose alignment, not sizes.
 *
 * The eyebrow is set as plain tracked caps rather than a tinted pill — at six
 * bands down a page, six coloured chips read as decoration competing with the
 * headings they are meant to introduce.
 */
const SectionHeading = ({
  eyebrow,
  title,
  description,
  align = "center",
  className = "",
}: SectionHeadingProps) => (
  <Reveal className={`${align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"} ${className}`}>
    {eyebrow && (
      <p className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-brand">{eyebrow}</p>
    )}
    <h2 className="display-lg">{title}</h2>
    {description && <p className={`lede mt-5 ${align === "center" ? "mx-auto max-w-[52ch]" : "max-w-[52ch]"}`}>{description}</p>}
  </Reveal>
);

export default SectionHeading;
