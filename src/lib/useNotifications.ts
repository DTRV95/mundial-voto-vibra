import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";

// ── Storage helpers ──────────────────────────────────────────────────────────

function getStorage<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback; } catch { return fallback; }
}
function setStorage(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

const CHAT_KEY   = "notif_chat_last_read";   // Record<poolCode, isoString>
const RESULT_KEY = "notif_results_seen";     // Record<matchId, true>
const RANK_KEY   = "notif_last_rank";        // number

export function markChatRead(poolCode: string) {
  const d = getStorage<Record<string, string>>(CHAT_KEY, {});
  d[poolCode] = new Date().toISOString();
  setStorage(CHAT_KEY, d);
}

export function markResultsSeen(matchIds: string[]) {
  const d = getStorage<Record<string, boolean>>(RESULT_KEY, {});
  matchIds.forEach(id => { d[id] = true; });
  setStorage(RESULT_KEY, d);
}

export function markRankSeen(rank: number) {
  setStorage(RANK_KEY, rank);
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface ChatNotif {
  type: "chat";
  poolCode: string;
  poolName: string;
  messages: { id: string; body: string; sender: string; created_at: string }[];
}

export interface ResultNotif {
  type: "result";
  matchId: string;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  pointsEarned: number;
}

export interface RankNotif {
  type: "rank";
  previousRank: number;
  currentRank: number;
}

export type Notification = ChatNotif | ResultNotif | RankNotif;

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user?.id,
    refetchInterval: 60_000,
    queryFn: async (): Promise<{ total: number; items: Notification[] }> => {
      const notifications: Notification[] = [];

      // ── 1. Mensagens de chat não lidas ─────────────────────────────────────
      const { data: memberships } = await supabase
        .from("pool_members")
        .select("pool:pool_id(code, name)")
        .eq("user_id", user!.id);

      const lastRead = getStorage<Record<string, string>>(CHAT_KEY, {});

      for (const m of (memberships ?? [])) {
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

        const uids = [...new Set(msgs.map((msg: any) => msg.user_id))];
        const { data: profiles } = await supabase
          .from("profiles").select("id, display_name").in("id", uids);
        const nameMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p.display_name]));

        notifications.push({
          type: "chat",
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

      // ── 2. Ultrapassado no ranking global ──────────────────────────────────
      const { data: myProfile } = await supabase
        .from("profiles").select("total_points").eq("id", user!.id).maybeSingle();

      if (myProfile) {
        const { count } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .gt("total_points", myProfile.total_points ?? 0);
        const currentRank = (count ?? 0) + 1;
        const previousRank = getStorage<number>(RANK_KEY, currentRank);

        if (previousRank > 0 && currentRank > previousRank) {
          notifications.push({ type: "rank", previousRank, currentRank });
        }
        // Atualiza rank guardado sempre
        setStorage(RANK_KEY, currentRank);
      }

      const total = notifications.reduce((s, n) => {
        if (n.type === "chat") return s + n.messages.length;
        return s + 1;
      }, 0);

      return { total, items: notifications };
    },
  });
}
