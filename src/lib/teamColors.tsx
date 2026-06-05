// 3 faixas verticais na ordem correta das camisolas/bandeiras
const TEAM_COLORS: Record<string, [string, string, string]> = {
  // América do Norte
  USA: ["#BF0A30", "#ffffff", "#002868"],   // vermelho | branco | azul
  MEX: ["#006847", "#ffffff", "#CE1126"],   // verde | branco | vermelho
  CAN: ["#FF0000", "#ffffff", "#FF0000"],   // vermelho | branco | vermelho

  // América do Sul
  ARG: ["#74ACDF", "#ffffff", "#74ACDF"],   // azul claro | branco | azul claro
  BRA: ["#FFDF00", "#009C3B", "#002776"],   // amarelo | verde | azul
  COL: ["#FCD116", "#003087", "#CE1126"],   // amarelo | azul | vermelho
  URU: ["#5EB6E4", "#ffffff", "#5EB6E4"],   // azul | branco | azul
  PAR: ["#D52B1E", "#ffffff", "#0038A8"],   // vermelho | branco | azul
  VEN: ["#CF142B", "#003087", "#009A3E"],   // vermelho | azul | verde
  CHI: ["#D52B1E", "#ffffff", "#0039A6"],   // vermelho | branco | azul
  PER: ["#D91023", "#ffffff", "#D91023"],   // vermelho | branco | vermelho
  BOL: ["#D52B1E", "#007A33", "#D52B1E"],   // vermelho | verde | vermelho
  ECU: ["#FFD100", "#003893", "#CE1126"],   // amarelo | azul | vermelho

  // Europa
  FRA: ["#002395", "#ffffff", "#ED2939"],   // azul | branco | vermelho
  GER: ["#000000", "#DD0000", "#FFD700"],   // preto | vermelho | amarelo
  ESP: ["#AA151B", "#F1BF00", "#AA151B"],   // vermelho | amarelo | vermelho
  POR: ["#006600", "#FF0000", "#006600"],   // verde | vermelho | verde
  ITA: ["#003DA5", "#ffffff", "#003DA5"],   // azul | branco | azul
  ENG: ["#ffffff", "#CF081F", "#ffffff"],   // branco | vermelho | branco
  NED: ["#FF6600", "#ffffff", "#FF6600"],   // laranja | branco | laranja
  BEL: ["#000000", "#EF3340", "#FFD90C"],   // preto | vermelho | amarelo
  CRO: ["#CF0A2C", "#ffffff", "#003DA5"],   // vermelho | branco | azul
  POL: ["#ffffff", "#DC143C", "#ffffff"],   // branco | vermelho | branco
  DEN: ["#C60C30", "#ffffff", "#C60C30"],   // vermelho | branco | vermelho
  SWE: ["#006AA7", "#FECC02", "#006AA7"],   // azul | amarelo | azul
  NOR: ["#EF2B2D", "#ffffff", "#003087"],   // vermelho | branco | azul
  AUT: ["#ED2939", "#ffffff", "#ED2939"],   // vermelho | branco | vermelho
  SUI: ["#FF0000", "#ffffff", "#FF0000"],   // vermelho | branco | vermelho
  UKR: ["#005BBB", "#FFD500", "#005BBB"],   // azul | amarelo | azul
  CZE: ["#D7141A", "#ffffff", "#11457E"],   // vermelho | branco | azul
  SRB: ["#C6363C", "#0C4076", "#ffffff"],   // vermelho | azul | branco
  GRE: ["#0D5EAF", "#ffffff", "#0D5EAF"],   // azul | branco | azul
  SCO: ["#003DA5", "#ffffff", "#003DA5"],   // azul | branco | azul
  WAL: ["#C8102E", "#ffffff", "#00A651"],   // vermelho | branco | verde
  IRL: ["#169B62", "#ffffff", "#FF7900"],   // verde | branco | laranja
  ROU: ["#002B7F", "#FCD116", "#CE2028"],   // azul | amarelo | vermelho
  SVK: ["#ffffff", "#003DA5", "#CE1126"],   // branco | azul | vermelho

  // África
  SEN: ["#00853F", "#FDEF42", "#CE1126"],   // verde | amarelo | vermelho
  GHA: ["#CF0A2C", "#FCD116", "#006B3F"],   // vermelho | amarelo | verde
  MOR: ["#C1272D", "#006233", "#C1272D"],   // vermelho | verde | vermelho
  CMR: ["#007A5E", "#CE1126", "#FCD116"],   // verde | vermelho | amarelo
  TUN: ["#E70013", "#ffffff", "#E70013"],   // vermelho | branco | vermelho
  EGY: ["#CE1126", "#ffffff", "#000000"],   // vermelho | branco | preto
  NGA: ["#008751", "#ffffff", "#008751"],   // verde | branco | verde
  RSA: ["#007A4D", "#FFB81C", "#002395"],   // verde | amarelo | azul
  CIV: ["#F77F00", "#ffffff", "#009A44"],   // laranja | branco | verde
  ALG: ["#006233", "#ffffff", "#D21034"],   // verde | branco | vermelho
  MAR: ["#C1272D", "#006233", "#C1272D"],   // vermelho | verde | vermelho
  ZIM: ["#006400", "#FFD200", "#CE1126"],   // verde | amarelo | vermelho

  // Ásia
  JPN: ["#BC002D", "#ffffff", "#BC002D"],   // vermelho | branco | vermelho
  KOR: ["#CD2E3A", "#ffffff", "#003478"],   // vermelho | branco | azul
  SAU: ["#006C35", "#ffffff", "#006C35"],   // verde | branco | verde
  IRN: ["#239F40", "#ffffff", "#DA0000"],   // verde | branco | vermelho
  IRQ: ["#007A3D", "#ffffff", "#CE1126"],   // verde | branco | vermelho
  JOR: ["#007A3D", "#ffffff", "#CE1126"],   // verde | branco | vermelho
  CHN: ["#DE2910", "#FFDE00", "#DE2910"],   // vermelho | amarelo | vermelho
  AUS: ["#003DA5", "#ffffff", "#CE1126"],   // azul | branco | vermelho
  NZL: ["#00247D", "#ffffff", "#CC142B"],   // azul | branco | vermelho
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
