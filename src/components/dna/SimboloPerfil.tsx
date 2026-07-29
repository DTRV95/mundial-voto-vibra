import type { PerfilId } from "@/lib/dnaPerfis";

/**
 * Os símbolos dos perfis.
 *
 * Uma família visual, não dez logótipos: todos partilham a mesma
 * caixa de 48×48, a mesma espessura de traço e a mesma margem.
 * Só traço — sem preenchimentos, sem gradientes, sem sombras.
 * A cor vem sempre da competição ativa.
 */

const TRACO = 2;
const CAIXA = 48;

function Moldura({ cor, children }: { cor: string; children: React.ReactNode }) {
  return (
    <svg viewBox={`0 0 ${CAIXA} ${CAIXA}`} fill="none"
      stroke={cor} strokeWidth={TRACO}
      strokeLinecap="round" strokeLinejoin="round"
      className="h-full w-full">
      {children}
    </svg>
  );
}

/** Estratega — grelha 3×3 com o centro preenchido. Controlo, visão de conjunto. */
function Estratega({ cor }: { cor: string }) {
  return (
    <Moldura cor={cor}>
      <rect x="8" y="8" width="32" height="32" rx="2" />
      <path d="M18.7 8v32M29.3 8v32M8 18.7h32M8 29.3h32" opacity="0.45" />
      <rect x="18.7" y="18.7" width="10.6" height="10.6" fill={cor} stroke="none" />
    </Moldura>
  );
}

/** Caçador de Golos — três arcos ascendentes. Trajetória, acumulação. */
function CacadorGolos({ cor }: { cor: string }) {
  return (
    <Moldura cor={cor}>
      <path d="M8 38c6-4 10-6 16-6s10 2 16 6" />
      <path d="M11 30c5-4 8-6 13-6s8 2 13 6" opacity="0.7" />
      <path d="M14 22c4-3 6-4 10-4s6 1 10 4" opacity="0.45" />
    </Moldura>
  );
}

/** Mestre do Resultado — três quadrados concêntricos. Alvo, precisão. */
function MestreResultado({ cor }: { cor: string }) {
  return (
    <Moldura cor={cor}>
      <rect x="8" y="8" width="32" height="32" rx="2" />
      <rect x="16" y="16" width="16" height="16" rx="1.5" opacity="0.7" />
      <rect x="22.5" y="22.5" width="3" height="3" fill={cor} stroke="none" />
    </Moldura>
  );
}

/** Especialista Europeu — anel de losangos. Círculo europeu, sem imitar ninguém. */
function EspecialistaEuropeu({ cor }: { cor: string }) {
  const raio = 15;
  const centro = CAIXA / 2;
  return (
    <Moldura cor={cor}>
      {Array.from({ length: 8 }, (_, i) => {
        const ang = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const x = centro + Math.cos(ang) * raio;
        const y = centro + Math.sin(ang) * raio;
        return (
          <path key={i}
            d={`M${x} ${y - 3.2}L${x + 3.2} ${y}L${x} ${y + 3.2}L${x - 3.2} ${y}Z`}
            fill={i === 0 ? cor : "none"} />
        );
      })}
    </Moldura>
  );
}

/** Rei da Liga — barra sólida e dois traços por cima. Pódio, domínio em casa. */
function ReiDaLiga({ cor }: { cor: string }) {
  return (
    <Moldura cor={cor}>
      <rect x="8" y="32" width="32" height="8" rx="1.5" fill={cor} stroke="none" />
      <path d="M13 25h22" />
      <path d="M18 18h12" opacity="0.6" />
    </Moldura>
  );
}

/** Caçador de Surpresas — losango a romper uma linha reta. */
function CacadorSurpresas({ cor }: { cor: string }) {
  return (
    <Moldura cor={cor}>
      <path d="M8 24h9" />
      <path d="M31 24h9" />
      <path d="M24 13l8 11-8 11-8-11Z" />
    </Moldura>
  );
}

/** Favorito Seguro — escudo simples. Segurança. */
function FavoritoSeguro({ cor }: { cor: string }) {
  return (
    <Moldura cor={cor}>
      <path d="M24 9l14 5v11c0 8-6 12-14 15-8-3-14-7-14-15V14Z" />
      <path d="M18.5 24.5l4 4 7-8" opacity="0.75" />
    </Moldura>
  );
}

/** Analista de Clássicos — dois triângulos opostos que se tocam. Confronto. */
function AnalistaClassicos({ cor }: { cor: string }) {
  return (
    <Moldura cor={cor}>
      <path d="M9 11l13 13L9 37Z" />
      <path d="M39 11L26 24l13 13Z" />
    </Moldura>
  );
}

/** Sem Clubismos — círculo dividido ao meio. Duas cores, uma cabeça só. */
function SemClubismos({ cor }: { cor: string }) {
  return (
    <Moldura cor={cor}>
      <circle cx="24" cy="24" r="15" />
      <path d="M24 9v30" />
      <path d="M24 9a15 15 0 0 0 0 30Z" fill={cor} stroke="none" opacity="0.28" />
    </Moldura>
  );
}

/** Pensador Independente — pontos alinhados, um fora da linha. */
function PensadorIndependente({ cor }: { cor: string }) {
  const xs = [10, 17, 24, 31, 38];
  return (
    <Moldura cor={cor}>
      <path d="M8 30h32" opacity="0.35" />
      {xs.map(x => <circle key={x} cx={x} cy="30" r="2.4" fill={cor} stroke="none" opacity="0.55" />)}
      <circle cx="24" cy="14" r="3.6" fill={cor} stroke="none" />
      <path d="M24 18v8" strokeDasharray="2 3" opacity="0.6" />
    </Moldura>
  );
}

/** Quando ainda não há perfil: pontos a formar-se. */
function AConhecer({ cor }: { cor: string }) {
  return (
    <Moldura cor={cor}>
      <circle cx="24" cy="24" r="15" strokeDasharray="4 5" opacity="0.5" />
      <circle cx="24" cy="24" r="4" fill={cor} stroke="none" opacity="0.7" />
    </Moldura>
  );
}

const SIMBOLOS: Record<PerfilId, (p: { cor: string }) => React.ReactElement> = {
  "estratega": Estratega,
  "cacador-golos": CacadorGolos,
  "mestre-resultado": MestreResultado,
  "especialista-europeu": EspecialistaEuropeu,
  "rei-da-liga": ReiDaLiga,
  "cacador-surpresas": CacadorSurpresas,
  "favorito-seguro": FavoritoSeguro,
  "analista-classicos": AnalistaClassicos,
  "sem-clubismos": SemClubismos,
  "pensador-independente": PensadorIndependente,
};

export function SimboloPerfil({ perfil, cor, tamanho = 64, animar = false }: {
  /** null = ainda sem perfil */
  perfil: PerfilId | null;
  cor: string;
  tamanho?: number;
  /** Só na revelação e na mudança de perfil — nunca a cada visita */
  animar?: boolean;
}) {
  const Simbolo = perfil ? SIMBOLOS[perfil] : AConhecer;
  return (
    <div style={{ width: tamanho, height: tamanho }}
      className={animar ? "animate-scale-in" : undefined}>
      <Simbolo cor={cor} />
    </div>
  );
}
