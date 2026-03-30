import { useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, ArrowLeft, Users, Lightbulb, GraduationCap, Briefcase, DollarSign, Globe, Calendar, Coffee, BookOpen, Mic, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface ProductData {
  title: string;
  tagline: string;
  heroDescription: string;
  icon: React.ReactNode;
  features: { title: string; description: string }[];
  benefits: string[];
  ctaText: string;
  stats: { value: string; label: string }[];
}

const productData: Record<string, ProductData> = {
  "sparkx-talent": {
    title: "SparkX Talent",
    tagline: "Discover Africa's Brightest Minds",
    heroDescription: "A talent marketplace connecting startups with skilled professionals across the African continent. Find developers, designers, marketers, growth hackers, and operators ready to build the future.",
    icon: <Users className="h-8 w-8" />,
    features: [
      { title: "Smart Job Matching", description: "AI-powered matching connects founders with the right talent based on skills, culture fit, and growth stage." },
      { title: "Verified Talent Pool", description: "Every professional in our network is vetted and verified, ensuring quality and reliability." },
      { title: "Pan-African Reach", description: "Access talent across 54 African countries — remote-first, continent-wide coverage." },
      { title: "Startup-Friendly Hiring", description: "Flexible engagement models from full-time hires to fractional roles, designed for startup budgets." },
    ],
    benefits: ["Access 10,000+ verified professionals", "Reduce hiring time by 60%", "Startup-optimized compensation models", "Cultural fit assessments included"],
    ctaText: "Find Talent Now",
    stats: [{ value: "10K+", label: "Professionals" }, { value: "54", label: "Countries" }, { value: "60%", label: "Faster Hiring" }, { value: "95%", label: "Match Rate" }],
  },
  "sparkx-labs": {
    title: "SparkX Labs",
    tagline: "Where Innovation Takes Shape",
    heroDescription: "Our innovation lab program helps early-stage startups validate ideas, build MVPs, and prepare for market entry with hands-on mentorship, technical resources, and rapid prototyping support.",
    icon: <Lightbulb className="h-8 w-8" />,
    features: [
      { title: "MVP Development", description: "Go from idea to functional product in weeks, not months, with dedicated technical support." },
      { title: "Market Validation", description: "Test your assumptions with real users and data-driven frameworks before scaling." },
      { title: "Technical Mentorship", description: "Work alongside experienced CTOs and engineers who've built and scaled products across Africa." },
      { title: "Launch Accelerator", description: "A structured 12-week program taking you from concept to market-ready product." },
    ],
    benefits: ["Rapid prototyping in 4-6 weeks", "Access to shared dev infrastructure", "Weekly technical office hours", "Demo day with 50+ investors"],
    ctaText: "Apply to Labs",
    stats: [{ value: "200+", label: "Startups Built" }, { value: "12", label: "Week Program" }, { value: "$2M+", label: "Raised by Alumni" }, { value: "85%", label: "Launch Rate" }],
  },
  "sparkx-advisory": {
    title: "SparkX Advisory",
    tagline: "Expert Guidance for Sustainable Growth",
    heroDescription: "Access seasoned advisors and consultants who specialize in scaling businesses across African markets. Get strategic advice tailored to your stage, sector, and ambition.",
    icon: <Briefcase className="h-8 w-8" />,
    features: [
      { title: "1-on-1 Advisory Sessions", description: "Book private sessions with industry veterans covering strategy, fundraising, operations, and growth." },
      { title: "Board-Level Guidance", description: "Engage experienced board members and advisors who bring governance expertise and investor networks." },
      { title: "Sector Specialists", description: "Advisors across fintech, healthtech, agritech, edtech, and more — each with deep domain knowledge." },
      { title: "Growth Playbooks", description: "Proven frameworks and templates used by Africa's fastest-growing startups." },
    ],
    benefits: ["Access 100+ vetted advisors", "Flexible engagement models", "Industry-specific guidance", "Confidential & trusted"],
    ctaText: "Get Advisory",
    stats: [{ value: "100+", label: "Advisors" }, { value: "15+", label: "Sectors" }, { value: "500+", label: "Sessions Delivered" }, { value: "4.9/5", label: "Rating" }],
  },
  "sparkx-academy": {
    title: "SparkX Academy",
    tagline: "Learn. Build. Scale.",
    heroDescription: "Comprehensive learning programs for founders, operators, and ecosystem builders. From fundraising masterclasses to growth marketing bootcamps — upskill with Africa's best instructors.",
    icon: <GraduationCap className="h-8 w-8" />,
    features: [
      { title: "Founder Bootcamps", description: "Intensive programs covering fundraising, product-market fit, team building, and go-to-market strategy." },
      { title: "On-Demand Courses", description: "Self-paced video courses taught by successful African founders and global experts." },
      { title: "Certification Programs", description: "Earn recognized credentials in startup management, venture capital, and ecosystem building." },
      { title: "Cohort Learning", description: "Learn alongside peers in structured cohorts with accountability and community support." },
    ],
    benefits: ["50+ courses available", "Learn from proven founders", "Earn industry certifications", "Lifetime access to content"],
    ctaText: "Start Learning",
    stats: [{ value: "5K+", label: "Students" }, { value: "50+", label: "Courses" }, { value: "30+", label: "Instructors" }, { value: "92%", label: "Completion Rate" }],
  },
  "sparkx-global": {
    title: "SparkX Global",
    tagline: "Take Africa to the World",
    heroDescription: "Our global expansion program helps African startups enter international markets through partnerships, soft-landing programs, cross-border networks, and strategic market entry support.",
    icon: <Globe className="h-8 w-8" />,
    features: [
      { title: "Market Entry Support", description: "Navigate regulatory, cultural, and operational challenges when expanding to new markets." },
      { title: "Soft-Landing Programs", description: "Establish presence in key global hubs — London, Dubai, Singapore, New York — with local support." },
      { title: "Cross-Border Partnerships", description: "Connect with international partners, distributors, and enterprise clients ready to work with African startups." },
      { title: "Global Investor Access", description: "Get introduced to international VCs and impact investors actively looking at African opportunities." },
    ],
    benefits: ["Presence in 8+ global hubs", "Regulatory & legal guidance", "International partner network", "Cultural bridge support"],
    ctaText: "Go Global",
    stats: [{ value: "8+", label: "Global Hubs" }, { value: "40+", label: "Startups Expanded" }, { value: "$50M+", label: "International Deals" }, { value: "15+", label: "Countries" }],
  },
  "sparkx-summit": {
    title: "SparkX Summit",
    tagline: "Where the Ecosystem Converges",
    heroDescription: "Africa's premier startup conference bringing together founders, investors, mentors, and ecosystem partners for networking, learning, deal-making, and celebrating African innovation.",
    icon: <Calendar className="h-8 w-8" />,
    features: [
      { title: "Annual Flagship Conference", description: "A 3-day event featuring keynotes, panels, workshops, and pitch competitions with 2,000+ attendees." },
      { title: "Investor Matchmaking", description: "Curated 1-on-1 meetings between startups and investors based on sector, stage, and investment thesis." },
      { title: "Startup Showcase", description: "Exhibition space for startups to demo products, attract customers, and build brand awareness." },
      { title: "Regional Roadshows", description: "Quarterly events across major African cities — Lagos, Nairobi, Cairo, Johannesburg, Accra." },
    ],
    benefits: ["2,000+ annual attendees", "200+ investors present", "Pitch competition prizes", "Pan-African roadshows"],
    ctaText: "Attend Summit",
    stats: [{ value: "2K+", label: "Attendees" }, { value: "200+", label: "Investors" }, { value: "$5M+", label: "Deals Closed" }, { value: "5", label: "Cities" }],
  },
  "sparkx-fund": {
    title: "SparkX Fund",
    tagline: "Fueling Africa's Next Unicorns",
    heroDescription: "Our investment vehicle backing high-potential African startups at pre-seed and seed stages. We provide capital, mentorship, network access, and hands-on support to help founders scale.",
    icon: <DollarSign className="h-8 w-8" />,
    features: [
      { title: "Pre-Seed & Seed Funding", description: "Cheque sizes from $25K to $500K for African startups with strong teams and scalable solutions." },
      { title: "Smart Capital", description: "Beyond funding — we provide mentorship, intros, operational support, and follow-on opportunities." },
      { title: "Sector Agnostic", description: "We invest across fintech, healthtech, agritech, edtech, logistics, and emerging sectors." },
      { title: "Founder-Friendly Terms", description: "Transparent, fair terms designed to protect founders while enabling growth." },
    ],
    benefits: ["$25K - $500K cheque sizes", "Hands-on portfolio support", "Follow-on funding support", "90-day decision process"],
    ctaText: "Apply for Funding",
    stats: [{ value: "$10M+", label: "Deployed" }, { value: "50+", label: "Portfolio Companies" }, { value: "3x", label: "Avg. Growth" }, { value: "70%", label: "Follow-on Rate" }],
  },
  "sparkx-lounge": {
    title: "SparkX Lounge",
    tagline: "Your Innovation Community Hub",
    heroDescription: "Premium co-working and community spaces designed for founders and innovators. Collaborate, network, and build in vibrant hubs across Africa with like-minded entrepreneurs.",
    icon: <Coffee className="h-8 w-8" />,
    features: [
      { title: "Co-Working Spaces", description: "Modern, well-equipped workspaces with high-speed internet, meeting rooms, and event areas." },
      { title: "Community Events", description: "Regular meetups, fireside chats, demo nights, and social events to build genuine connections." },
      { title: "Members-Only Perks", description: "Exclusive discounts on tools, services, and partner offerings for Lounge members." },
      { title: "Virtual Lounge", description: "Can't be there physically? Join our virtual community for remote networking and collaboration." },
    ],
    benefits: ["Hubs across major African cities", "24/7 access for members", "Regular community events", "Virtual membership option"],
    ctaText: "Join the Lounge",
    stats: [{ value: "5", label: "Physical Hubs" }, { value: "500+", label: "Members" }, { value: "100+", label: "Monthly Events" }, { value: "24/7", label: "Access" }],
  },
  "sparkx-magazine": {
    title: "SparkX Magazine",
    tagline: "Stories That Inspire Action",
    heroDescription: "In-depth features, founder stories, ecosystem analysis, and trend reports covering Africa's innovation landscape. Stay informed, stay inspired, stay ahead.",
    icon: <BookOpen className="h-8 w-8" />,
    features: [
      { title: "Founder Spotlights", description: "Deep-dive profiles of Africa's most innovative founders — their journeys, challenges, and lessons." },
      { title: "Market Intelligence", description: "Data-driven reports on African startup ecosystems, investment trends, and emerging opportunities." },
      { title: "Expert Columns", description: "Regular contributions from investors, operators, and thought leaders across the continent." },
      { title: "Quarterly Reports", description: "Comprehensive ecosystem reports covering funding trends, sector analysis, and market dynamics." },
    ],
    benefits: ["Weekly newsletter", "Quarterly ecosystem reports", "Exclusive founder interviews", "Free for all members"],
    ctaText: "Read Now",
    stats: [{ value: "50K+", label: "Readers" }, { value: "500+", label: "Articles" }, { value: "100+", label: "Founder Stories" }, { value: "Weekly", label: "Newsletter" }],
  },
  "sparkx-podcast": {
    title: "SparkX Podcast",
    tagline: "Voices of African Innovation",
    heroDescription: "Weekly conversations with founders, investors, and ecosystem leaders shaping the future of business and technology in Africa. Real stories, real insights, real impact.",
    icon: <Mic className="h-8 w-8" />,
    features: [
      { title: "Weekly Episodes", description: "New episodes every week featuring in-depth conversations with Africa's startup ecosystem leaders." },
      { title: "Founder Stories", description: "Raw, unfiltered accounts of building companies in Africa — the wins, the failures, and the lessons." },
      { title: "Investor Perspectives", description: "Hear from VCs and angel investors about what they look for, how they decide, and where they see opportunity." },
      { title: "Ecosystem Deep Dives", description: "Special series exploring specific sectors, markets, and trends shaping African innovation." },
    ],
    benefits: ["Available on all platforms", "New episode every week", "Full transcript included", "Guest nomination open"],
    ctaText: "Listen Now",
    stats: [{ value: "200+", label: "Episodes" }, { value: "100K+", label: "Downloads" }, { value: "4.8/5", label: "Rating" }, { value: "Weekly", label: "New Episodes" }],
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const ProductPage = () => {
  const location = useLocation();
  const slug = location.pathname.slice(1);
  const product = slug ? productData[slug] : null;

  if (!product) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container flex min-h-[60vh] flex-col items-center justify-center pt-16 text-center">
          <h1 className="font-display text-3xl font-bold">Product Not Found</h1>
          <Link to="/">
            <Button variant="outline" className="mt-4">Back to Home</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald/10 via-background to-background" />
        <div className="container relative z-10 py-20 md:py-28">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-gold text-navy">
                {product.icon}
              </div>
              <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
                {product.title}
              </h1>
              <p className="mt-2 font-display text-xl text-secondary md:text-2xl">{product.tagline}</p>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">{product.heroDescription}</p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/auth">
                  <Button size="lg" className="bg-gradient-gold font-semibold text-navy hover:opacity-90">
                    {product.ctaText} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button size="lg" variant="outline">Learn More</Button>
                </a>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp} className="grid grid-cols-2 gap-4">
              {product.stats.map((stat, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
                  <p className="font-display text-3xl font-bold text-primary">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-card py-20 md:py-28">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} className="text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">What We Offer</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Everything you need to succeed, built specifically for the African startup ecosystem.</p>
          </motion.div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2">
            {product.features.map((feature, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="rounded-xl border border-border bg-background p-8 transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Star className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-bold">{feature.title}</h3>
                <p className="mt-2 text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>
              <h2 className="font-display text-3xl font-bold md:text-4xl">Why Choose {product.title}?</h2>
              <p className="mt-4 text-muted-foreground">Built by Africans, for Africa — with a global standard of excellence.</p>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} variants={fadeUp}>
              <ul className="space-y-4">
                {product.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy py-20 text-center md:py-28">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>
            <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
              Ready to Get Started with {product.title}?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/70">
              Join thousands of founders, investors, and innovators building the future of Africa's startup ecosystem.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-gold font-semibold text-navy hover:opacity-90">
                  {product.ctaText}
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  Contact Us
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ProductPage;
