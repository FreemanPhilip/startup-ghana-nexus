import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { colorOptions, categoryOptions } from "./groupConstants";

interface CreateGroupDialogProps {
  onCreate: (name: string, description: string, isPrivate: boolean, coverColor: string, category?: string, iconUrl?: string) => Promise<void>;
}

const CreateGroupDialog = ({ onCreate }: CreateGroupDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [coverColor, setCoverColor] = useState(colorOptions[0].value);
  const [category, setCategory] = useState("general");
  const [creating, setCreating] = useState(false);
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setIconPreview(URL.createObjectURL(file));
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("group-avatars").upload(path, file);
    if (!error) {
      const { data: urlData } = supabase.storage.from("group-avatars").getPublicUrl(path);
      setIconUrl(urlData.publicUrl);
    }
    setUploading(false);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    await onCreate(name.trim(), description.trim(), isPrivate, coverColor, category, iconUrl || undefined);
    setCreating(false);
    setOpen(false);
    setName(""); setDescription(""); setIsPrivate(false); setCoverColor(colorOptions[0].value);
    setCategory("general"); setIconUrl(null); setIconPreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 font-semibold">
          <Plus className="h-4 w-4" /> Create Group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription>Set up your group with a profile image, category, and details.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className={`h-24 rounded-lg bg-gradient-to-br ${coverColor} relative`}>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-6 left-4 h-16 w-16 rounded-xl border-4 border-background bg-card flex items-center justify-center overflow-hidden shadow-md hover:opacity-90 transition-opacity"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : iconPreview ? (
                <img src={iconPreview} alt="Group icon" className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-0.5">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[8px] text-muted-foreground">Add Photo</span>
                </div>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleIconUpload} />
          </div>

          <div className="flex gap-2 pt-4">
            {colorOptions.map(c => (
              <button
                key={c.value}
                className={`h-8 w-8 rounded-full bg-gradient-to-br ${c.value} ring-2 ring-offset-2 transition-all ${coverColor === c.value ? "ring-primary" : "ring-transparent"}`}
                onClick={() => setCoverColor(c.value)}
              />
            ))}
          </div>

          <div className="space-y-2">
            <Label>Group Name</Label>
            <Input placeholder="e.g. FinTech Africa" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categoryOptions.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea placeholder="What's this group about?" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          </div>

          <div className="flex items-center justify-between">
            <Label>Private Group</Label>
            <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>

          <Button className="w-full" onClick={handleCreate} disabled={!name.trim() || creating || uploading}>
            {creating ? "Creating..." : "Create Group"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupDialog;
