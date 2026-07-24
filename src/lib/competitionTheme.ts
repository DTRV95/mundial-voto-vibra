// ─────────────────────────────────────────────────────────────
// Sistema de tema por competição — Época 2026/27
//
// Cada competição "veste" o site com o seu tom de acento.
// O DOURADO fica reservado para troféus / pontos / campeões.
// As variáveis CSS abaixo são aplicadas num wrapper (ver CompetitionTheme).
// ─────────────────────────────────────────────────────────────

export interface CompetitionTheme {
  slug: string;
  name: string;
  short: string;
  badge: string; // emoji provisório até termos os crests
  /** Acento principal (texto/ícones sobre escuro) */
  accent: string;
  /** Versão mais viva para destaques */
  accentBright: string;
  /** Cor de brilho/halo */
  glow: string;
  /** Gradiente do hero desta competição */
  heroGradient: string;
}

// ── Competições do LANÇAMENTO (época 2026/27) ──────────────
export const COMPETITIONS: CompetitionTheme[] = [
  {
    slug: "liga-portugal",
    name: "Liga Portugal",
    short: "Liga",
    badge: "🇵🇹",
    // Identidade oficial: vermelho + branco (patrocínio Betclic)
    accent: "oklch(0.62 0.23 25)",
    accentBright: "oklch(0.70 0.22 25)",
    glow: "oklch(0.60 0.24 25 / 0.40)",
    heroGradient:
      "radial-gradient(ellipse 120% 90% at 50% -20%, oklch(0.40 0.17 25) 0%, oklch(0.17 0.06 20) 55%, oklch(0.10 0.02 20) 100%)",
  },
  {
    slug: "champions",
    name: "Champions League",
    short: "Champions",
    badge: "⭐",
    accent: "oklch(0.66 0.17 262)",
    accentBright: "oklch(0.74 0.17 262)",
    glow: "oklch(0.60 0.20 262 / 0.40)",
    heroGradient:
      "radial-gradient(ellipse 120% 90% at 50% -20%, oklch(0.34 0.13 264) 0%, oklch(0.16 0.06 266) 55%, oklch(0.10 0.02 262) 100%)",
  },
];

// ── Competições FUTURAS (adicionar mais tarde ao array acima) ──
export const FUTURE_COMPETITIONS: CompetitionTheme[] = [
  {
    slug: "liga-europa",
    name: "Liga Europa",
    short: "Europa",
    badge: "🟠",
    accent: "oklch(0.74 0.16 55)",
    accentBright: "oklch(0.80 0.17 60)",
    glow: "oklch(0.72 0.18 50 / 0.38)",
    heroGradient:
      "radial-gradient(ellipse 120% 90% at 50% -20%, oklch(0.36 0.11 55) 0%, oklch(0.16 0.04 40) 55%, oklch(0.10 0.02 30) 100%)",
  },
  {
    slug: "premier-league",
    name: "Premier League",
    short: "Premier",
    badge: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    accent: "oklch(0.66 0.22 328)",
    accentBright: "oklch(0.74 0.22 328)",
    glow: "oklch(0.62 0.24 328 / 0.40)",
    heroGradient:
      "radial-gradient(ellipse 120% 90% at 50% -20%, oklch(0.32 0.15 328) 0%, oklch(0.16 0.07 320) 55%, oklch(0.10 0.03 300) 100%)",
  },
];

export const GOLD = {
  base: "oklch(0.80 0.15 85)",
  soft: "oklch(0.62 0.12 80)",
  glow: "oklch(0.80 0.15 85 / 0.35)",
};

export function themeVars(t: CompetitionTheme): React.CSSProperties {
  return {
    // Consumidas por classes utilitárias e estilos inline dos componentes de época
    ["--accent" as any]: t.accent,
    ["--accent-bright" as any]: t.accentBright,
    ["--accent-glow" as any]: t.glow,
  };
}
