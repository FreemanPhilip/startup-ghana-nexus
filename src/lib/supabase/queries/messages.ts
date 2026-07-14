import { supabase } from "@/integrations/supabase/client";
import { getProfilesByIds, type EnrichedProfile } from "./profiles";

export interface Conversation {
  id: string;
  participant_one: string;
  participant_two: string;
  last_message_at: string;
  created_at: string;
  other_user: EnrichedProfile | null;
  last_message?: string;
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  image_url: string | null;
  read_at: string | null;
  created_at: string;
}

export async function fetchConversations(userId: string): Promise<Conversation[]> {
  const { data: convos } = await supabase
    .from("conversations")
    .select("*")
    .or(`participant_one.eq.${userId},participant_two.eq.${userId}`)
    .order("last_message_at", { ascending: false });

  if (!convos) return [];

  const otherUserIds = convos.map(c => c.participant_one === userId ? c.participant_two : c.participant_one);
  const profilesMap = await getProfilesByIds(otherUserIds);

  return Promise.all(
    convos.map(async (c) => {
      const otherId = c.participant_one === userId ? c.participant_two : c.participant_one;

      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content")
        .eq("conversation_id", c.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", c.id)
        .neq("sender_id", userId)
        .is("read_at", null);

      return {
        ...c,
        other_user: profilesMap.get(otherId) ?? null,
        last_message: lastMsg?.content,
        unread_count: count ?? 0,
      };
    })
  );
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function markMessagesAsRead(conversationId: string, userId: string): Promise<number> {
  const { count } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("read_at", null);

  if (count && count > 0) {
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .is("read_at", null);
  }
  return count ?? 0;
}

export async function sendMessage(conversationId: string, senderId: string, content: string, imageUrl?: string | null) {
  return supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: senderId,
    content: content.trim() || (imageUrl ? "📎 Attachment" : ""),
    image_url: imageUrl || null,
  });
}

export async function startConversation(userId: string, otherUserId: string): Promise<string | null> {
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .or(
      `and(participant_one.eq.${userId},participant_two.eq.${otherUserId}),and(participant_one.eq.${otherUserId},participant_two.eq.${userId})`
    )
    .single();

  if (existing) return existing.id;

  const { data: newConvo } = await supabase
    .from("conversations")
    .insert({ participant_one: userId, participant_two: otherUserId })
    .select("id")
    .single();

  return newConvo?.id ?? null;
}

export async function deleteMessage(messageId: string, userId: string) {
  return supabase.from("messages").delete().eq("id", messageId).eq("sender_id", userId);
}

export async function deleteMessages(messageIds: string[], userId: string) {
  return supabase.from("messages").delete().in("id", messageIds).eq("sender_id", userId);
}

export async function clearChat(conversationId: string, userId: string) {
  return supabase.from("messages").delete().eq("conversation_id", conversationId).eq("sender_id", userId);
}

export async function deleteConversation(conversationId: string, userId: string) {
  await supabase.from("messages").delete().eq("conversation_id", conversationId).eq("sender_id", userId);
  return supabase.from("conversations").delete().eq("id", conversationId);
}

export async function blockUser(blockerId: string, blockedId: string) {
  return supabase.from("blocked_users").insert({ blocker_id: blockerId, blocked_id: blockedId });
}

export async function unblockUser(blockerId: string, blockedId: string) {
  return supabase.from("blocked_users").delete().eq("blocker_id", blockerId).eq("blocked_id", blockedId);
}

export async function isUserBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const { data } = await supabase
    .from("blocked_users")
    .select("id")
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId)
    .maybeSingle();
  return !!data;
}
