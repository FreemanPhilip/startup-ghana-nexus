import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import MentorSearch from "./MentorSearch";
import MentorCategoryTabs from "./MentorCategoryTabs";
import MentorCard, { type MentorData } from "./MentorCard";
import MentorDetailPage from "./MentorDetailPage";
import { Loader2, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MentorsPageProps {
  onOpenMessages?: () => void;
}

const MentorsPage = ({ onOpenMessages }: MentorsPageProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedMentor, setSelectedMentor] = useState<MentorData | null>(null);

  // Fetch mentors (profiles with mentor role)
  const { data: mentors = [], isLoading } = useQuery({
    queryKey: ["mentors"],
    queryFn: async () => {
      // Get users with mentor role
      const { data: mentorRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "mentor");

      const mentorIds = mentorRoles?.map((r) => r.user_id) ?? [];

      if (mentorIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", mentorIds);

      // Transform to MentorData with mock stats for now
      return (profiles ?? []).map((p): MentorData => ({
        id: p.user_id,
        full_name: p.full_name || "Mentor",
        avatar_url: p.avatar_url,
        headline: p.headline,
        industry: p.industry,
        location: p.location,
        years_experience: p.years_experience,
        expertise: p.expertise,
        availability: p.availability,
        bio: p.bio,
        booking_url: (p as any).booking_url ?? null,
        sessions_count: Math.floor(Math.random() * 200) + 10,
        reviews_count: Math.floor(Math.random() * 50),
        rating: +(Math.random() * 2 + 3).toFixed(1),
        attendance_rate: Math.floor(Math.random() * 30) + 70,
      }));
    },
  });

  // Also show demo mentors if no real ones exist
  const demoMentors: MentorData[] = useMemo(() => [
    {
      id: "demo-1", full_name: "Kwame Asante", avatar_url: null,
      headline: "CEO & Founder at TechVentures Africa", industry: "FinTech",
      location: "Lagos, Nigeria", years_experience: 16, expertise: ["Fundraising", "Strategy", "FinTech"],
      availability: "available_now", bio: "Serial entrepreneur with 3 successful exits.",
      booking_url: "https://calendly.com", sessions_count: 171, reviews_count: 36, rating: 4.8, attendance_rate: 95,
    },
    {
      id: "demo-2", full_name: "Ama Mensah", avatar_url: null,
      headline: "VP of Product at AgriConnect | Ex-Google", industry: "AgriTech",
      location: "Nairobi, Kenya", years_experience: 12, expertise: ["Product", "AgriTech", "Leadership"],
      availability: "advance", bio: "Building Africa's food systems through technology.",
      booking_url: "https://calendly.com", sessions_count: 269, reviews_count: 48, rating: 4.9, attendance_rate: 88,
    },
    {
      id: "demo-3", full_name: "Yaw Boateng", avatar_url: null,
      headline: "Managing Partner at GoldCoast Ventures", industry: "FinTech",
      location: "Accra, Ghana", years_experience: 21, expertise: ["Fundraising", "Due Diligence", "Growth"],
      availability: "available_now", bio: "Invested in 40+ African startups.",
      booking_url: null, sessions_count: 149, reviews_count: 22, rating: 4.7, attendance_rate: 74,
    },
    {
      id: "demo-4", full_name: "Efua Owusu", avatar_url: null,
      headline: "CTO at HealthBridge Africa", industry: "HealthTech",
      location: "Cape Town, South Africa", years_experience: 9, expertise: ["Engineering", "HealthTech", "AI"],
      availability: "advance", bio: "Passionate about health innovation in West Africa.",
      booking_url: "https://calendly.com", sessions_count: 88, reviews_count: 15, rating: 4.6, attendance_rate: 91,
    },
    {
      id: "demo-5", full_name: "Kofi Adjei", avatar_url: null,
      headline: "Head of Growth at PayStack West Africa", industry: "FinTech",
      location: "Accra, Ghana", years_experience: 7, expertise: ["Growth", "Marketing", "FinTech"],
      availability: "available_now", bio: "Scaling startups across the continent.",
      booking_url: null, sessions_count: 126, reviews_count: 40, rating: 4.5, attendance_rate: 100,
    },
    {
      id: "demo-6", full_name: "Abena Darko", avatar_url: null,
      headline: "Data Science Lead at MTN Ghana", industry: "Data Science",
      location: "Accra, Ghana", years_experience: 10, expertise: ["Data Science", "AI", "Product"],
      availability: "available_now", bio: "Using data to solve Africa's biggest challenges.",
      booking_url: "https://calendly.com", sessions_count: 65, reviews_count: 8, rating: 4.4, attendance_rate: 80,
    },
    {
      id: "demo-7", full_name: "Nana Agyeman", avatar_url: null,
      headline: "Founder at EduTech Hub | TEDx Speaker", industry: "EdTech",
      location: "Cape Coast, Ghana", years_experience: 14, expertise: ["Leadership", "EdTech", "Fundraising"],
      availability: "advance", bio: "Empowering the next generation through education technology.",
      booking_url: null, sessions_count: 203, reviews_count: 55, rating: 4.9, attendance_rate: 92,
    },
    {
      id: "demo-8", full_name: "Akua Serwah", avatar_url: null,
      headline: "Senior Product Designer at Flutterwave", industry: "Product",
      location: "Accra, Ghana", years_experience: 6, expertise: ["Product", "Design", "UX"],
      availability: "available_now", bio: "Designing products that work for Africa.",
      booking_url: "https://calendly.com", sessions_count: 44, reviews_count: 12, rating: 4.3, attendance_rate: 85,
    },
  ], []);

  const allMentors = mentors.length > 0 ? mentors : demoMentors;

  // Filter mentors
  const filteredMentors = useMemo(() => {
    let result = allMentors;

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.full_name?.toLowerCase().includes(q) ||
          m.headline?.toLowerCase().includes(q) ||
          m.industry?.toLowerCase().includes(q) ||
          m.expertise?.some((e) => e.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (activeCategory === "available") {
      result = result.filter((m) => m.availability === "available_now");
    } else if (activeCategory === "top_rated") {
      result = [...result].sort((a, b) => b.rating - a.rating);
    } else if (activeCategory !== "all") {
      const catMap: Record<string, string[]> = {
        fintech: ["fintech", "finance", "payments"],
        agritech: ["agritech", "agriculture", "food"],
        healthtech: ["healthtech", "health", "medical"],
        engineering: ["engineering", "software", "tech"],
        product: ["product", "design", "ux"],
        data_science: ["data science", "ai", "machine learning", "data"],
        leadership: ["leadership", "management", "strategy"],
        fundraising: ["fundraising", "investment", "venture"],
        growth: ["growth", "marketing", "sales"],
      };
      const keywords = catMap[activeCategory] || [];
      result = result.filter(
        (m) =>
          keywords.some((kw) =>
            m.industry?.toLowerCase().includes(kw) ||
            m.expertise?.some((e) => e.toLowerCase().includes(kw)) ||
            m.headline?.toLowerCase().includes(kw)
          )
      );
    }

    return result;
  }, [allMentors, searchQuery, activeCategory]);

  const handleBookSession = (mentorId: string) => {
    const mentor = allMentors.find(m => m.id === mentorId);
    if (mentor) setSelectedMentor(mentor);
  };

  if (selectedMentor) {
    return <MentorDetailPage mentor={selectedMentor} onBack={() => setSelectedMentor(null)} onOpenMessages={onOpenMessages} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Users className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl font-bold text-foreground">Mentors</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Connect with experienced mentors across Ghana's startup ecosystem
        </p>
      </div>

      {/* Search */}
      <MentorSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Category tabs */}
      <MentorCategoryTabs
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{filteredMentors.length}</span> mentors
      </p>

      {/* Mentor grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredMentors.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-sm font-medium text-muted-foreground">No mentors found</p>
          <p className="mt-1 text-xs text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredMentors.map((mentor, i) => (
            <motion.div
              key={mentor.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <MentorCard mentor={mentor} onBookSession={handleBookSession} onViewProfile={() => setSelectedMentor(mentor)} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default MentorsPage;
