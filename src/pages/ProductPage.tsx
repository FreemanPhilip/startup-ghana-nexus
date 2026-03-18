import { useLocation, Link } from "react-router-dom";
import { Star, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const productInfo: Record<string, { title: string; tagline: string; description: string }> = {
  "sparkx-talent": {
    title: "SparkX Talent",
    tagline: "Connect with Africa's brightest minds",
    description: "A talent marketplace connecting startups with skilled professionals across the African continent. Find developers, designers, marketers, and more.",
  },
  "sparkx-labs": {
    title: "SparkX Labs",
    tagline: "Innovation accelerated",
    description: "Our innovation lab program helps early-stage startups validate ideas, build MVPs, and prepare for market entry with hands-on mentorship and resources.",
  },
  "sparkx-advisory": {
    title: "SparkX Advisory",
    tagline: "Expert guidance for growth",
    description: "Access seasoned advisors and consultants who specialize in scaling businesses across African markets. Get strategic advice tailored to your stage and sector.",
  },
  "sparkx-academy": {
    title: "SparkX Academy",
    tagline: "Learn. Build. Scale.",
    description: "Comprehensive learning programs for founders, operators, and ecosystem builders. From fundraising masterclasses to growth marketing bootcamps.",
  },
  "sparkx-global": {
    title: "SparkX Global",
    tagline: "Take Africa to the world",
    description: "Our global expansion program helps African startups enter international markets through partnerships, soft-landing programs, and cross-border networks.",
  },
  "sparkx-summit": {
    title: "SparkX Summit",
    tagline: "Where the ecosystem converges",
    description: "Africa's premier startup conference bringing together founders, investors, mentors, and ecosystem partners for networking, learning, and deal-making.",
  },
  "sparkx-fund": {
    title: "SparkX Fund",
    tagline: "Fueling Africa's next unicorns",
    description: "Our investment vehicle backing high-potential African startups at pre-seed and seed stages. We provide capital, mentorship, and network access.",
  },
  "sparkx-lounge": {
    title: "SparkX Lounge",
    tagline: "Your co-working community",
    description: "Premium co-working and community spaces designed for founders and innovators. Collaborate, network, and build in vibrant hubs across Africa.",
  },
  "sparkx-magazine": {
    title: "SparkX Magazine",
    tagline: "Stories that inspire",
    description: "In-depth features, founder stories, ecosystem analysis, and trend reports covering Africa's innovation landscape.",
  },
  "sparkx-podcast": {
    title: "SparkX Podcast",
    tagline: "Voices of African innovation",
    description: "Weekly conversations with founders, investors, and ecosystem leaders shaping the future of business and technology in Africa.",
  },
};

const ProductPage = () => {
  const location = useLocation();
  const slug = location.pathname.slice(1); // e.g. "/sparkx-talent" → "sparkx-talent"
  const product = slug ? productInfo[slug] : null;

  if (!product) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container flex min-h-[60vh] flex-col items-center justify-center pt-16 text-center">
          <h1 className="font-display text-3xl font-bold">Product Not Found</h1>
          <Link to="/" className="mt-4">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="relative overflow-hidden bg-gradient-hero pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-navy/80 to-background" />
        <div className="container relative z-10 py-24 text-center md:py-32">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-gold mb-6">
            <Star className="h-8 w-8 text-navy" fill="currentColor" />
          </div>
          <h1 className="font-display text-4xl font-bold md:text-5xl">{product.title}</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">{product.tagline}</p>
        </div>
      </section>

      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-lg leading-relaxed text-muted-foreground">{product.description}</p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-gold font-semibold text-navy hover:opacity-90">
                Get Started
              </Button>
            </Link>
            <a href="#pricing">
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ProductPage;
