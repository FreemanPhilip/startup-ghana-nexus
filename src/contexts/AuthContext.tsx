import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type AppRole = Database["public"]["Enums"]["app_role"];

interface SubscriptionInfo {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  primaryRole: AppRole | null;
  loading: boolean;
  subscription: SubscriptionInfo;
  isPremium: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    subscribed: false,
    product_id: null,
    subscription_end: null,
  });

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc("get_own_profile");

      if (error) {
        throw error;
      }

      setProfile((data && data[0]) ?? null);
    } catch (error) {
      console.warn("Unable to load profile for user:", error);
      setProfile(null);
    }
  };

  const fetchRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        throw error;
      }

      setRoles(data?.map((r) => r.role) ?? []);
    } catch (error) {
      console.warn("Unable to load user roles:", error);
      setRoles([]);
    }
  };

  const checkSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (!error && data) {
        setSubscription({
          subscribed: data.subscribed ?? false,
          product_id: data.product_id ?? null,
          subscription_end: data.subscription_end ?? null,
        });
        // Refresh profile to get updated membership
        if (user) {
          await fetchProfile(user.id);
        }
      }
    } catch {
      // Silently fail — subscription check is non-critical
    }
  }, [user]);

  const refreshProfile = async () => {
    if (user) {
      await Promise.all([fetchProfile(user.id), fetchRoles(user.id)]);
    }
  };

  useEffect(() => {
    const applySession = async (nextSession: Session | null) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setProfile(null);
        setRoles([]);
        setSubscription({ subscribed: false, product_id: null, subscription_end: null });
        setLoading(false);
        return;
      }

      setLoading(true);
      await Promise.allSettled([
        fetchProfile(nextSession.user.id),
        fetchRoles(nextSession.user.id),
      ]);
      setLoading(false);
    };

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await applySession(session);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      void applySession(session);
    });

    return () => authSub.unsubscribe();
  }, []);

  // Check subscription on login
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => checkSubscription(), 1000);
      return () => clearTimeout(timer);
    }
  }, [user, checkSubscription]);

  // Periodic subscription check every 5 minutes
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(checkSubscription, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const isPremium = profile?.membership === "premium" || subscription.subscribed;
  const primaryRole: AppRole | null = roles.length > 0 ? roles[0] : null;

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRoles([]);
    setSubscription({ subscribed: false, product_id: null, subscription_end: null });
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, roles, primaryRole, loading, subscription, isPremium, signOut, refreshProfile, checkSubscription }}>
      {children}
    </AuthContext.Provider>
  );
};
