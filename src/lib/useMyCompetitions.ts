import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";

/**
 * Competições em que o utilizador está inscrito.
 * Devolve os ids das competições seguidas.
 */
export function useMyCompetitions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-competitions", user?.id],
    enabled: !!user?.id,
    staleTime: 300_000,
    queryFn: async (): Promise<string[]> => {
      const { data } = await (supabase as any)
        .from("user_competitions")
        .select("competition_id")
        .eq("user_id", user!.id);
      return ((data ?? []) as any[]).map((r) => r.competition_id);
    },
  });
}

/** Guarda a lista de competições seguidas (substitui a anterior). */
export function useSetMyCompetitions() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (competitionIds: string[]) => {
      if (!user?.id) throw new Error("Sem sessão");
      // Substitui o conjunto: apaga as antigas e insere as novas
      await (supabase as any).from("user_competitions").delete().eq("user_id", user.id);
      if (competitionIds.length > 0) {
        await (supabase as any).from("user_competitions").insert(
          competitionIds.map((id) => ({ user_id: user.id, competition_id: id }))
        );
      }
      return competitionIds;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-competitions", user?.id] });
    },
  });
}
