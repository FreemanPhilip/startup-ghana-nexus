import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RealtimeConfig {
  table: string;
  event?: string;
  filter?: string;
  schema?: string;
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

    const channel = supabase
      .channel(`rt-${config.table}-${config.filter ?? "all"}-${Date.now()}`)
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [config.table, config.event, config.filter, config.schema, enabled]);
}
