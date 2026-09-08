/**
 * Emblemas de clube gerados pela plataforma.
 *
 * NÃO são os emblemas oficiais — é uma decisão deliberada, para evitar
 * questões de direitos de marca. São uma forma geométrica própria do
 * site, com as cores do clube e o monograma que vem da API.
 *
 * As cores de um clube são um facto público, não uma marca registada.
 * A forma é nossa e não imita nenhum emblema real.
 */

interface Cores {
  /** Cor dominante */
  primaria: string;
  /** Cor de contraste, para a metade inferior */
  secundaria: string;
  /** Cor do monograma */
  texto: string;
}

/**
 * Cores por palavra-chave no nome do clube. A procura é por inclusão,
 * para aguentar variações ("SL Benfica", "Benfica B", "Sport Lisboa e Benfica").
 */
const CORES_POR_CLUBE: { chave: string; cores: Cores }[] = [
  // Liga Portugal
  { chave: "benfica",    cores: { primaria: "#C8102E", secundaria: "#F5F5F5", texto: "#FFFFFF" } },
  { chave: "porto",      cores: { primaria: "#00428C", secundaria: "#F5F5F5", texto: "#FFFFFF" } },
  { chave: "sporting",   cores: { primaria: "#0A7D3E", secundaria: "#F5F5F5", texto: "#FFFFFF" } },
  { chave: "braga",      cores: { primaria: "#B4141E", secundaria: "#8A0F17", texto: "#FFFFFF" } },
  { chave: "vitória",    cores: { primaria: "#000000", secundaria: "#F5F5F5", texto: "#FFFFFF" } },
  { chave: "guimarães",  cores: { primaria: "#000000", secundaria: "#F5F5F5", texto: "#FFFFFF" } },
  { chave: "famalicão",  cores: { primaria: "#0E4C92", secundaria: "#F5F5F5", texto: "#FFFFFF" } },
  { chave: "arouca",     cores: { primaria: "#F5C518", secundaria: "#1A6B3C", texto: "#1A1A1A" } },
  { chave: "moreirense", cores: { primaria: "#1A7A3C", secundaria: "#F5F5F5", texto: "#FFFFFF" } },
  { chave: "estoril",    cores: { primaria: "#F5D000", secundaria: "#0A4DA0", texto: "#1A1A1A" } },
  { chave: "gil vicente",cores: { primaria: "#B4141E", secundaria: "#F5F5F5", texto: "#FFFFFF" } },
  { chave: "casa pia",   cores: { primaria: "#000000", secundaria: "#C8102E", texto: "#FFFFFF" } },
  { chave: "rio ave",    cores: { primaria: "#0A7D3E", secundaria: "#F5F5F5", texto: "#FFFFFF" } },
  { chave: "santa clara",cores: { primaria: "#C8102E", secundaria: "#F5F5F5", texto: "#FFFFFF" } },
  { chave: "nacional",   cores: { primaria: "#000000", secundaria: "#C8102E", texto: "#FFFFFF" } },
  { chave: "estrela",    cores: { primaria: "#C8102E", secundaria: "#0A4DA0", texto: "#FFFFFF" } },
  { chave: "avs",        cores: { primaria: "#1A1A1A", secundaria: "#F5C518", texto: "#FFFFFF" } },
  { chave: "tondela",    cores: { primaria: "#F5D000", secundaria: "#1A6B3C", texto: "#1A1A1A" } },
  { chave: "alverca",    cores: { primaria: "#C8102E", secundaria: "#1A1A1A", texto: "#FFFFFF" } },
  { chave: "farense",    cores: { primaria: "#1A1A1A", secundaria: "#F5F5F5", texto: "#FFFFFF" } },
  { chave: "boavista",   cores: { primaria: "#1A1A1A", secundaria: "#F5F5F5", texto: "#FFFFFF" } },
  { chave: "marítimo",   cores: { primaria: "#0A7D3E", secundaria: "#C8102E", texto: "#FFFFFF" } },
  { chave: "leiria",     cores: { primaria: "#0A4DA0", secundaria: "#F5F5F5", texto: "#FFFFFF" } },

  // Champions — os que mais aparecem
  { chave: "real madrid",cores: { primaria: "#FEBE10", secundaria: "#F5F5F5", texto: "#1A1A1A" } },
  { chave: "barcelona",  cores: { primaria: "#A50044", secundaria: "#004D98", texto: "#FFFFFF" } },
  { chave: "bayern",     cores: { primaria: "#DC052D", secundaria: "#0066B2", texto: "#FFFFFF" } },
  { chave: "manchester city", cores: { primaria: "#6CABDD", secundaria: "#1C2C5B", texto: "#FFFFFF" } },
  { chave: "liverpool",  cores: { primaria: "#C8102E", secundaria: "#00B2A9", texto: "#FFFFFF" } },
  { chave: "arsenal",    cores: { primaria: "#EF0107", secundaria: "#F5F5F5", texto: "#FFFFFF" } },
  { chave: "chelsea",    cores: { primaria: "#034694", secundaria: "#F5F5F5", texto: "#FFFFFF" } },
  { chave: "inter",      cores: { primaria: "#0068A8", secundaria: "#1A1A1A", texto: "#FFFFFF" } },
  { chave: "milan",      cores: { primaria: "#FB090B", secundaria: "#1A1A1A", texto: "#FFFFFF" } },
  { chave: "juventus",   cores: { primaria: "#1A1A1A", secundaria: "#F5F5F5", texto: "#FFFFFF" } },
  { chave: "atlético",   cores: { primaria: "#CE3524", secundaria: "#F5F5F5", texto: "#FFFFFF" } },
  { chave: "dortmund",   cores: { primaria: "#FDE100", secundaria: "#1A1A1A", texto: "#1A1A1A" } },
  { chave: "psg",        cores: { primaria: "#004170", secundaria: "#DA291C", texto: "#FFFFFF" } },
  { chave: "paris",      cores: { primaria: "#004170", secundaria: "#DA291C", texto: "#FFFFFF" } },
  { chave: "napoli",     cores: { primaria: "#12A0D7", secundaria: "#003C7D", texto: "#FFFFFF" } },
  { chave: "ajax",       cores: { primaria: "#D2122E", secundaria: "#F5F5F5", texto: "#FFFFFF" } },
];

const NEUTRO: Cores = { primaria: "#3A3F4B", secundaria: "#22262F", texto: "#E8E8E8" };

/** Cores de um clube, ou um cinzento neutro se não o conhecermos. */
export function coresDoClube(nome: string): Cores {
  const n = nome.toLowerCase();
  return CORES_POR_CLUBE.find(c => n.includes(c.chave))?.cores ?? NEUTRO;
}

/** Monograma de recurso, quando a base de dados não tem um. */
function monogramaDe(nome: string): string {
  const limpo = nome
    .replace(/\b(FC|SC|SL|CD|CF|AC|AS|SS|CS|GD|UD|RC|VfL|Futebol|Clube|Sport|Sporting|de|do|da|e)\b/gi, "")
    .trim();
  const palavras = limpo.split(/\s+/).filter(Boolean);
  if (palavras.length >= 2) return palavras.slice(0, 3).map(p => p[0]).join("").toUpperCase();
  return (limpo || nome).slice(0, 3).toUpperCase();
}

const TAMANHOS = {
  xs: { caixa: "h-5 w-5 rounded-md", texto: "text-[7px]" },
  sm: { caixa: "h-9 w-9 rounded-xl", texto: "text-[10px]" },
  md: { caixa: "h-14 w-14 rounded-2xl", texto: "text-sm" },
  lg: { caixa: "h-16 w-16 rounded-2xl", texto: "text-base" },
  xl: { caixa: "h-20 w-20 rounded-3xl", texto: "text-xl" },
} as const;

/**
 * Emblema de um clube: dois tons na diagonal e o monograma por cima.
 * A forma é a mesma para todos — é a assinatura visual do site.
 */
export function ClubBadge({ name, monogram, size = "md" }: {
  name: string;
  monogram?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}) {
  const { primaria, secundaria, texto } = coresDoClube(name);
  const sigla = (monogram && monogram.length >= 2 ? monogram : monogramaDe(name)).slice(0, 3);
  const t = TAMANHOS[size];

  return (
    <div
      className={`${t.caixa} relative grid shrink-0 place-items-center overflow-hidden border border-white/10`}
      style={{
        background: `linear-gradient(135deg, ${primaria} 0%, ${primaria} 48%, ${secundaria} 52%, ${secundaria} 100%)`,
        boxShadow: "0 2px 8px oklch(0 0 0 / 0.28), inset 0 1px 0 rgba(255,255,255,0.18)",
      }}
      title={name}
    >
      {/* Brilho no canto, para não parecer um autocolante liso */}
      <span className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.22), transparent 60%)" }} />
      <span className={`relative font-display leading-none tracking-tight ${t.texto}`}
        style={{ color: texto, textShadow: "0 1px 2px rgba(0,0,0,0.45)" }}>
        {sigla}
      </span>
    </div>
  );
}

/**
 * Nome de clube encurtado, para caber num telemóvel.
 * "Sport Lisboa e Benfica" → "Benfica"
 * "Sporting Clube de Portugal" → "Sporting"
 * "Académico de Viseu FC" → "Académico Viseu"
 */
export function nomeCurto(nome: string): string {
  const conhecidos: [RegExp, string][] = [
    [/benfica/i, "Benfica"],
    [/\bporto\b/i, "FC Porto"],
    [/sporting clube de portugal|sporting cp/i, "Sporting"],
    [/sporting.*braga|\bbraga\b/i, "SC Braga"],
    [/vit[oó]ria.*guimar|guimar/i, "Vitória SC"],
    [/académico de viseu|academico de viseu/i, "Ac. Viseu"],
    [/estrela.*amadora/i, "Estrela"],
    [/santa clara/i, "Santa Clara"],
    [/nacional/i, "Nacional"],
    [/famalic/i, "Famalicão"],
    [/moreirense/i, "Moreirense"],
    [/gil vicente/i, "Gil Vicente"],
    [/casa pia/i, "Casa Pia"],
    [/rio ave/i, "Rio Ave"],
    [/estoril/i, "Estoril"],
    [/arouca/i, "Arouca"],
    [/alverca/i, "Alverca"],
    [/tondela/i, "Tondela"],
    [/naval|\bavs\b/i, "AVS"],
  ];
  for (const [padrao, curto] of conhecidos) {
    if (padrao.test(nome)) return curto;
  }

  // Caso geral: tirar prefixos e sufixos de tipo de clube
  const limpo = nome
    .replace(/\b(FC|SC|SL|CD|CF|AC|AS|SS|CS|GD|UD|RC|SAD|Futebol|Clube|Sport|Sporting|Associa[çc][ãa]o|de|do|da|e)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return limpo || nome;
}
