import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import MentorSearch from "./MentorSearch";
import MentorCategoryTabs from "./MentorCategoryTabs";
import MentorCard, { type MentorData } from "./MentorCard";
import MentorDetailPage from "./MentorDetailPage";
import { Loader2, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { buildMentorSummary } from "@/lib/mentorMetrics";

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
        .from("public_profiles")
        .select("*")
        .in("user_id", mentorIds);

      return (profiles ?? []).map((p) => buildMentorSummary({
        user_id: p.user_id,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        headline: p.headline,
        industry: p.industry,
        location: p.location,
        years_experience: p.years_experience,
        expertise: p.expertise,
        availability: p.availability,
        bio: p.bio,
        booking_url: (p as any).booking_url ?? null,
        sessions_count: (p as any).sessions_count ?? null,
        reviews_count: (p as any).reviews_count ?? null,
        rating: (p as any).rating ?? null,
        attendance_rate: (p as any).attendance_rate ?? null,
      }));
    },
  });

  const allMentors = mentors;

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
          <h1 className="font-display text-2xl font-semibold text-foreground">Mentors</h1>
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
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <p className="text-sm font-medium text-muted-foreground">No mentors have been added yet</p>
          <p className="mt-1 text-xs text-muted-foreground">When mentor profiles are active in the network, they will appear here automatically.</p>
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
