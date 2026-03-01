import { useState, useEffect } from "react";
import { Type, MapPin, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  onNext: () => void;
  saving: boolean;
}

const OnboardingProfileStep = ({ onNext, saving: parentSaving }: Props) => {
  const { user, profile, refreshProfile } = useAuth();
  const [localSaving, setLocalSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    headline: "",
    location: "",
  });

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
    setLocalSaving(true);
    try {
      let avatar_url = profile?.avatar_url || null;
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
        })
        .eq("user_id", user.id);
      if (error) throw error;
      await refreshProfile();
      onNext();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLocalSaving(false);
    }
  };

  const initials = formData.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const isSaving = localSaving || parentSaving;

  return (
    <div className="w-full max-w-md rounded-2xl border border-border/20 bg-card p-8 shadow-2xl">
      <h2 className="font-display text-2xl font-bold">Complete your profile</h2>
      <p className="mt-1 text-sm text-muted-foreground">Just a few details to get you started</p>

      <div className="mt-6 space-y-5">
        {/* Avatar */}
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
          <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
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
        disabled={isSaving || !formData.full_name.trim()}
        className="mt-8 w-full bg-gradient-gold font-semibold text-navy hover:opacity-90"
      >
        {isSaving ? "Saving..." : "Continue →"}
      </Button>
    </div>
  );
};

export default OnboardingProfileStep;
