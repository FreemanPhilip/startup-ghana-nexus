import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, Image, Video } from "lucide-react";

interface PostWithAuthor {
  id: string;
  content: string;
  category: string;
  created_at: string;
  image_url: string | null;
  video_url: string | null;
  author?: { full_name: string | null; avatar_url: string | null };
}

const AdminPostsTable = () => {
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("posts").select("id, content, category, created_at, image_url, video_url, author_id").order("created_at", { ascending: false }).limit(100);
      if (data) {
        const authorIds = [...new Set(data.map((p) => p.author_id))];
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", authorIds);
        const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));
        setPosts(data.map((p) => ({ ...p, author: profileMap.get(p.author_id) || undefined })));
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = posts.filter((p) =>
    !search || p.content.toLowerCase().includes(search.toLowerCase()) || p.author?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search posts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No posts found</div>
        ) : filtered.map((p) => (
          <div key={p.id} className="p-4 flex items-start gap-3 hover:bg-muted/30 transition-colors">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={p.author?.avatar_url || undefined} />
              <AvatarFallback className="text-xs bg-muted">{p.author?.full_name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium">{p.author?.full_name || "Unknown"}</span>
                <span className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
                {p.image_url && <Image className="h-3 w-3 text-muted-foreground" />}
                {p.video_url && <Video className="h-3 w-3 text-muted-foreground" />}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{p.content}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Showing {filtered.length} posts</p>
    </div>
  );
};

export default AdminPostsTable;
