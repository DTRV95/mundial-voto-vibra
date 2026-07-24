import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { COMPETITIONS, type CompetitionTheme } from "@/lib/competitionTheme";

export interface Competition extends CompetitionTheme {
  id: string;
  format: string;              // 'liga' | 'liga_mata_mata'
  status: string;              // 'upcoming' | 'active' | 'finished'
  season: string | null;
}

// Fallback de tema para slugs que ainda não têm cores definidas no código
const FALLBACK_THEME: Omit<CompetitionTheme, "slug" | "name" | "short" | "badge"> = {
  accent: "oklch(0.72 0.16 158)",
  accentBright: "oklch(0.80 0.17 158)",
  glow: "oklch(0.72 0.16 158 / 0.35)",
  heroGradient:
    "radial-gradient(ellipse 120% 90% at 50% -20%, oklch(0.30 0.08 200) 0%, oklch(0.14 0.03 260) 60%, oklch(0.10 0.02 260) 100%)",
};

/**
 * Carrega as competições da base de dados e junta-lhes o tema visual
 * (cores) definido no código, por slug. É a fonte única para todas as
 * páginas da época.
 */
export function useCompetitions() {
  return useQuery({
    queryKey: ["competitions"],
    staleTime: 300_000,
    queryFn: async (): Promise<Competition[]> => {
      const { data } = await (supabase as any)
        .from("competitions")
        .select("id,slug,name,short_name,emoji,format,status,season,sort_order")
        .order("sort_order");

      const rows = (data ?? []) as any[];
      return rows.map((c) => {
        const theme = COMPETITIONS.find((t) => t.slug === c.slug);
        return {
          id: c.id,
          slug: c.slug,
          name: c.name,
          short: c.short_name ?? theme?.short ?? c.name,
          badge: c.emoji ?? theme?.badge ?? "⚽",
          format: c.format,
          status: c.status,
          season: c.season,
          accent: theme?.accent ?? FALLBACK_THEME.accent,
          accentBright: theme?.accentBright ?? FALLBACK_THEME.accentBright,
          glow: theme?.glow ?? FALLBACK_THEME.glow,
          heroGradient: theme?.heroGradient ?? FALLBACK_THEME.heroGradient,
        };
      });
    },
  });
}
