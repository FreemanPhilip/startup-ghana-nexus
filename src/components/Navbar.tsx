import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Star, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const solutions = [
  { label: "SparkX Talent", href: "/sparkx-talent", desc: "Hiring, talent discovery, job matching" },
  { label: "SparkX Labs", href: "/sparkx-labs", desc: "Innovation, product building, incubation" },
  { label: "SparkX Advisory", href: "/sparkx-advisory", desc: "Consulting, mentorship, expert guidance" },
  { label: "SparkX Academy", href: "/sparkx-academy", desc: "Learning, courses, training programs" },
  { label: "SparkX Fund", href: "/sparkx-fund", desc: "Investment, funding access, capital" },
];

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Pricing", href: "#pricing" },
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
              <Link
                key={link.label}
                to={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            )
          )}

          {/* Products Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
          >
            <button className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Products
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${productsOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {productsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-1/2 top-full -translate-x-1/2 pt-2"
                >
                  <div className="w-56 rounded-lg border border-border bg-card p-2 shadow-xl">
                    {products.map((product) => (
                      <Link
                        key={product.label}
                        to={product.href}
                        className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        {product.label}
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {navLinks.slice(2).map((link) =>
            link.href.startsWith("/") ? (
              <Link
                key={link.label}
                to={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            )
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {session ? (
            <Link to="/dashboard">
              <Button size="sm" className="bg-gradient-gold font-semibold text-navy hover:opacity-90">
                The Index
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/auth">
                <Button size="sm" className="bg-gradient-gold font-semibold text-navy hover:opacity-90">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
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
                <Link
                  key={link.label}
                  to={link.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              )
            )}

            {/* Mobile Products Accordion */}
            <button
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted-foreground"
              onClick={() => setMobileProductsOpen(!mobileProductsOpen)}
            >
              Products
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
                  {products.map((product) => (
                    <Link
                      key={product.label}
                      to={product.href}
                      className="block rounded-md px-3 py-2 text-sm text-muted-foreground"
                      onClick={() => { setMobileOpen(false); setMobileProductsOpen(false); }}
                    >
                      {product.label}
                    </Link>
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
