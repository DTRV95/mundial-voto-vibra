import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SimboloPerfil } from "@/components/dna/SimboloPerfil";
import { PERFIS, MINIMO_PRIMEIRO_PERFIL, type PerfilId } from "@/lib/dnaPerfis";
import { useProgressoDna } from "@/lib/useDna";
import { useDnaCompleto } from "@/lib/useDnaCompleto";
import { useActiveCompetition } from "@/lib/useActiveCompetition";

/**
 * Cartão compacto para o dashboard e para o perfil.
 *
 * No máximo três coisas: perfil (ou progresso), uma informação
 * atual, e uma ação. Nada mais entra aqui — é a regra que impede
 * o cartão de crescer até virar uma segunda página de DNA.
 */
export function CartaoDnaCompacto({ userId, perfil: perfilDado }: {
  userId: string | undefined;
  /** Passar só se já se tiver o perfil calculado; senão vai buscá-lo */
  perfil?: PerfilId | null;
}) {
  const { active: comp } = useActiveCompetition();
  const { data: progresso, isLoading } = useProgressoDna(userId);
  const { data: dna } = useDnaCompleto(userId);
  const perfil = perfilDado ?? dna?.atribuicao?.perfil ?? null;

  if (!userId || isLoading || !progresso) return null;

  const cor = comp?.accent ?? "var(--gold)";
  const eletrico = comp?.electric ?? "var(--gold)";
  const p = perfil ? PERFIS[perfil] : null;

  // A linha do meio: o que interessa agora. Na Fase A é o progresso.
  const informacao = p
    ? p.descricao
    : progresso.faltam === 1
      ? "Falta 1 previsão para revelarmos o teu primeiro perfil."
      : `Faltam ${progresso.faltam} previsões para revelarmos o teu primeiro perfil.`;

  return (
    <Link to="/dna"
      className="group relative block overflow-hidden rounded-2xl border border-white/10 transition-smooth"
      style={{
        background: comp
          ? `linear-gradient(140deg, color-mix(in srgb, ${comp.accent} 20%, #0d1017) 0%, #0d1017 70%)`
          : "linear-gradient(140deg, #1b1a12 0%, #0d1017 70%)",
      }}>
      <div className="flex items-center gap-4 p-4">
        <SimboloPerfil perfil={perfil ?? null} cor={eletrico} tamanho={42} />

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
            O teu DNA
          </p>
          <p className="font-display text-lg leading-tight text-white">
            {p ? p.nome : "Ainda a conhecer-te"}
          </p>
          <p className="mt-0.5 truncate text-xs text-white/55">{informacao}</p>

          {!p && (
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full"
                style={{
                  width: `${Math.max(progresso.fracao * 100, progresso.previsoesAvaliadas > 0 ? 4 : 0)}%`,
                  background: `linear-gradient(90deg, ${cor}, ${eletrico})`,
                }} />
            </div>
          )}
        </div>

        <ArrowRight className="h-4 w-4 shrink-0 text-white/40 transition-transform group-hover:translate-x-0.5" />
      </div>

      <span className="sr-only">
        {progresso.previsoesAvaliadas} de {MINIMO_PRIMEIRO_PERFIL} previsões analisadas
      </span>
    </Link>
  );
}
