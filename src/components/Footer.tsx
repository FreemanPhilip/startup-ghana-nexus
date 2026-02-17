import { Star } from "lucide-react";

const footerLinks = {
  Platform: ["For Startups", "For Investors", "For Mentors", "Opportunities", "Pricing"],
  Resources: ["Blog", "Events", "Reports", "API Docs", "Help Center"],
  Company: ["About AGS", "Team", "Careers", "Press", "Contact"],
  Legal: ["Terms of Service", "Privacy Policy", "Cookie Policy"],
};

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card py-16">
      <div className="container">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <a href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-gold">
                <Star className="h-5 w-5 text-navy" fill="currentColor" />
              </div>
              <span className="font-display text-xl font-bold">AGS</span>
            </a>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Powering Ghana's startup ecosystem through connection, mentorship,
              and data-driven intelligence.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-4 font-display text-sm font-bold">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © 2026 Association of Ghana Startups. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground">
              Twitter
            </a>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground">
              LinkedIn
            </a>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground">
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
