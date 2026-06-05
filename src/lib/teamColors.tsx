// 3 cores por seleção: faixas verticais da camisola principal
const TEAM_COLORS: Record<string, [string, string, string]> = {
  USA: ["#002868", "#BF0A30", "#002868"],
  MEX: ["#006847", "#ffffff", "#CE1126"],
  CAN: ["#FF0000", "#ffffff", "#FF0000"],
  URU: ["#5EB6E4", "#ffffff", "#5EB6E4"],
  ARG: ["#74ACDF", "#ffffff", "#74ACDF"],
  CHI: ["#D52B1E", "#0039A6", "#D52B1E"],
  PER: ["#D91023", "#ffffff", "#D91023"],
  AUS: ["#00843D", "#FFD700", "#00843D"],
  GER: ["#000000", "#DD0000", "#FFD700"],
  JPN: ["#BC002D", "#ffffff", "#BC002D"],
  ECU: ["#FFD100", "#003893", "#CE1126"],
  ENG: ["#ffffff", "#CF081F", "#ffffff"],
  SEN: ["#00853F", "#FDEF42", "#CE1126"],
  NED: ["#FF6600", "#ffffff", "#FF6600"],
  ESP: ["#AA151B", "#F1BF00", "#AA151B"],
  BRA: ["#009C3B", "#FFDF00", "#002776"],
  FRA: ["#002395", "#ffffff", "#ED2939"],
  BEL: ["#000000", "#EF3340", "#FFD90C"],
  POR: ["#006600", "#FF0000", "#006600"],
  KOR: ["#CD2E3A", "#003478", "#CD2E3A"],
  GHA: ["#006B3F", "#FCD116", "#CE1126"],
  MOR: ["#C1272D", "#006233", "#C1272D"],
  ITA: ["#003DA5", "#009246", "#CE2B37"],
  NGA: ["#008751", "#ffffff", "#008751"],
  SUI: ["#FF0000", "#ffffff", "#FF0000"],
  SAU: ["#006C35", "#ffffff", "#006C35"],
  COL: ["#FCD116", "#003087", "#CE1126"],
  VEN: ["#CF142B", "#00247D", "#009A3E"],
  URY: ["#5EB6E4", "#ffffff", "#5EB6E4"],
  PAR: ["#D52B1E", "#ffffff", "#0038A8"],
  CRO: ["#FF0000", "#ffffff", "#003DA5"],
  SRB: ["#C6363C", "#0C4076", "#C6363C"],
  POL: ["#ffffff", "#DC143C", "#ffffff"],
  DEN: ["#C60C30", "#ffffff", "#C60C30"],
  SWE: ["#006AA7", "#FECC02", "#006AA7"],
  NOR: ["#EF2B2D", "#ffffff", "#003087"],
  AUT: ["#ED2939", "#ffffff", "#ED2939"],
  CZE: ["#D7141A", "#11457E", "#ffffff"],
  UKR: ["#005BBB", "#FFD500", "#005BBB"],
  ALG: ["#006233", "#ffffff", "#D21034"],
  CMR: ["#007A5E", "#CE1126", "#FCD116"],
  TUN: ["#E70013", "#ffffff", "#E70013"],
  EGY: ["#CE1126", "#ffffff", "#000000"],
  RSA: ["#007A4D", "#FFB81C", "#002395"],
  MAR: ["#C1272D", "#006233", "#C1272D"],
  CIV: ["#F77F00", "#ffffff", "#009A44"],
  CHN: ["#DE2910", "#FFDE00", "#DE2910"],
  JOR: ["#007A3D", "#ffffff", "#CE1126"],
  IRN: ["#239F40", "#ffffff", "#DA0000"],
  IRQ: ["#007A3D", "#CE1126", "#000000"],
  NZL: ["#00247D", "#CC142B", "#ffffff"],
  GRE: ["#0D5EAF", "#ffffff", "#0D5EAF"],
  SCO: ["#003DA5", "#ffffff", "#003DA5"],
  WAL: ["#C8102E", "#ffffff", "#00A651"],
  IRL: ["#169B62", "#ffffff", "#FF7900"],
  ROU: ["#002B7F", "#FCD116", "#CE2028"],
  SVK: ["#003DA5", "#ffffff", "#CE1126"],
  ZIM: ["#006400", "#FFD200", "#CE1126"],
};

const FALLBACK: [string, string, string] = ["#9ca3af", "#6b7280", "#9ca3af"];

export function getTeamStripes(code: string | null): [string, string, string] {
  if (!code) return FALLBACK;
  return TEAM_COLORS[code.toUpperCase()] ?? FALLBACK;
}

interface TeamBadgeProps {
  code: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}

export function TeamBadge({ code, name: _name, size = "md" }: TeamBadgeProps) {
  const [c1, c2, c3] = getTeamStripes(code);

  const sizeCls =
    size === "lg" ? "h-16 w-16 rounded-2xl" :
    size === "sm" ? "h-9 w-9 rounded-xl" :
                   "h-14 w-14 rounded-2xl";

  return (
    <div
      className={`${sizeCls} overflow-hidden flex border border-black/10`}
      style={{ boxShadow: "0 2px 8px oklch(0 0 0 / 0.15)" }}
    >
      <div className="flex-1" style={{ background: c1 }} />
      <div className="flex-1" style={{ background: c2 }} />
      <div className="flex-1" style={{ background: c3 }} />
    </div>
  );
}
