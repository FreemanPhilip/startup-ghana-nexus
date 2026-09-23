import { useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type PostgresChangeEvent = "*" | "INSERT" | "UPDATE" | "DELETE";

interface RealtimeConfig {
  table: string;
  /** Narrowed to the literals supabase-js accepts for postgres_changes. */
  event?: PostgresChangeEvent;
  filter?: string;
  schema?: string;
}

// Every subscription needs its own channel topic. supabase-js caches channels
// by topic, so reusing a name hands back the existing channel — and if that one
// has already been subscribed, adding a listener to it throws:
//
//   cannot add `postgres_changes` callbacks for realtime:<topic> after `subscribe()`
//
// A Date.now() suffix was not enough: two hooks watching the same table in the
// same millisecond collide, which is exactly what usePosts and useHomeFeed do
// (both watch "posts" with no filter, mounted in the same render pass). The
// counter makes collisions impossible within a page; the random suffix keeps
// topics distinct across tabs and remounts.
let channelSequence = 0;

export function nextChannelTopic(table: string, filter?: string): string {
  channelSequence += 1;
  const unique = Math.random().toString(36).slice(2, 8);
  return `rt-${table}-${filter ?? "all"}-${channelSequence}-${unique}`;
}

export function useRealtimeSubscription(
  config: RealtimeConfig,
  onChange: () => void,
  enabled = true
) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!enabled) return;

    let channel: RealtimeChannel | null = null;

    // Live updates are an enhancement. If the realtime socket misbehaves this
    // must degrade to "no live updates", never take the page down with it.
    try {
      channel = supabase
        .channel(nextChannelTopic(config.table, config.filter))
        .on(
          "postgres_changes",
          {
            event: config.event ?? "*",
            schema: config.schema ?? "public",
            table: config.table,
            ...(config.filter ? { filter: config.filter } : {}),
          },
          () => onChangeRef.current()
        )
        .subscribe();
    } catch (error) {
      console.warn(`Realtime unavailable for "${config.table}"; live updates are off.`, error);
      channel = null;
    }

    return () => {
      if (!channel) return;
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.warn("Could not remove realtime channel.", error);
      }
    };
  }, [config.table, config.event, config.filter, config.schema, enabled]);
}
