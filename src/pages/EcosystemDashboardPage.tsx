import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { EcosystemDashboard } from "./HomePage";

const EcosystemDashboardPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="container mx-auto max-w-6xl px-4 pt-24 pb-16">
      <h1 className="text-2xl font-bold mb-6">Ecosystem dashboard</h1>
      <EcosystemDashboard />
    </main>
    <Footer />
  </div>
);

export default EcosystemDashboardPage;
