interface TeamBadgeProps {
  code: string | null;
  flag: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}

// ISO 2-letter code by exact team name (Portuguese)
const ISO_BY_NAME: Record<string, string> = {
  "África do Sul": "za",
  "Alemanha": "de",
  "Arábia Saudita": "sa",
  "Argélia": "dz",
  "Argentina": "ar",
  "Austrália": "au",
  "Áustria": "at",
  "Bélgica": "be",
  "Bósnia": "ba",
  "Brasil": "br",
  "Cabo Verde": "cv",
  "Canadá": "ca",
  "Chéquia": "cz",
  "Colômbia": "co",
  "Coreia do Sul": "kr",
  "Costa do Marfim": "ci",
  "Croácia": "hr",
  "Curaçau": "cw",
  "Egito": "eg",
  "Equador": "ec",
  "Escócia": "gb-sct",
  "Espanha": "es",
  "EUA": "us",
  "França": "fr",
  "Gana": "gh",
  "Haiti": "ht",
  "Holanda": "nl",
  "Inglaterra": "gb-eng",
  "Irão": "ir",
  "Iraque": "iq",
  "Japão": "jp",
  "Jordânia": "jo",
  "Marrocos": "ma",
  "México": "mx",
  "Noruega": "no",
  "Nova Zelândia": "nz",
  "Panamá": "pa",
  "Paraguai": "py",
  "Portugal": "pt",
  "Qatar": "qa",
  "Rd. Congo": "cd",
  "Senegal": "sn",
  "Suécia": "se",
  "Suíça": "ch",
  "Tunísia": "tn",
  "Turquia": "tr",
  "Uruguai": "uy",
  "Uzbequistão": "uz",
};

// FIFA 3-letter → ISO 2-letter fallback
const FIFA_TO_ISO: Record<string, string> = {
  ARG: "ar", AUS: "au", BEL: "be", BRA: "br", CAN: "ca",
  CHI: "cl", COL: "co", CRC: "cr", CRO: "hr", DEN: "dk",
  ECU: "ec", EGY: "eg", ENG: "gb-eng", ESP: "es", FRA: "fr",
  GER: "de", GHA: "gh", HAI: "ht", HON: "hn", HUN: "hu",
  IRN: "ir", IRQ: "iq", JPN: "jp", JOR: "jo", KOR: "kr",
  KSA: "sa", MAR: "ma", MEX: "mx", NED: "nl", NOR: "no",
  NZL: "nz", PAN: "pa", PAR: "py", POL: "pl", POR: "pt",
  QAT: "qa", RSA: "za", SCO: "gb-sct", SEN: "sn", SRB: "rs",
  SUI: "ch", SWE: "se", TUN: "tn", TUR: "tr", URU: "uy",
  USA: "us", CPV: "cv", CIV: "ci", COD: "cd", CUR: "cw",
  ALG: "dz", UZB: "uz", BIH: "ba", AUT: "at", CZE: "cz",
};

function resolveIso(code: string | null, name: string): string | null {
  if (ISO_BY_NAME[name]) return ISO_BY_NAME[name];
  if (code) {
    const upper = code.toUpperCase();
    if (upper.length === 2) return upper.toLowerCase();
    if (FIFA_TO_ISO[upper]) return FIFA_TO_ISO[upper];
  }
  return null;
}

export function TeamBadge({ code, flag: _flag, name, size = "md" }: TeamBadgeProps) {
  const sizeCls =
    size === "lg" ? "h-16 w-16 rounded-2xl" :
    size === "sm" ? "h-9 w-9 rounded-xl" :
                   "h-14 w-14 rounded-2xl";

  const iso = resolveIso(code, name);
  const flagUrl = iso
    ? `https://flagcdn.com/w80/${iso}.png`
    : null;

  return (
    <div
      className={`${sizeCls} overflow-hidden border border-border bg-secondary`}
      style={{ boxShadow: "0 2px 8px oklch(0 0 0 / 0.10)" }}
    >
      {flagUrl ? (
        <img
          src={flagUrl}
          alt={name}
          className="h-full w-full object-cover"
          onError={e => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div className="h-full w-full grid place-items-center text-2xl">⚽</div>
      )}
    </div>
  );
}
