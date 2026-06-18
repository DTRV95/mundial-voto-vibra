import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";

export function useFollowing() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["following", user?.id],
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("follows")
        .select("following_id")
        .eq("follower_id", user!.id);
      return new Set<string>((data ?? []).map((r: any) => r.following_id));
    },
  });
}

export function useFollowedByMe(targetId?: string) {
  const { data: following } = useFollowing();
  return !!targetId && (following?.has(targetId) ?? false);
}

export function useFollowToggle(targetId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const isFollowing = useFollowedByMe(targetId);

  async function toggle() {
    if (!user || loading) return;
    setLoading(true);
    try {
      if (isFollowing) {
        await (supabase as any)
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetId);
      } else {
        await (supabase as any)
          .from("follows")
          .insert({ follower_id: user.id, following_id: targetId });
        // Notify the target user
        await (supabase as any)
          .from("follow_notifications")
          .insert({ user_id: targetId, follower_id: user.id });
      }
      qc.invalidateQueries({ queryKey: ["following", user.id] });
    } finally {
      setLoading(false);
    }
  }

  return { isFollowing, loading, toggle };
}
