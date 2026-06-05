interface TeamBadgeProps {
  code: string | null;
  flag: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}

// Flag emojis by exact team name (Portuguese)
const FLAG_BY_NAME: Record<string, string> = {
  "África do Sul": "🇿🇦",
  "Alemanha": "🇩🇪",
  "Arábia Saudita": "🇸🇦",
  "Argélia": "🇩🇿",
  "Argentina": "🇦🇷",
  "Austrália": "🇦🇺",
  "Áustria": "🇦🇹",
  "Bélgica": "🇧🇪",
  "Bósnia": "🇧🇦",
  "Brasil": "🇧🇷",
  "Cabo Verde": "🇨🇻",
  "Canadá": "🇨🇦",
  "Chéquia": "🇨🇿",
  "Colômbia": "🇨🇴",
  "Coreia do Sul": "🇰🇷",
  "Costa do Marfim": "🇨🇮",
  "Croácia": "🇭🇷",
  "Curaçau": "🇨🇼",
  "Egito": "🇪🇬",
  "Equador": "🇪🇨",
  "Escócia": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "Espanha": "🇪🇸",
  "EUA": "🇺🇸",
  "França": "🇫🇷",
  "Gana": "🇬🇭",
  "Haiti": "🇭🇹",
  "Holanda": "🇳🇱",
  "Inglaterra": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Irão": "🇮🇷",
  "Iraque": "🇮🇶",
  "Japão": "🇯🇵",
  "Jordânia": "🇯🇴",
  "Marrocos": "🇲🇦",
  "México": "🇲🇽",
  "Noruega": "🇳🇴",
  "Nova Zelândia": "🇳🇿",
  "Panamá": "🇵🇦",
  "Paraguai": "🇵🇾",
  "Portugal": "🇵🇹",
  "Qatar": "🇶🇦",
  "Rd. Congo": "🇨🇩",
  "Senegal": "🇸🇳",
  "Suécia": "🇸🇪",
  "Suíça": "🇨🇭",
  "Tunísia": "🇹🇳",
  "Turquia": "🇹🇷",
  "Uruguai": "🇺🇾",
  "Uzbequistão": "🇺🇿",
};

// Fallback: generate flag emoji from 2-letter ISO code
const FIFA_TO_ISO: Record<string, string> = {
  ARG: "AR", AUS: "AU", BEL: "BE", BRA: "BR", CMR: "CM",
  CAN: "CA", CHI: "CL", COL: "CO", CRC: "CR", CRO: "HR",
  DEN: "DK", ECU: "EC", EGY: "EG", ENG: "GB", ESP: "ES",
  FRA: "FR", GER: "DE", GHA: "GH", HAI: "HT", HON: "HN",
  HUN: "HU", IRN: "IR", IRQ: "IQ", ISL: "IS", ITA: "IT",
  JAM: "JM", JPN: "JP", JOR: "JO", KOR: "KR", KSA: "SA",
  MAR: "MA", MEX: "MX", NED: "NL", NGA: "NG", NOR: "NO",
  NZL: "NZ", PAN: "PA", PAR: "PY", PER: "PE", POL: "PL",
  POR: "PT", QAT: "QA", ROU: "RO", RSA: "ZA", SCO: "GB",
  SEN: "SN", SRB: "RS", SUI: "CH", SVK: "SK", SWE: "SE",
  TUN: "TN", TUR: "TR", UAE: "AE", UKR: "UA", URU: "UY",
  USA: "US", VEN: "VE", CPV: "CV", CIV: "CI", COD: "CD",
  CUR: "CW", ALG: "DZ", UZB: "UZ", BIH: "BA", AUT: "AT",
  CZE: "CZ",
};

function isoToEmoji(iso: string): string {
  const [a, b] = [...iso.toUpperCase()];
  return (
    String.fromCodePoint(0x1f1e6 + a.charCodeAt(0) - 65) +
    String.fromCodePoint(0x1f1e6 + b.charCodeAt(0) - 65)
  );
}

function resolveFlag(flag: string | null, code: string | null, name: string): string {
  if (flag) return flag;
  if (FLAG_BY_NAME[name]) return FLAG_BY_NAME[name];
  if (code) {
    const upper = code.toUpperCase();
    const iso = upper.length === 2 ? upper : FIFA_TO_ISO[upper];
    if (iso) return isoToEmoji(iso);
  }
  return "⚽";
}

export function TeamBadge({ code, flag, name, size = "md" }: TeamBadgeProps) {
  const sizeCls =
    size === "lg" ? "h-16 w-16 text-4xl rounded-2xl" :
    size === "sm" ? "h-9 w-9 text-xl rounded-xl" :
                   "h-14 w-14 text-3xl rounded-2xl";

  const emoji = resolveFlag(flag, code, name);

  return (
    <div
      className={`${sizeCls} grid place-items-center bg-secondary border border-border`}
      style={{ boxShadow: "0 2px 8px oklch(0 0 0 / 0.10)" }}
    >
      {emoji}
    </div>
  );
}
