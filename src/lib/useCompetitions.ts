import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Competition {
  id: string;
  slug: string;
  name: string;
  short: string;
  emoji: string;
  /** Acento principal — botões, destaques, estado ativo */
  accent: string;
  /** Tom profundo — base de gradientes escuros */
  deep: string;
  /** Cor de brilho/halo */
  glow: string;
  /** Cor "elétrica" da marca — momentos dinâmicos */
  electric: string;
  /** Gradiente para heros e painéis grandes */
  heroGradient: string;
  /** Motivo visual — define a atmosfera da competição */
  motif: "energy" | "stars";
  /** Cor de texto secundária característica */
  tone: string;
}

/**
 * Temas oficiais das competições.
 * Liga Portugal Betclic — manual de normas gráficas.
 * UEFA Champions League — identidade "Kick of Light" (2024–27).
 */
const THEMES: Record<string, Omit<Competition, "id" | "slug" | "name" | "short" | "emoji">> = {
  "liga-portugal": {
    accent: "#E10014",                       // vermelho Magma
    deep: "#82000A",                         // vermelho profundo
    glow: "rgba(225, 0, 20, 0.45)",
    electric: "#19FF91",                     // verde menta néon
    heroGradient: "linear-gradient(145deg, #82000A 0%, #BE000F 45%, #2a0a18 100%)",
    motif: "energy",
    tone: "#FFD9DD",
  },
  "champions": {
    accent: "#183059",                       // azul real
    deep: "#0A1428",                         // midnight blue
    glow: "rgba(24, 48, 89, 0.55)",
    electric: "#00FAFF",                     // ciano prisma
    heroGradient: "linear-gradient(145deg, #0A1428 0%, #183059 55%, #0E1E38 100%)",
    motif: "stars",
    tone: "#B1C1C1",                         // prata metálica UEFA
  },
};

const FALLBACK = {
  accent: "var(--gold)",
  deep: "#1a1a1a",
  glow: "rgba(200, 150, 12, 0.35)",
  electric: "var(--gold)",
  heroGradient: "linear-gradient(145deg, #1a1a1a 0%, #2a2a2a 100%)",
  motif: "energy" as const,
  tone: "#e5e5e5",
};

/** Lê as competições ativas da base de dados e junta-lhes o tema oficial. */
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
        ...(THEMES[c.slug] ?? FALLBACK),
      }));
    },
  });
}
