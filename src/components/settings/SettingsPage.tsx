import { useState, useEffect } from "react";
import { Moon, Sun, Monitor, Bell, Lock, Video, Calendar, Users, Globe, Shield, LogOut, Loader2, Crown, CheckCircle, ExternalLink, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import VerificationRequestDialog from "@/components/profile/VerificationRequestDialog";
import PremiumUpgradeDialog from "@/components/profile/PremiumUpgradeDialog";

interface SettingsPageProps {
  onSignOut: () => void;
}

type ThemeMode = "light" | "dark" | "system";

const integrations = [
  {
    id: "zoom",
    name: "Zoom",
    description: "Video conferencing for mentor sessions and meetings",
    icon: Video,
    color: "bg-primary/10 text-primary",
    connectUrl: "https://zoom.us/signin",
    helpText: "Sign in to Zoom, then paste your Personal Meeting ID below",
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Sync your sessions, events, and meetings",
    icon: Calendar,
    color: "bg-destructive/10 text-destructive",
    connectUrl: "https://calendar.google.com",
    helpText: "Use your Google Calendar to manage your availability",
  },
  {
    id: "google-meet",
    name: "Google Meet",
    description: "Video calls integrated with Calendar events",
    icon: Users,
    color: "bg-secondary/10 text-secondary",
    connectUrl: "https://meet.google.com",
    helpText: "Launch Google Meet for video sessions",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Get notifications and updates in your workspace",
    icon: Globe,
    color: "bg-accent/10 text-accent-foreground",
    connectUrl: "https://slack.com/signin",
    helpText: "Connect Slack to receive platform notifications",
  },
];

const SettingsPage = ({ onSignOut }: SettingsPageProps) => {
  const { user, profile, roles, isPremium, refreshProfile } = useAuth();
  const [activeSection, setActiveSection] = useState("appearance");
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [bookingUrl, setBookingUrl] = useState(profile?.booking_url || "");
  const [savingBooking, setSavingBooking] = useState(false);

  const [theme, setTheme] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem("theme") as ThemeMode | null;
    return stored || "system";
  });
  const [connectedApps, setConnectedApps] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem("connected_integrations") || "{}");
    } catch { return {}; }
  });

  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("notification_prefs") || '{"email":true,"push":true,"messages":true,"mentions":true,"updates":false}');
    } catch {
      return { email: true, push: true, messages: true, mentions: true, updates: false };
    }
  });

  const [privacyPrefs, setPrivacyPrefs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("privacy_prefs") || '{"profileVisible":true,"showOnline":true,"showActivity":true}');
    } catch {
      return { profileVisible: true, showOnline: true, showActivity: true };
    }
  });

  // Sync booking URL when profile loads
  useEffect(() => {
    if (profile?.booking_url) setBookingUrl(profile.booking_url);
  }, [profile]);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle("dark", e.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const saveNotifPrefs = (key: string, value: boolean) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    localStorage.setItem("notification_prefs", JSON.stringify(updated));
    toast({ title: "Notification preference updated" });
  };

  const savePrivacyPrefs = (key: string, value: boolean) => {
    const updated = { ...privacyPrefs, [key]: value };
    setPrivacyPrefs(updated);
    localStorage.setItem("privacy_prefs", JSON.stringify(updated));
    toast({ title: "Privacy setting updated" });
  };

  const toggleIntegration = (id: string) => {
    const app = integrations.find(i => i.id === id);
    const isConnected = connectedApps[id];

    if (isConnected) {
      // Disconnect
      const updated = { ...connectedApps, [id]: false };
      setConnectedApps(updated);
      localStorage.setItem("connected_integrations", JSON.stringify(updated));
      toast({ title: `Disconnected from ${app?.name}` });
    } else {
      // Open OAuth/service URL in new tab, then mark connected
      window.open(app?.connectUrl, "_blank", "noopener,noreferrer");
      const updated = { ...connectedApps, [id]: true };
      setConnectedApps(updated);
      localStorage.setItem("connected_integrations", JSON.stringify(updated));
      toast({
        title: `Connecting to ${app?.name}...`,
        description: "Complete the sign-in in the new tab. The integration will be active once authorized.",
      });
    }
  };

  const handleSaveBookingUrl = async () => {
    if (!user) return;
    setSavingBooking(true);
    const { error } = await supabase
      .from("profiles")
      .update({ booking_url: bookingUrl.trim() || null })
      .eq("user_id", user.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Booking link saved!" });
      await refreshProfile();
    }
    setSavingBooking(false);
  };

  const sections = [
    { id: "appearance", label: "Appearance", icon: Sun },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Lock },
    { id: "integrations", label: "Integrations", icon: Globe },
    { id: "account", label: "Account", icon: Shield },
  ];

  const verificationLabel = profile?.verification === "verified" ? "Verified" : profile?.verification === "pending" ? "Pending" : "Unverified";
  const isFounder = roles.includes("startup_founder");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account, preferences, and integrations.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar navigation */}
        <nav className="lg:w-52 shrink-0 space-y-1">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                activeSection === s.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <s.icon className="h-4 w-4" />
              {s.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 space-y-5">
          {/* ===== APPEARANCE ===== */}
          {activeSection === "appearance" && (
            <>
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-display font-bold text-base mb-1">Theme</h3>
                <p className="text-xs text-muted-foreground mb-5">Choose how the platform looks for you. This applies globally.</p>

                <div className="grid grid-cols-3 gap-3">
                  {([
                    { mode: "light" as ThemeMode, icon: Sun, label: "Light" },
                    { mode: "dark" as ThemeMode, icon: Moon, label: "Dark" },
                    { mode: "system" as ThemeMode, icon: Monitor, label: "System" },
                  ]).map(opt => (
                    <button
                      key={opt.mode}
                      onClick={() => setTheme(opt.mode)}
                      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                        theme === opt.mode
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        theme === opt.mode ? "bg-primary/10" : "bg-muted"
                      }`}>
                        <opt.icon className={`h-5 w-5 ${theme === opt.mode ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <span className={`text-sm font-medium ${theme === opt.mode ? "text-primary" : "text-muted-foreground"}`}>
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-display font-bold text-base mb-1">Display</h3>
                <p className="text-xs text-muted-foreground mb-5">Customize your viewing experience.</p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Compact Mode</p>
                      <p className="text-xs text-muted-foreground">Reduce spacing for a denser layout</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Animations</p>
                      <p className="text-xs text-muted-foreground">Enable smooth transitions and animations</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ===== NOTIFICATIONS ===== */}
          {activeSection === "notifications" && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-display font-bold text-base mb-1">Notification Preferences</h3>
              <p className="text-xs text-muted-foreground mb-5">Control how and when you receive notifications.</p>
              <div className="space-y-5">
                {[
                  { key: "email", label: "Email Notifications", desc: "Receive important updates via email" },
                  { key: "push", label: "Push Notifications", desc: "Browser push notifications for real-time alerts" },
                  { key: "messages", label: "Message Alerts", desc: "Get notified when you receive new messages" },
                  { key: "mentions", label: "Mentions & Tags", desc: "Notify when someone mentions you in a post" },
                  { key: "updates", label: "Product Updates", desc: "News about new features and improvements" },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notifPrefs[item.key]}
                      onCheckedChange={(v) => saveNotifPrefs(item.key, v)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== PRIVACY ===== */}
          {activeSection === "privacy" && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-display font-bold text-base mb-1">Privacy Settings</h3>
              <p className="text-xs text-muted-foreground mb-5">Control your visibility and data sharing preferences.</p>
              <div className="space-y-5">
                {[
                  { key: "profileVisible", label: "Public Profile", desc: "Allow others to view your profile" },
                  { key: "showOnline", label: "Online Status", desc: "Show when you're active on the platform" },
                  { key: "showActivity", label: "Activity Feed", desc: "Display your activity in the ecosystem feed" },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={privacyPrefs[item.key]}
                      onCheckedChange={(v) => savePrivacyPrefs(item.key, v)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== INTEGRATIONS ===== */}
          {activeSection === "integrations" && (
            <>
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-display font-bold text-base mb-1">Connected Apps</h3>
                <p className="text-xs text-muted-foreground mb-5">Connect your favorite tools to enhance your workflow.</p>
                <div className="space-y-4">
                  {integrations.map(app => (
                    <div key={app.id} className="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${app.color}`}>
                        <app.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{app.name}</p>
                          {connectedApps[app.id] && (
                            <Badge className="text-[10px] bg-secondary/10 text-secondary border-0">Connected</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{app.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {connectedApps[app.id] && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs gap-1"
                            onClick={() => window.open(app.connectUrl, "_blank", "noopener,noreferrer")}
                          >
                            <ExternalLink className="h-3 w-3" /> Open
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant={connectedApps[app.id] ? "outline" : "default"}
                          className="text-xs"
                          onClick={() => toggleIntegration(app.id)}
                        >
                          {connectedApps[app.id] ? "Disconnect" : "Connect"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-display font-bold text-base mb-1">Calendar Sync</h3>
                <p className="text-xs text-muted-foreground mb-4">Paste your booking link so others can schedule time with you.</p>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Booking URL (Calendly, Cal.com, etc.)</Label>
                    <Input
                      placeholder="https://calendly.com/your-link"
                      value={bookingUrl}
                      onChange={e => setBookingUrl(e.target.value)}
                    />
                  </div>
                  <Button
                    size="sm"
                    className="text-xs gap-1.5"
                    onClick={handleSaveBookingUrl}
                    disabled={savingBooking}
                  >
                    {savingBooking ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    Save Booking Link
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* ===== ACCOUNT ===== */}
          {activeSection === "account" && (
            <>
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-display font-bold text-base mb-1">Account Details</h3>
                <p className="text-xs text-muted-foreground mb-5">Your account information and status.</p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>

                  {/* Verification — functional */}
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <div>
                      <p className="text-sm font-medium">Verification Status</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`text-[10px] capitalize ${
                          profile?.verification === "verified" ? "border-secondary text-secondary" :
                          profile?.verification === "pending" ? "border-primary text-primary" : ""
                        }`}>
                          {profile?.verification === "verified" && <CheckCircle className="h-3 w-3 mr-1" />}
                          {verificationLabel}
                        </Badge>
                        {profile?.verification === "pending" && (
                          <span className="text-[10px] text-muted-foreground">Under review — we'll notify you</span>
                        )}
                      </div>
                    </div>
                    {profile?.verification === "unverified" && (
                      <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => setVerifyOpen(true)}>
                        <Shield className="h-3.5 w-3.5" /> Request Verification
                      </Button>
                    )}
                  </div>

                  {/* Membership — functional, founder-only upgrade */}
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <div>
                      <p className="text-sm font-medium">Membership</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-[10px] ${isPremium ? "bg-gradient-gold text-primary-foreground border-0" : ""}`}>
                          {isPremium ? "Premium" : "Standard"}
                        </Badge>
                        {isPremium && (
                          <span className="text-[10px] text-muted-foreground">All features unlocked</span>
                        )}
                      </div>
                    </div>
                    {isFounder && (
                      <Button
                        size="sm"
                        className={`text-xs gap-1.5 ${isPremium ? "" : "bg-gradient-gold border-0"}`}
                        variant={isPremium ? "outline" : "default"}
                        onClick={() => setUpgradeOpen(true)}
                      >
                        <Crown className="h-3.5 w-3.5" />
                        {isPremium ? "Manage Subscription" : "Upgrade to Premium"}
                      </Button>
                    )}
                    {!isFounder && !isPremium && (
                      <span className="text-[10px] text-muted-foreground">Premium available for startup founders</span>
                    )}
                  </div>

                  {/* Roles */}
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <div>
                      <p className="text-sm font-medium">Roles</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {roles.length === 0 ? (
                          <span className="text-xs text-muted-foreground">No roles assigned</span>
                        ) : (
                          roles.map(r => (
                            <Badge key={r} variant="outline" className="text-[10px] capitalize">{r.replace("_", " ")}</Badge>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">Member Since</p>
                      <p className="text-xs text-muted-foreground">
                        {profile ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-destructive/30 bg-card p-6">
                <h3 className="font-display font-bold text-base mb-1 text-destructive">Danger Zone</h3>
                <p className="text-xs text-muted-foreground mb-4">These actions are irreversible. Proceed with caution.</p>
                <div className="flex gap-3">
                  <Button variant="outline" className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10 gap-1.5" onClick={onSignOut}>
                    <LogOut className="h-3.5 w-3.5" /> Sign Out
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <VerificationRequestDialog open={verifyOpen} onOpenChange={setVerifyOpen} />
      <PremiumUpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
};

export default SettingsPage;
