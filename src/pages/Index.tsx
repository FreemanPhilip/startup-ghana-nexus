import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorks from "@/components/HowItWorks";
import PlatformPreview from "@/components/PlatformPreview";
import TestimonialsSection from "@/components/TestimonialsSection";
import EcosystemStats from "@/components/EcosystemStats";
import PartnersSection from "@/components/PartnersSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar overHero />
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <PlatformPreview />
      <TestimonialsSection />
      <EcosystemStats />
      <PartnersSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
