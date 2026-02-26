import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

interface InvestorView {
  id: string;
  investor_id: string;
  investor_name: string;
  investor_icon: string | null;
  viewed_at: string;
  timeAgo: string;
}

interface ShortlistedInvestor {
  id: string;
  investor_id: string;
  investor_name: string;
  investor_data: any;
  created_at: string;
}

export function useInvestorTracking() {
  const { user } = useAuth();
  const [recentViews, setRecentViews] = useState<InvestorView[]>([]);
  const [shortlisted, setShortlisted] = useState<ShortlistedInvestor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchViews = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("investor_views")
      .select("*")
      .eq("user_id", user.id)
      .order("viewed_at", { ascending: false })
      .limit(5);

    setRecentViews(
      (data ?? []).map((v: any) => ({
        ...v,
        timeAgo: `Viewed ${formatDistanceToNow(new Date(v.viewed_at), { addSuffix: false })} ago`,
      }))
    );
  }, [user]);

  const fetchShortlisted = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("investor_shortlists")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setShortlisted((data as ShortlistedInvestor[]) ?? []);
  }, [user]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchViews(), fetchShortlisted()]);
      setLoading(false);
    };
    load();
  }, [fetchViews, fetchShortlisted]);

  const trackView = useCallback(async (investorId: string, investorName: string, investorIcon?: string) => {
    if (!user) return;
    // Upsert: delete old view of same investor, insert new
    await supabase
      .from("investor_views")
      .delete()
      .eq("user_id", user.id)
      .eq("investor_id", investorId);

    await supabase.from("investor_views").insert({
      user_id: user.id,
      investor_id: investorId,
      investor_name: investorName,
      investor_icon: investorIcon || null,
    } as any);

    fetchViews();
  }, [user, fetchViews]);

  const toggleShortlist = useCallback(async (investorId: string, investorName: string, investorData?: any) => {
    if (!user) return;
    const existing = shortlisted.find(s => s.investor_id === investorId);
    if (existing) {
      await supabase.from("investor_shortlists").delete().eq("id", existing.id);
    } else {
      await supabase.from("investor_shortlists").insert({
        user_id: user.id,
        investor_id: investorId,
        investor_name: investorName,
        investor_data: investorData || {},
      } as any);
    }
    fetchShortlisted();
  }, [user, shortlisted, fetchShortlisted]);

  const isShortlisted = useCallback((investorId: string) => {
    return shortlisted.some(s => s.investor_id === investorId);
  }, [shortlisted]);

  const clearHistory = useCallback(async () => {
    if (!user) return;
    await supabase.from("investor_views").delete().eq("user_id", user.id);
    setRecentViews([]);
  }, [user]);

  return {
    recentViews,
    shortlisted,
    loading,
    trackView,
    toggleShortlist,
    isShortlisted,
    clearHistory,
    refetchShortlisted: fetchShortlisted,
  };
}
