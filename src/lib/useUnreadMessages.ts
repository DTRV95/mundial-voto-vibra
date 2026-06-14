import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";

const STORAGE_KEY = "league_last_read";

export function getLastRead(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); } catch { return {}; }
}

export function markAsRead(poolCode: string) {
  const data = getLastRead();
  data[poolCode] = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export interface UnreadLeague {
  poolCode: string;
  poolName: string;
  messages: { id: string; body: string; sender: string; created_at: string }[];
}

export function useUnreadMessages() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["unread-messages", user?.id],
    enabled: !!user?.id,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data: memberships } = await supabase
        .from("pool_members")
        .select("pool:pool_id(code, name)")
        .eq("user_id", user!.id);

      if (!memberships || memberships.length === 0) return { total: 0, leagues: [] as UnreadLeague[] };

      const lastRead = getLastRead();
      const results: UnreadLeague[] = [];

      for (const m of memberships) {
        const pool = m.pool as any;
        if (!pool?.code) continue;

        const since = lastRead[pool.code] ?? "1970-01-01T00:00:00Z";

        const { data: msgs } = await supabase
          .from("league_messages")
          .select("id, body, created_at, user_id")
          .eq("pool_code", pool.code)
          .neq("user_id", user!.id)
          .gt("created_at", since)
          .order("created_at", { ascending: false })
          .limit(10);

        if (!msgs || msgs.length === 0) continue;

        const userIds = [...new Set(msgs.map((msg: any) => msg.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", userIds);

        const nameMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p.display_name]));

        results.push({
          poolCode: pool.code,
          poolName: pool.name,
          messages: msgs.map((msg: any) => ({
            id: msg.id,
            body: msg.body,
            created_at: msg.created_at,
            sender: nameMap[msg.user_id] ?? "Membro",
          })),
        });
      }

      const total = results.reduce((s, l) => s + l.messages.length, 0);
      return { total, leagues: results };
    },
  });
}
