import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Star, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import solutionsImg from "@/assets/solutions-dropdown.jpg";

const solutionCategories = [
  {
    title: "BUILD & GROW",
    items: [
      { label: "SparkX Talent", href: "/sparkx-talent", desc: "Hiring & talent discovery" },
      { label: "SparkX Labs", href: "/sparkx-labs", desc: "Innovation & incubation" },
      { label: "SparkX Academy", href: "/sparkx-academy", desc: "Courses & training" },
    ],
  },
  {
    title: "FUND & ADVISE",
    items: [
      { label: "SparkX Advisory", href: "/sparkx-advisory", desc: "Mentorship & consulting" },
      { label: "SparkX Fund", href: "/sparkx-fund", desc: "Funding & capital access" },
    ],
  },
];

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Startups", href: "/startups" },
  { label: "Investors", href: "/investors" },
  { label: "Rankings", href: "/how-ranking-works" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const { session } = useAuth();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl"
    >
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-gold">
            <Star className="h-5 w-5 text-navy" fill="currentColor" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            SparkX Index
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.slice(0, 1).map((link) =>
            link.href.startsWith("/") ? (
              <Link key={link.label} to={link.href} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                {link.label}
              </Link>
            ) : (
              <a key={link.label} href={link.href} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                {link.label}
              </a>
            )
          )}

          {/* Solutions Mega Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
          >
            <button className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Solutions
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${productsOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {productsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.18 }}
                  className="absolute left-1/2 top-full -translate-x-1/2 pt-3"
                >
                  <div className="flex w-[620px] overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
                    {/* Left: Image + tagline */}
                    <div className="relative w-[200px] shrink-0 overflow-hidden">
                      <img
                        src={solutionsImg}
                        alt="SparkX Solutions"
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <p className="font-display text-base font-bold leading-tight text-white">
                          Fresh Perspectives,
                        </p>
                        <p className="font-display text-base font-bold leading-tight text-gold">
                          Unmatched Solutions
                        </p>
                      </div>
                    </div>

                    {/* Right: Categories */}
                    <div className="flex flex-1 gap-8 p-6">
                      {solutionCategories.map((cat) => (
                        <div key={cat.title} className="flex-1">
                          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                            {cat.title}
                          </p>
                          <div className="flex flex-col gap-1">
                            {cat.items.map((item) => (
                              <Link
                                key={item.label}
                                to={item.href}
                                className="group rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/10"
                              >
                                <span className="block text-sm font-medium text-foreground group-hover:text-primary">
                                  {item.label}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                  {item.desc}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {navLinks.slice(1).map((link) =>
            link.href.startsWith("/") ? (
              <Link key={link.label} to={link.href} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                {link.label}
              </Link>
            ) : (
              <a key={link.label} href={link.href} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                {link.label}
              </a>
            )
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {session ? (
            <Link to="/dashboard">
              <Button size="sm" className="bg-gradient-gold font-semibold text-navy hover:opacity-90">The Index</Button>
            </Link>
          ) : (
            <>
              <Link to="/auth"><Button variant="ghost" size="sm">Sign In</Button></Link>
              <Link to="/auth">
                <Button size="sm" className="bg-gradient-gold font-semibold text-navy hover:opacity-90">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-t border-border bg-background md:hidden"
        >
          <div className="container flex flex-col gap-1 py-4">
            {navLinks.map((link) =>
              link.href.startsWith("/") ? (
                <Link key={link.label} to={link.href} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>
                  {link.label}
                </Link>
              ) : (
                <a key={link.label} href={link.href} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>
                  {link.label}
                </a>
              )
            )}

            {/* Mobile Solutions Accordion */}
            <button
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted-foreground"
              onClick={() => setMobileProductsOpen(!mobileProductsOpen)}
            >
              Solutions
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${mobileProductsOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {mobileProductsOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden pl-4"
                >
                  {solutionCategories.map((cat) => (
                    <div key={cat.title} className="mb-2">
                      <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{cat.title}</p>
                      {cat.items.map((item) => (
                        <Link
                          key={item.label}
                          to={item.href}
                          className="block rounded-md px-3 py-2 text-sm text-muted-foreground"
                          onClick={() => { setMobileOpen(false); setMobileProductsOpen(false); }}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-2 flex flex-col gap-2">
              {session ? (
                <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full bg-gradient-gold font-semibold text-navy">The Index</Button>
                </Link>
              ) : (
                <>
                  <Link to="/auth" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full">Sign In</Button>
                  </Link>
                  <Link to="/auth" onClick={() => setMobileOpen(false)}>
                    <Button size="sm" className="w-full bg-gradient-gold font-semibold text-navy">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
