import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Competition {
  id: string;
  slug: string;
  name: string;
  short: string;
  emoji: string;
  /** Cor de acento da competição (usada no seletor) */
  accent: string;
}

// Cor por competição — apenas as duas do lançamento
const ACCENTS: Record<string, string> = {
  "liga-portugal": "#E10014",               // vermelho Magma — tom principal Betclic
  "champions": "#183059",                    // azul real UEFA "Kick of Light" (2024-27)
};
const DEFAULT_ACCENT = "var(--gold)";

/** Lê as competições ativas da base de dados. */
export function useCompetitions() {
  return useQuery({
    queryKey: ["competitions"],
    staleTime: 300_000,
    queryFn: async (): Promise<Competition[]> => {
      const { data } = await (supabase as any)
        .from("competitions")
        .select("id,slug,name,short_name,emoji,sort_order")
        .order("sort_order");

      return ((data ?? []) as any[]).map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        short: c.short_name ?? c.name,
        emoji: c.emoji ?? "⚽",
        accent: ACCENTS[c.slug] ?? DEFAULT_ACCENT,
      }));
    },
  });
}
