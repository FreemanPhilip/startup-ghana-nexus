import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

const colorOptions = [
  { label: "Blue", value: "from-blue-600 to-indigo-700" },
  { label: "Green", value: "from-emerald-500 to-teal-700" },
  { label: "Purple", value: "from-purple-500 to-pink-600" },
  { label: "Dark", value: "from-slate-700 to-slate-900" },
  { label: "Amber", value: "from-amber-500 to-orange-600" },
  { label: "Cyan", value: "from-cyan-500 to-blue-600" },
];

interface CreateGroupDialogProps {
  onCreate: (name: string, description: string, isPrivate: boolean, coverColor: string) => Promise<void>;
}

const CreateGroupDialog = ({ onCreate }: CreateGroupDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [coverColor, setCoverColor] = useState(colorOptions[0].value);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    await onCreate(name.trim(), description.trim(), isPrivate, coverColor);
    setCreating(false);
    setOpen(false);
    setName(""); setDescription(""); setIsPrivate(false); setCoverColor(colorOptions[0].value);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 font-semibold">
          <Plus className="h-4 w-4" /> Create Group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {/* Color Preview */}
          <div className={`h-20 rounded-lg bg-gradient-to-br ${coverColor}`} />
          <div className="flex gap-2">
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
            <Input placeholder="e.g. FinTech Ghana" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea placeholder="What's this group about?" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Private Group</Label>
            <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>
          <Button className="w-full" onClick={handleCreate} disabled={!name.trim() || creating}>
            {creating ? "Creating..." : "Create Group"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupDialog;
