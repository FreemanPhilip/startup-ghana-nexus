import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, MapPin, Type, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getRoleDashboardPath } from "@/lib/roleRouting";

const OnboardingPage = () => {
  const { user, profile, roles, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    headline: "",
    location: "",
  });

  // Pre-fill from profile if available (e.g. Google OAuth sets full_name)
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        headline: profile.headline || "",
        location: profile.location || "",
      });
      if (profile.avatar_url) setAvatarPreview(profile.avatar_url);
    }
  }, [profile]);

  // Handle Google OAuth role assignment (stored in localStorage)
  useEffect(() => {
    const pendingRole = localStorage.getItem("pending_role");
    if (pendingRole && user && roles.length === 0) {
      supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: pendingRole as any })
        .then(({ error }) => {
          if (!error) {
            localStorage.removeItem("pending_role");
            refreshProfile();
          }
        });
    }
  }, [user, roles.length]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!formData.full_name.trim()) {
      toast.error("Full name is required");
      return;
    }
    setSaving(true);
    try {
      let avatar_url = profile?.avatar_url || null;

      // Upload avatar if selected
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("startup-assets")
          .upload(path, avatarFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("startup-assets").getPublicUrl(path);
        avatar_url = urlData.publicUrl;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name.trim(),
          headline: formData.headline.trim() || null,
          location: formData.location.trim() || null,
          avatar_url,
          onboarding_step: "completed",
        })
        .eq("user_id", user.id);
      if (error) throw error;

      await refreshProfile();
      toast.success("Welcome to GSE! 🎉");

      // Redirect based on role
      const primaryRole = roles[0];
      navigate(getRoleDashboardPath(primaryRole), { replace: true });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const initials = formData.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <div className="flex min-h-screen bg-gradient-hero">
      <div className="container flex flex-col items-center justify-center py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-gold">
            <Star className="h-5 w-5 text-navy" fill="currentColor" />
          </div>
          <span className="font-display text-xl font-bold text-primary-foreground">GSE Portal</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl border border-border/20 bg-card p-8 shadow-2xl"
        >
          <h2 className="font-display text-2xl font-bold">Complete your profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Just a few details to get you started
          </p>

          <div className="mt-6 space-y-5">
            {/* Avatar upload */}
            <div className="flex flex-col items-center gap-3">
              <label htmlFor="avatar-upload" className="cursor-pointer group relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarPreview || undefined} />
                  <AvatarFallback className="bg-muted text-lg font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-5 w-5 text-white" />
                </div>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <span className="text-xs text-muted-foreground">Click to upload photo</span>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <div className="relative">
                <Type className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="full_name"
                  placeholder="Kwame Asante"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-2">
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                placeholder="e.g. CEO at TechNova | Fintech Enthusiast"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="location"
                  placeholder="Accra, Ghana"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={saving || !formData.full_name.trim()}
            className="mt-8 w-full bg-gradient-gold font-semibold text-navy hover:opacity-90"
          >
            {saving ? "Saving..." : "Get Started →"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default OnboardingPage;
