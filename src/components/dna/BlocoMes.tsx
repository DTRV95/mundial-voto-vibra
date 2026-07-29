import { Link } from "@tanstack/react-router";
import { UserAvatar } from "@/components/AvatarPicker";
import type { Competition } from "@/lib/useCompetitions";
import type { Mes } from "@/lib/useMes";

/**
 * Bloco 2 — O teu mês.
 *
 * Rival e missão são a mesma coisa: a tua motivação deste mês.
 * Não há títulos internos "Rival" e "Missão", nem dois sub-cartões
 * com molduras. Duas frases, um fio a separar, uma ação.
 */
export function BlocoMes({ mes, comp }: { mes: Mes; comp: Competition | null }) {
  const cor = comp?.accent ?? "var(--gold)";
  const eletrico = comp?.electric ?? "var(--gold)";

  // Sem rival nem missão: uma linha, não dois cartões vazios
  if (!mes.rival && !mes.missao) {
    return (
      <section className="rounded-2xl border border-border bg-card/60 px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          O teu mês
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          O teu primeiro desafio pessoal será revelado no início do próximo mês.
        </p>
      </section>
    );
  }

  const r = mes.rival;
  const m = mes.missao;
  const diferenca = r ? r.meus - r.dele : 0;

  // A ação segue o que é mais urgente
  const acao =
    r && Math.abs(diferenca) <= 3 ? { texto: "Ver duelo", para: "/rankings" as const }
    : m && m.progresso > 0 && m.progresso < m.alvo ? { texto: "Continuar missão", para: "/jogos" as const }
    : { texto: "Ver classificação", para: "/rankings" as const };

  return (
    <section className="rounded-2xl border border-border bg-card/70 p-5">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        O teu mês · {mes.label}
      </p>

      {/* Rival — uma frase */}
      {r && (
        <div className="flex items-center gap-3">
          <UserAvatar avatarUrl={r.avatar} name={r.nome} size={9} className="shrink-0 rounded-full" />
          <p className="min-w-0 flex-1 text-[15px] leading-snug">
            {diferenca > 0
              ? <>Estás <strong style={{ color: eletrico }}>{diferenca} pontos à frente</strong> do {r.nome}.</>
              : diferenca < 0
                ? <>Estás <strong style={{ color: cor }}>{Math.abs(diferenca)} pontos atrás</strong> do {r.nome}.</>
                : <>Estás <strong>empatado</strong> com o {r.nome}.</>}
          </p>
        </div>
      )}

      {r && m && <div className="my-3.5 h-px bg-border" />}

      {/* Missão — uma frase e um indicador */}
      {m && (
        <div>
          <p className="text-[15px] leading-snug">{m.titulo}</p>
          <div className="mt-2 flex items-center gap-2.5">
            <div className="flex gap-1.5">
              {Array.from({ length: m.alvo }, (_, i) => (
                <span key={i} className="h-2 w-2 rounded-full transition-smooth"
                  style={{ background: i < m.progresso ? eletrico : "var(--border)" }} />
              ))}
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {m.progresso} de {m.alvo}
            </span>
          </div>
        </div>
      )}

      <Link to={acao.para}
        className="mt-4 block rounded-xl py-2.5 text-center text-sm font-bold text-white transition-smooth"
        style={{
          background: `linear-gradient(135deg, ${cor}, ${comp?.deep ?? "#1a1a1a"})`,
        }}>
        {acao.texto}
      </Link>
    </section>
  );
}
