import { useState, useEffect, useRef } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditStartupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startup: {
    id: string;
    name: string;
    short_description: string | null;
    industry: string | null;
    stage: string | null;
    location: string | null;
    logo_url: string | null;
    website_url: string | null;
    linkedin_url: string | null;
    mission?: string | null;
    vision?: string | null;
    twitter_url?: string | null;
    instagram_url?: string | null;
    facebook_url?: string | null;
  };
  onUpdated: () => void;
}

const INDUSTRIES = ["FinTech", "HealthTech", "EdTech", "AgriTech", "E-Commerce", "CleanTech", "AI/ML", "Logistics", "SaaS", "Other"];
const STAGES = ["Idea", "Pre-Seed", "Seed", "Series A", "Series B", "Growth", "Established"];

const EditStartupDialog = ({ open, onOpenChange, startup, onUpdated }: EditStartupDialogProps) => {
  const [name, setName] = useState(startup.name);
  const [description, setDescription] = useState(startup.short_description ?? "");
  const [industry, setIndustry] = useState(startup.industry ?? "");
  const [stage, setStage] = useState(startup.stage ?? "");
  const [location, setLocation] = useState(startup.location ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(startup.website_url ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(startup.linkedin_url ?? "");
  const [logoUrl, setLogoUrl] = useState(startup.logo_url ?? "");
  const [mission, setMission] = useState(startup.mission ?? "");
  const [vision, setVision] = useState(startup.vision ?? "");
  const [twitterUrl, setTwitterUrl] = useState(startup.twitter_url ?? "");
  const [instagramUrl, setInstagramUrl] = useState(startup.instagram_url ?? "");
  const [facebookUrl, setFacebookUrl] = useState(startup.facebook_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(startup.name);
      setDescription(startup.short_description ?? "");
      setIndustry(startup.industry ?? "");
      setStage(startup.stage ?? "");
      setLocation(startup.location ?? "");
      setWebsiteUrl(startup.website_url ?? "");
      setLinkedinUrl(startup.linkedin_url ?? "");
      setLogoUrl(startup.logo_url ?? "");
      setMission(startup.mission ?? "");
      setVision(startup.vision ?? "");
      setTwitterUrl(startup.twitter_url ?? "");
      setInstagramUrl(startup.instagram_url ?? "");
      setFacebookUrl(startup.facebook_url ?? "");
    }
  }, [open, startup]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${startup.id}/logo.${ext}`;
      const { error } = await supabase.storage.from("startup-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("startup-assets").getPublicUrl(path);
      setLogoUrl(publicUrl);
    } catch (err: any) {
      toast.error("Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("startups").update({
        name: name.trim(),
        short_description: description.trim() || null,
        industry: industry || null,
        stage: stage || null,
        location: location.trim() || null,
        logo_url: logoUrl || null,
        website_url: websiteUrl.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        mission: mission.trim() || null,
        vision: vision.trim() || null,
        twitter_url: twitterUrl.trim() || null,
        instagram_url: instagramUrl.trim() || null,
        facebook_url: facebookUrl.trim() || null,
      } as any).eq("id", startup.id);
      if (error) throw error;
      toast.success("Startup profile updated");
      onUpdated();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Edit Startup Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 rounded-xl cursor-pointer" onClick={() => fileRef.current?.click()}>
              <AvatarImage src={logoUrl || undefined} />
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-xl font-bold">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => fileRef.current?.click()} disabled={uploading}>
                <Upload className="h-3 w-3" /> {uploading ? "Uploading..." : "Change Logo"}
              </Button>
              {logoUrl && (
                <Button variant="ghost" size="sm" className="text-xs text-destructive ml-1" onClick={() => setLogoUrl("")}>
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs">Startup Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="h-9 text-sm" />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs">Short Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} className="text-sm min-h-[80px]" placeholder="What does your startup do?" />
          </div>

          {/* Mission */}
          <div className="space-y-1.5">
            <Label className="text-xs">Mission Statement</Label>
            <Textarea value={mission} onChange={e => setMission(e.target.value)} className="text-sm min-h-[60px]" placeholder="What problem are you solving?" />
          </div>

          {/* Vision */}
          <div className="space-y-1.5">
            <Label className="text-xs">Vision Statement</Label>
            <Textarea value={vision} onChange={e => setVision(e.target.value)} className="text-sm min-h-[60px]" placeholder="Where do you see your company in 5 years?" />
          </div>

          {/* Industry & Stage */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Industry</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Stage</Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label className="text-xs">Location</Label>
            <Input value={location} onChange={e => setLocation(e.target.value)} className="h-9 text-sm" placeholder="e.g. Lagos, Nigeria" />
          </div>

          {/* URLs */}
          <div className="space-y-1.5">
            <Label className="text-xs">Website URL</Label>
            <Input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} className="h-9 text-sm" placeholder="https://" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">LinkedIn URL</Label>
            <Input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} className="h-9 text-sm" placeholder="https://linkedin.com/company/..." />
          </div>

          {/* Social Media */}
          <div className="border-t border-border pt-4 mt-2">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Social Media</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Twitter / X URL</Label>
                <Input value={twitterUrl} onChange={e => setTwitterUrl(e.target.value)} className="h-9 text-sm" placeholder="https://x.com/yourstartup" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Instagram URL</Label>
                <Input value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} className="h-9 text-sm" placeholder="https://instagram.com/yourstartup" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Facebook URL</Label>
                <Input value={facebookUrl} onChange={e => setFacebookUrl(e.target.value)} className="h-9 text-sm" placeholder="https://facebook.com/yourstartup" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !name.trim()}>
              {saving && <Loader2 className="h-3 w-3 animate-spin mr-1" />} Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditStartupDialog;
