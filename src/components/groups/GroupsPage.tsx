import { useState, useEffect } from "react";
import { Search, TrendingUp, Bookmark, Loader2, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import GroupCard from "./GroupCard";
import CreateGroupDialog from "./CreateGroupDialog";
import GroupDetailPage from "./GroupDetailPage";
import { useGroups } from "@/hooks/useGroups";
import { categoryOptions } from "./groupConstants";

interface GroupsPageProps {
  initialGroupId?: string | null;
  onDeepLinkConsumed?: () => void;
}

const GroupsPage = ({ initialGroupId, onDeepLinkConsumed }: GroupsPageProps) => {
  const { groups, myGroups, loading, createGroup, joinGroup, leaveGroup } = useGroups();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(initialGroupId ?? null);

  useEffect(() => {
    if (initialGroupId) {
      setSelectedGroupId(initialGroupId);
      onDeepLinkConsumed?.();
    }
  }, [initialGroupId, onDeepLinkConsumed]);

  const filtered = groups.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || g.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (selectedGroupId) {
    return <GroupDetailPage groupId={selectedGroupId} onBack={() => setSelectedGroupId(null)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Ecosystem Groups</h1>
          <p className="text-sm text-muted-foreground">Discover and join Africa's most active startup communities.</p>
        </div>
        <CreateGroupDialog onCreate={createGroup} />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search groups or communities..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            selectedCategory === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          All Categories
        </button>
        {categoryOptions.map(c => (
          <button
            key={c.value}
            onClick={() => setSelectedCategory(c.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === c.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left sidebar */}
        <div className="lg:w-64 shrink-0 space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bookmark className="h-4 w-4 text-primary" />
              <h3 className="font-display font-bold text-sm">Your Groups</h3>
            </div>
            {myGroups.length === 0 ? (
              <p className="text-xs text-muted-foreground">You haven't joined any groups yet.</p>
            ) : (
              <div className="space-y-2">
                {myGroups.slice(0, 5).map(g => (
                  <button key={g.id} onClick={() => setSelectedGroupId(g.id)} className="flex items-center gap-2 w-full text-left hover:bg-muted rounded-lg p-2 transition-colors">
                    <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${g.cover_color || "from-blue-600 to-indigo-700"} flex items-center justify-center`}>
                      <span className="text-white text-[10px] font-bold">{g.name.slice(0, 2).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{g.name}</p>
                      <p className="text-[10px] text-muted-foreground">{g.member_count.toLocaleString()} members</p>
                    </div>
                  </button>
                ))}
                {myGroups.length > 5 && <p className="text-xs text-primary font-medium cursor-pointer hover:underline">See all</p>}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="font-display font-bold text-sm">Trending Topics</h3>
            </div>
            <div className="space-y-2">
              {["#StartupAfrica", "#AIInAfrica", "#SeedFunding25"].map(tag => (
                <div key={tag}>
                  <p className="text-xs font-semibold">{tag}</p>
                  <p className="text-[10px] text-muted-foreground">{Math.floor(Math.random() * 100 + 20)} posts today</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Groups Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <p className="text-sm font-medium text-muted-foreground">No groups found</p>
              <p className="mt-1 text-xs text-muted-foreground">Create the first group to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(group => (
                <GroupCard key={group.id} group={group} onJoin={joinGroup} onLeave={leaveGroup} onView={setSelectedGroupId} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupsPage;
