import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { useFollowToggle } from "@/lib/useFollow";
import { useAuth } from "@/lib/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  targetId: string;
  size?: "sm" | "md";
}

export function FollowButton({ targetId, size = "sm" }: Props) {
  const { user } = useAuth();
  const { isFollowing, loading, toggle } = useFollowToggle(targetId);

  // Check if target follows back
  const { data: followsBack } = useQuery({
    queryKey: ["follows-back", targetId, user?.id],
    enabled: !!user?.id && !isFollowing,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("follows")
        .select("follower_id")
        .eq("follower_id", targetId)
        .eq("following_id", user!.id)
        .maybeSingle();
      return !!data;
    },
  });

  if (!user || user.id === targetId) return null;

  const label = isFollowing ? "A seguir" : followsBack ? "Seguir de volta" : "Seguir";
  const isSmall = size === "sm";

  return (
    <button
      onClick={e => { e.preventDefault(); e.stopPropagation(); toggle(); }}
      disabled={loading}
      className={`shrink-0 flex items-center gap-1 rounded-full border font-semibold transition-smooth disabled:opacity-50 ${
        isSmall ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs"
      } ${
        isFollowing
          ? "border-wc-green/40 bg-wc-green/10 text-wc-green hover:border-wc-red/40 hover:bg-wc-red/10 hover:text-wc-red"
          : followsBack
          ? "border-wc-blue/50 bg-wc-blue/15 text-wc-blue hover:bg-wc-blue/25"
          : "border-border bg-card hover:border-gold/40 hover:text-gold"
      }`}
    >
      {loading
        ? <Loader2 className="h-3 w-3 animate-spin" />
        : isFollowing
        ? <UserCheck className="h-3 w-3" />
        : <UserPlus className="h-3 w-3" />
      }
      {label}
    </button>
  );
}
