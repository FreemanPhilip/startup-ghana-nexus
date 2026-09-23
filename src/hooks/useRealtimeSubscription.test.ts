import { describe, it, expect, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { channel: vi.fn(), removeChannel: vi.fn() },
}));

const { nextChannelTopic } = await import("./useRealtimeSubscription");

describe("nextChannelTopic", () => {
  it("never repeats a topic for the same table and filter", () => {
    // The original bug: the topic ended in Date.now(), so two subscriptions to
    // the same table created in the same millisecond got the same topic.
    // supabase-js then returned the already-subscribed channel and .on() threw
    // "cannot add postgres_changes callbacks ... after subscribe()".
    const topics = new Set<string>();
    for (let i = 0; i < 1000; i += 1) {
      topics.add(nextChannelTopic("posts"));
    }
    expect(topics.size).toBe(1000);
  });

  it("stays unique when called in the same tick from different hooks", () => {
    // usePosts and useHomeFeed both watch "posts" with no filter and mount in
    // the same render pass — this is the exact collision that crashed the page.
    const a = nextChannelTopic("posts");
    const b = nextChannelTopic("posts");

    expect(a).not.toBe(b);
  });

  it("keeps the table and filter readable for debugging", () => {
    const topic = nextChannelTopic("messages", "conversation_id=eq.123");

    expect(topic.startsWith("rt-messages-conversation_id=eq.123-")).toBe(true);
  });

  it("labels an absent filter rather than leaving a gap", () => {
    expect(nextChannelTopic("posts").startsWith("rt-posts-all-")).toBe(true);
  });

  it("distinguishes different tables", () => {
    const posts = nextChannelTopic("posts");
    const groupPosts = nextChannelTopic("group_posts");

    expect(posts).not.toBe(groupPosts);
    expect(posts).toContain("rt-posts-");
    expect(groupPosts).toContain("rt-group_posts-");
  });
});
