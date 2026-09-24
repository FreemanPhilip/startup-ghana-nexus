import lockupOnLight from "@/assets/sparkx-logo.png";
import lockupOnDark from "@/assets/sparkx-logo-white.png";
import markOnLight from "@/assets/sparkx-mark.png";
import markOnDark from "@/assets/sparkx-mark-white.png";

/** "lockup" is the full wordmark; "mark" is the square spark on its own. */
export type LogoVariant = "lockup" | "mark";

/**
 * Which background the logo sits on — not which logo file to use.
 *
 * "auto" follows the app's dark class and is right for ordinary surfaces.
 * Pass "dark" explicitly for a panel that is dark in both themes, such as the
 * gradient hero: there the theme says nothing about what the logo sits on.
 */
export type LogoTone = "auto" | "light" | "dark";

const ART: Record<LogoVariant, { onLight: string; onDark: string }> = {
  lockup: { onLight: lockupOnLight, onDark: lockupOnDark },
  mark: { onLight: markOnLight, onDark: markOnDark },
};

interface SparkXLogoProps {
  variant?: LogoVariant;
  tone?: LogoTone;
  /** Sizing classes. Set a height — the width follows the artwork. */
  className?: string;
  /**
   * Accessible name. Defaults to "SparkX"; pass "" where the logo sits beside
   * a text wordmark, so screen readers do not announce the brand twice.
   */
  alt?: string;
}

/**
 * The real SparkX logo.
 *
 * The portal used to draw a lucide star in a gold square as a stand-in for the
 * brand, in eight different places at four different sizes. The artwork has
 * been in src/assets the whole time; this renders it, and is the only place
 * that needs to know which file suits which background.
 */
const SparkXLogo = ({ variant = "lockup", tone = "auto", className = "h-8", alt = "SparkX" }: SparkXLogoProps) => {
  const art = ART[variant];
  const shared = `${variant === "mark" ? "" : "w-auto "}object-contain ${className}`;

  if (tone !== "auto") {
    return <img src={tone === "dark" ? art.onDark : art.onLight} alt={alt} className={shared} />;
  }

  // Swapped with CSS rather than a theme hook: the correct artwork is then in
  // the first paint, with no flash of the wrong one while React hydrates.
  return (
    <>
      <img src={art.onLight} alt={alt} className={`${shared} dark:hidden`} />
      <img src={art.onDark} alt="" aria-hidden="true" className={`${shared} hidden dark:block`} />
    </>
  );
};

export default SparkXLogo;
