import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Conversation {
  id: string;
  participant_one: string;
  participant_two: string;
  last_message_at: string;
  created_at: string;
  other_user: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
    company_name: string | null;
    location: string | null;
    industry: string | null;
    expertise: string[] | null;
    verification: string;
  } | null;
  last_message?: string;
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export function useMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoadingConversations(true);

    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
      .order("last_message_at", { ascending: false });

    if (!convos) {
      setConversations([]);
      setLoadingConversations(false);
      return;
    }

    // Get other user IDs
    const otherUserIds = convos.map(c =>
      c.participant_one === user.id ? c.participant_two : c.participant_one
    );

    // Fetch profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url, headline, company_name, location, industry, expertise, verification")
      .in("user_id", otherUserIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);

    // Fetch last message for each conversation
    const enriched: Conversation[] = await Promise.all(
      convos.map(async (c) => {
        const otherId = c.participant_one === user.id ? c.participant_two : c.participant_one;

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
          .neq("sender_id", user.id)
          .is("read_at", null);

        return {
          ...c,
          other_user: profileMap.get(otherId) ?? null,
          last_message: lastMsg?.content,
          unread_count: count ?? 0,
        };
      })
    );

    setConversations(enriched);
    setLoadingConversations(false);
  }, [user]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    setMessages(data ?? []);
    setLoadingMessages(false);

    // Mark messages as read
    if (user) {
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id)
        .is("read_at", null);
    }
  }, [user]);

  const sendMessage = useCallback(async (content: string) => {
    if (!user || !activeConversation || !content.trim()) return;

    const { error } = await supabase.from("messages").insert({
      conversation_id: activeConversation,
      sender_id: user.id,
      content: content.trim(),
    });

    if (!error) {
      // Refresh handled by realtime
    }
  }, [user, activeConversation]);

  const startConversation = useCallback(async (otherUserId: string) => {
    if (!user) return null;

    // Check if conversation already exists
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .or(
        `and(participant_one.eq.${user.id},participant_two.eq.${otherUserId}),and(participant_one.eq.${otherUserId},participant_two.eq.${user.id})`
      )
      .single();

    if (existing) {
      setActiveConversation(existing.id);
      return existing.id;
    }

    // Create new conversation
    const { data: newConvo } = await supabase
      .from("conversations")
      .insert({
        participant_one: user.id,
        participant_two: otherUserId,
      })
      .select("id")
      .single();

    if (newConvo) {
      setActiveConversation(newConvo.id);
      await fetchConversations();
      return newConvo.id;
    }
    return null;
  }, [user, fetchConversations]);

  // Select conversation
  const selectConversation = useCallback((id: string) => {
    setActiveConversation(id);
    fetchMessages(id);
  }, [fetchMessages]);

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!activeConversation) return;

    const channel = supabase
      .channel(`messages-${activeConversation}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConversation}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);
          // Mark as read if not from us
          if (user && newMsg.sender_id !== user.id) {
            supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversation, user]);

  // Realtime for conversation list updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("conversations-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => { fetchConversations(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchConversations]);

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery) return true;
    const name = c.other_user?.full_name?.toLowerCase() ?? "";
    return name.includes(searchQuery.toLowerCase());
  });

  const activeConvoData = conversations.find(c => c.id === activeConversation);

  return {
    conversations: filteredConversations,
    activeConversation,
    activeConvoData,
    messages,
    loadingConversations,
    loadingMessages,
    searchQuery,
    setSearchQuery,
    selectConversation,
    sendMessage,
    startConversation,
    fetchConversations,
  };
}
