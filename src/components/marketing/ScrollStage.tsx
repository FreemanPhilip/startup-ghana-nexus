import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export interface Chapter {
  id: string;
  kicker: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Three short proof lines shown beside the copy. */
  points: string[];
}

interface ScrollStageProps {
  chapters: Chapter[];
  eyebrow: string;
  heading: string;
}

const panel = {
  enter: { opacity: 0, y: 18 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -14 },
};

/**
 * A pinned section that advances one chapter at a time as the page scrolls.
 *
 * The section is N screens tall and its inner panel sticks for the whole
 * run, so scrolling moves you *through* the story rather than past it. The
 * scroll position is the only state: there is no autoplay and no timer, so
 * the reader sets the pace and can stop on any chapter.
 *
 * Under prefers-reduced-motion the whole thing degrades to a plain stacked
 * list — no pinning, no cross-fade, nothing that moves on its own.
 */
const ScrollStage = ({ chapters, eyebrow, heading }: ScrollStageProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    // Bias slightly into each band so a chapter is committed before it swaps.
    const next = Math.min(chapters.length - 1, Math.max(0, Math.floor(v * chapters.length + 0.08)));
    setActive((prev) => (prev === next ? prev : next));
  });

  if (reduced) {
    return (
      <section className="section-y border-t border-border bg-muted/30">
        <div className="container">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">{eyebrow}</p>
          <h2 className="display-lg mt-4 max-w-3xl">{heading}</h2>
          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {chapters.map((c) => (
              <article key={c.id} className="rounded-3xl border border-border bg-card p-8">
                <c.icon className="h-6 w-6 text-brand" aria-hidden="true" />
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {c.kicker}
                </p>
                <h3 className="display-md mt-2">{c.title}</h3>
                <p className="lede mt-3 text-base">{c.description}</p>
                <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                  {c.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const current = chapters[active];

  return (
    <section ref={ref} className="relative border-t border-border bg-muted/30" aria-label={heading}>
      <div style={{ height: `${chapters.length * 100}vh` }}>
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <div className="container w-full py-16">
            <div className="mb-10 lg:mb-14">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">{eyebrow}</p>
              <h2 className="display-md mt-3 max-w-2xl">{heading}</h2>
            </div>

            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.82fr)] lg:gap-16">
              <div className="min-h-[300px] sm:min-h-[280px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.id}
                    variants={panel}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {current.kicker}
                    </p>
                    <h3 className="display-md mt-3 max-w-xl">{current.title}</h3>
                    <p className="lede mt-4 max-w-[46ch]">{current.description}</p>
                    <ul className="mt-8 grid max-w-xl gap-x-8 gap-y-3 text-[13px] text-muted-foreground sm:grid-cols-3">
                      {current.points.map((p) => (
                        <li key={p} className="border-t border-border pt-3 leading-snug">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* A plate rather than an empty half: the chapter number gives
                  the eye somewhere to rest and makes the sequence legible at
                  a glance — you can see there are four of these. */}
              <div className="relative hidden aspect-[5/4] overflow-hidden rounded-[2rem] border border-border bg-background lg:block">
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-brand/[0.10] via-transparent to-transparent" />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 flex flex-col items-start justify-between p-10"
                  >
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-inset ring-brand/15">
                      <current.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <span
                      aria-hidden="true"
                      className="font-display text-[8rem] font-semibold leading-none tracking-[-0.06em] text-foreground/[0.07]"
                    >
                      {String(active + 1).padStart(2, "0")}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Progress doubles as a table of contents, so the reader always
                knows how far into the sequence they are. */}
            <ol className="mt-10 grid grid-cols-4 gap-2 lg:mt-14 lg:gap-4" aria-hidden="true">
              {chapters.map((c, i) => (
                <li key={c.id}>
                  <span
                    className={`block h-[2px] rounded-full transition-colors duration-500 ${
                      i <= active ? "bg-brand" : "bg-border"
                    }`}
                  />
                  <span
                    className={`mt-3 block truncate text-[13px] transition-colors duration-500 ${
                      i === active ? "font-medium text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {c.title}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScrollStage;
