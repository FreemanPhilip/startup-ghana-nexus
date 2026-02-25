import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Image, Film, Trash2, Loader2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface GroupFile {
  id: string;
  group_id: string;
  uploaded_by: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
  uploader_name?: string;
}

interface GroupFilesTabProps {
  groupId: string;
  isMember: boolean;
  isAdmin: boolean;
}

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getFileIcon(type: string | null) {
  if (!type) return FileText;
  if (type.startsWith("image/")) return Image;
  if (type.startsWith("video/")) return Film;
  return FileText;
}

const GroupFilesTab = ({ groupId, isMember, isAdmin }: GroupFilesTabProps) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<GroupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("group_files")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false }) as { data: GroupFile[] | null };

    if (data && data.length > 0) {
      const uploaderIds = [...new Set(data.map(f => f.uploaded_by))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", uploaderIds);
      const nameMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      setFiles(data.map(f => ({ ...f, uploader_name: nameMap.get(f.uploaded_by) || "Unknown" })));
    } else {
      setFiles([]);
    }
    setLoading(false);
  }, [groupId]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum 50MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${groupId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("group-files").upload(path, file);
    if (uploadErr) {
      toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("group-files").getPublicUrl(path);

    const { error: dbErr } = await supabase.from("group_files").insert({
      group_id: groupId,
      uploaded_by: user.id,
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_size: file.size,
      file_type: file.type,
    } as any);

    if (dbErr) {
      toast({ title: "Error", description: dbErr.message, variant: "destructive" });
    } else {
      toast({ title: "File uploaded!" });
      fetchFiles();
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDelete = async (fileId: string) => {
    await supabase.from("group_files").delete().eq("id", fileId);
    toast({ title: "File deleted" });
    fetchFiles();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isMember && (
        <div className="flex justify-end">
          <Button
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {uploading ? "Uploading..." : "Upload File"}
          </Button>
          <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
        </div>
      )}

      {files.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No files shared yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map(file => {
            const Icon = getFileIcon(file.file_type);
            return (
              <div key={file.id} className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{file.file_name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {file.uploader_name} · {formatSize(file.file_size)} · {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={file.file_url} target="_blank" rel="noopener noreferrer" download>
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                  {(file.uploaded_by === user?.id || isAdmin) && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(file.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GroupFilesTab;
