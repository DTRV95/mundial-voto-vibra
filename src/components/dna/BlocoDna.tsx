import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SimboloPerfil } from "@/components/dna/SimboloPerfil";
import { ROTULO_ESTADO, MINIMO_PRIMEIRO_PERFIL, type PerfilId, PERFIS } from "@/lib/dnaPerfis";
import type { ProgressoDna } from "@/lib/useDna";
import type { Competition } from "@/lib/useCompetitions";

/**
 * Bloco 1 — o elemento principal da página.
 *
 * É o único bloco que existe sempre. Antes de haver perfil mostra
 * o progresso e, quando existir, uma observação verdadeira sobre o
 * estilo de escolha. Nunca mostra um perfil inventado.
 */
export function BlocoDna({ progresso, observacao, perfil, traco, comp }: {
  progresso: ProgressoDna;
  observacao: string | null;
  /** null enquanto não houver amostra para atribuir */
  perfil: PerfilId | null;
  traco: PerfilId | null;
  comp: Competition | null;
}) {
  const [aberto, setAberto] = useState(false);
  const cor = comp?.accent ?? "var(--gold)";
  const eletrico = comp?.electric ?? "var(--gold)";
  const p = perfil ? PERFIS[perfil] : null;

  const acerto = progresso.mercadosTentados > 0
    ? Math.round((progresso.mercadosCertos / progresso.mercadosTentados) * 100)
    : null;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10"
      style={{
        background: comp
          ? `linear-gradient(155deg, color-mix(in srgb, ${comp.accent} 24%, #0d1017) 0%, #0d1017 62%)`
          : "linear-gradient(155deg, #1b1a12 0%, #0d1017 62%)",
        boxShadow: `0 16px 44px -18px ${comp?.glow ?? "rgba(0,0,0,0.5)"}`,
      }}>

      <div className="p-6 md:p-8">
        <div className="flex items-start gap-5">
          <SimboloPerfil perfil={perfil} cor={eletrico} tamanho={64} />

          <div className="min-w-0 flex-1">
            {p ? (
              <>
                <h2 className="font-display text-3xl leading-none text-white md:text-4xl">
                  {p.nome}
                </h2>
                {traco && (
                  <p className="mt-1.5 text-sm text-white/55">{PERFIS[traco].traco}</p>
                )}
                <p className="mt-3 text-[15px] leading-relaxed text-white/80">
                  {p.descricao}
                </p>
              </>
            ) : (
              <>
                <h2 className="font-display text-2xl leading-tight text-white md:text-3xl">
                  Ainda estamos a conhecer-te
                </h2>
                <p className="mt-2.5 text-[15px] leading-relaxed text-white/70">
                  Cada previsão ajuda-nos a perceber o teu estilo.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Progresso — a única barra da página */}
        <div className="mt-6">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold text-white/85">
              {progresso.previsoesAvaliadas} de {MINIMO_PRIMEIRO_PERFIL} previsões analisadas
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: eletrico }}>
              {ROTULO_ESTADO[progresso.estado]}
            </span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.max(progresso.fracao * 100, progresso.previsoesAvaliadas > 0 ? 4 : 0)}%`,
                background: `linear-gradient(90deg, ${cor}, ${eletrico})`,
              }} />
          </div>

          {progresso.faltam > 0 && (
            <p className="mt-2.5 text-sm text-white/60">
              {progresso.faltam === 1
                ? "Falta 1 previsão para revelarmos o teu primeiro perfil."
                : `Faltam ${progresso.faltam} previsões para revelarmos o teu primeiro perfil.`}
            </p>
          )}
        </div>

        {/* Observação verdadeira, quando existir */}
        {observacao && (
          <p className="mt-5 border-l-2 pl-3.5 text-[15px] leading-relaxed text-white/75"
            style={{ borderColor: eletrico }}>
            {observacao}
          </p>
        )}

        {/* Saber porquê — expande no sítio, sem modal */}
        {(p || acerto !== null) && (
          <div className="mt-5">
            <button onClick={() => setAberto(v => !v)}
              className="inline-flex items-center gap-1 text-sm font-bold transition-smooth"
              style={{ color: eletrico }}>
              Saber porquê
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${aberto ? "rotate-180" : ""}`} />
            </button>

            {aberto && (
              <div className="mt-3 space-y-2 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-white/70">
                {acerto !== null && (
                  <p>
                    Acertaste em <strong className="text-white">{acerto}%</strong> dos
                    mercados que preencheste, em {progresso.previsoesAvaliadas}{" "}
                    {progresso.previsoesAvaliadas === 1 ? "jogo já disputado" : "jogos já disputados"}.
                  </p>
                )}
                {!p && (
                  <p>
                    O teu perfil sai da comparação entre os teus mercados, competições
                    e tipos de jogo — sempre em relação à tua própria média. Por isso
                    precisamos de {MINIMO_PRIMEIRO_PERFIL} jogos antes de dizer seja o que for.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
