interface TeamBadgeProps {
  code: string | null;
  flag: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}

// Map FIFA 3-letter codes to ISO 2-letter country codes
const FIFA_TO_ISO: Record<string, string> = {
  ARG: "AR", AUS: "AU", BEL: "BE", BRA: "BR", CMR: "CM",
  CAN: "CA", CHI: "CL", CHN: "CN", COL: "CO", CRC: "CR",
  CRO: "HR", DEN: "DK", ECU: "EC", EGY: "EG", ENG: "GB",
  ESP: "ES", FRA: "FR", GER: "DE", GHA: "GH", GRE: "GR",
  HON: "HN", HUN: "HU", IRN: "IR", IRQ: "IQ", ISL: "IS",
  ITA: "IT", JAM: "JM", JPN: "JP", KOR: "KR", KSA: "SA",
  MAR: "MA", MEX: "MX", NED: "NL", NGA: "NG", NOR: "NO",
  NZL: "NZ", PAN: "PA", PAR: "PY", PER: "PE", POL: "PL",
  POR: "PT", QAT: "QA", ROU: "RO", RSA: "ZA", SCO: "GB",
  SEN: "SN", SRB: "RS", SUI: "CH", SVK: "SK", SWE: "SE",
  TUN: "TN", TUR: "TR", UAE: "AE", UKR: "UA", URU: "UY",
  USA: "US", VEN: "VE", WAL: "GB", MLI: "ML", ALB: "AL",
  AUT: "AT", BIH: "BA", BFA: "BF", CGO: "CG", CIV: "CI",
  CZE: "CZ", FIN: "FI", GEO: "GE", GNB: "GW", GTM: "GT",
  HAI: "HT", ISR: "IL", KGZ: "KG", KUW: "KW", LBA: "LY",
  MDA: "MD", MOZ: "MZ", MYA: "MM", NAM: "NA", NCA: "NI",
  OMN: "OM", PHI: "PH", PNG: "PG", RUS: "RU", SLV: "SV",
  SOM: "SO", SYR: "SY", THA: "TH", TRI: "TT", VIE: "VN",
  ZAM: "ZM", ZIM: "ZW",
};

function flagEmoji(code: string | null): string {
  if (!code) return "⚽";
  const upper = code.toUpperCase();
  // If already 2-letter ISO
  const iso = upper.length === 2 ? upper : FIFA_TO_ISO[upper];
  if (!iso || iso.length !== 2) return "⚽";
  // Generate regional indicator emoji from ISO code
  const [a, b] = [...iso];
  return (
    String.fromCodePoint(0x1f1e6 + a.charCodeAt(0) - 65) +
    String.fromCodePoint(0x1f1e6 + b.charCodeAt(0) - 65)
  );
}

export function TeamBadge({ code, flag, name: _name, size = "md" }: TeamBadgeProps) {
  const sizeCls =
    size === "lg" ? "h-16 w-16 text-4xl rounded-2xl" :
    size === "sm" ? "h-9 w-9 text-xl rounded-xl" :
                   "h-14 w-14 text-3xl rounded-2xl";

  const emoji = flag ?? flagEmoji(code);

  return (
    <div
      className={`${sizeCls} grid place-items-center bg-secondary border border-border`}
      style={{ boxShadow: "0 2px 8px oklch(0 0 0 / 0.10)" }}
    >
      {emoji}
    </div>
  );
}
