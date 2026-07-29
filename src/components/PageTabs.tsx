import { Link, useRouterState } from "@tanstack/react-router";

/**
 * Separadores entre páginas irmãs.
 *
 * Cada página mantém o seu endereço próprio (bom para partilhar e para
 * o Google), mas passam a ler-se como um só sítio. Evita encher a
 * navegação principal com páginas de consulta.
 */

export interface Aba {
  to: string;
  label: string;
}

/** Jogar — tudo o que gira à volta da jornada. */
export const ABAS_JOGAR: Aba[] = [
  { to: "/jogos", label: "A tua jornada" },
  { to: "/prognosticos", label: "Prognósticos" },
  { to: "/classificacao", label: "Tabela" },
];

/** Competir com pessoas concretas. */
export const ABAS_SOCIAL: Aba[] = [
  { to: "/ligas", label: "Torneios" },
  { to: "/duelos", label: "Duelos" },
];

/**
 * Os separadores e o selector de competição partilham a mesma linha.
 * Empilhados eram duas barras de controlos antes de se ver conteúdo —
 * meio ecrã num telemóvel.
 */
export function PageTabs({ abas, direita }: { abas: Aba[]; direita?: React.ReactNode }) {
  const { location } = useRouterState();

  return (
    <div className="-mx-4 mb-5 overflow-x-auto px-4 md:mx-0 md:px-0">
      <div className="flex w-max items-center gap-3">
        <div className="flex gap-1 rounded-full border border-border bg-card/60 p-1">
          {abas.map(({ to, label }) => {
            const ativa = location.pathname === to || location.pathname.startsWith(`${to}/`);
            return (
              <Link key={to} to={to}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-smooth ${
                  ativa
                    ? "bg-gold text-background shadow-gold"
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                {label}
              </Link>
            );
          })}
        </div>
        {direita}
      </div>
    </div>
  );
}
