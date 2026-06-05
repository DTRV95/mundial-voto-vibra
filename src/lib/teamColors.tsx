// Cores primária e secundária por código FIFA de cada seleção do Mundial 2026
const TEAM_COLORS: Record<string, { bg: string; text: string }> = {
  // Grupo A
  USA: { bg: "#002868", text: "#BF0A30" },
  MEX: { bg: "#006847", text: "#CE1126" },
  CAN: { bg: "#FF0000", text: "#ffffff" },
  URU: { bg: "#5EB6E4", text: "#ffffff" },
  // Grupo B
  ARG: { bg: "#74ACDF", text: "#ffffff" },
  CHI: { bg: "#D52B1E", text: "#ffffff" },
  PER: { bg: "#D91023", text: "#ffffff" },
  AUS: { bg: "#00843D", text: "#FFD700" },
  // Grupo C
  GER: { bg: "#000000", text: "#DD0000" },
  JPN: { bg: "#BC002D", text: "#ffffff" },
  ECU: { bg: "#FFD100", text: "#003893" },
  ZIM: { bg: "#006400", text: "#FFD200" },
  // Grupo D
  ENG: { bg: "#CF081F", text: "#ffffff" },
  SEN: { bg: "#00853F", text: "#FDEF42" },
  NED: { bg: "#FF6600", text: "#ffffff" },
  SVK: { bg: "#003DA5", text: "#ffffff" },
  // Grupo E
  ESP: { bg: "#AA151B", text: "#F1BF00" },
  BRA: { bg: "#009C3B", text: "#FFDF00" },
  CMR: { bg: "#007A5E", text: "#CE1126" },
  TUN: { bg: "#E70013", text: "#ffffff" },
  // Grupo F
  FRA: { bg: "#002395", text: "#ED2939" },
  ALG: { bg: "#006233", text: "#D21034" },
  BEL: { bg: "#EF3340", text: "#000000" },
  UKR: { bg: "#005BBB", text: "#FFD500" },
  // Grupo G
  POR: { bg: "#006600", text: "#FF0000" },
  KOR: { bg: "#CD2E3A", text: "#003478" },
  GHA: { bg: "#006B3F", text: "#FCD116" },
  MOR: { bg: "#C1272D", text: "#006233" },
  // Grupo H
  ITA: { bg: "#009246", text: "#003DA5" },
  SAU: { bg: "#006C35", text: "#ffffff" },
  NGA: { bg: "#008751", text: "#ffffff" },
  SUI: { bg: "#FF0000", text: "#ffffff" },
  // Outros qualificados
  COL: { bg: "#FCD116", text: "#003087" },
  VEN: { bg: "#CF142B", text: "#00247D" },
  BOL: { bg: "#D52B1E", text: "#007A33" },
  PAR: { bg: "#D52B1E", text: "#ffffff" },
  NZL: { bg: "#00247D", text: "#CC142B" },
  IRN: { bg: "#239F40", text: "#DA0000" },
  IRQ: { bg: "#007A3D", text: "#CE1126" },
  JOR: { bg: "#007A3D", text: "#ffffff" },
  IND: { bg: "#FF9933", text: "#138808" },
  THA: { bg: "#A51931", text: "#2D2A4A" },
  CHN: { bg: "#DE2910", text: "#FFDE00" },
  RUS: { bg: "#D52B1E", text: "#003DA5" },
  SWE: { bg: "#006AA7", text: "#FECC02" },
  DEN: { bg: "#C60C30", text: "#ffffff" },
  NOR: { bg: "#EF2B2D", text: "#003087" },
  AUT: { bg: "#ED2939", text: "#ffffff" },
  POL: { bg: "#DC143C", text: "#ffffff" },
  CZE: { bg: "#D7141A", text: "#11457E" },
  CRO: { bg: "#FF0000", text: "#006B98" },
  SRB: { bg: "#C6363C", text: "#0C4076" },
  ROU: { bg: "#002B7F", text: "#FCD116" },
  GRE: { bg: "#0D5EAF", text: "#ffffff" },
  SCO: { bg: "#003DA5", text: "#ffffff" },
  WAL: { bg: "#C8102E", text: "#ffffff" },
  IRL: { bg: "#169B62", text: "#ffffff" },
  CIV: { bg: "#F77F00", text: "#009A44" },
  MAL: { bg: "#14B53A", text: "#CE1126" },
  EGY: { bg: "#CE1126", text: "#ffffff" },
  RSA: { bg: "#007A4D", text: "#FFB81C" },
  TAN: { bg: "#1EB53A", text: "#FCD116" },
  COD: { bg: "#007FFF", text: "#F7D618" },
  ETH: { bg: "#078930", text: "#FCDD09" },
  KEN: { bg: "#006600", text: "#BB0000" },
  SLE: { bg: "#1EB53A", text: "#0072C6" },
};

export function getTeamColors(code: string | null): { bg: string; text: string } {
  if (!code) return { bg: "#6b7280", text: "#ffffff" };
  return TEAM_COLORS[code.toUpperCase()] ?? { bg: "#6b7280", text: "#ffffff" };
}

interface TeamBadgeProps {
  code: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}

export function TeamBadge({ code, name, size = "md" }: TeamBadgeProps) {
  const { bg, text } = getTeamColors(code);
  const initials = (code ?? name.slice(0, 3)).toUpperCase().slice(0, 3);

  const sizeCls =
    size === "lg" ? "h-16 w-16 text-sm rounded-2xl" :
    size === "sm" ? "h-9 w-9 text-[10px] rounded-xl" :
                   "h-14 w-14 text-xs rounded-2xl";

  return (
    <div
      className={`${sizeCls} grid place-items-center font-display font-bold tracking-widest border border-black/10`}
      style={{ background: bg, color: text }}
    >
      {initials}
    </div>
  );
}
