import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Target } from "lucide-react";
import type { Competition } from "@/lib/useCompetitions";
import type { Jornada } from "@/lib/useJornada";
import { TeamBadge } from "@/lib/teamColors.tsx";

/**
 * O cartão da jornada — o que substituiu três blocos da homepage
 * ("jogos por votar", "jogos de hoje" e o banner de prognósticos).
 *
 * A pergunta que responde é sempre a mesma: o que tenho de fazer,
 * e quanto tempo me resta.
 */

function contagem(ate: string | null): string | null {
  if (!ate) return null;
  const falta = new Date(ate).getTime() - Date.now();
  if (falta <= 0) return null;

  const dias = Math.floor(falta / 86400000);
  const horas = Math.floor((falta % 86400000) / 3600000);
  const minutos = Math.floor((falta % 3600000) / 60000);

  if (dias > 0) return `${dias}d ${horas}h`;
  if (horas > 0) return `${horas}h ${minutos}m`;
  return `${minutos}m`;
}

export function CartaoJornada({ jornada, comp }: { jornada: Jornada; comp: Competition | null }) {
  const [resta, setResta] = useState<string | null>(() => contagem(jornada.fecha_em));

  // Só corre de minuto a minuto — não precisa de mais precisão
  useEffect(() => {
    const t = setInterval(() => setResta(contagem(jornada.fecha_em)), 60_000);
    return () => clearInterval(t);
  }, [jornada.fecha_em]);

  const total = jornada.jogos.length;
  const feitas = jornada.votados;
  const completa = feitas === total && total > 0;
  const porFazer = total - feitas;

  const cor = comp?.accent ?? "var(--gold)";
  const fundo = comp
    ? `linear-gradient(150deg, ${comp.accent} 0%, ${comp.deep} 100%)`
    : "linear-gradient(150deg, oklch(0.55 0.20 142) 0%, oklch(0.30 0.10 142) 100%)";

  return (
    <div className="relative overflow-hidden rounded-2xl transition-smooth"
      style={{
        background: fundo,
        boxShadow: `0 1px 3px oklch(0 0 0 / 0.16), 0 10px 26px -8px ${comp?.glow ?? "rgba(0,0,0,0.4)"}, inset 0 1px 0 oklch(1 0 0 / 0.16)`,
      }}>
      <div className="sheen absolute inset-0" />

      <div className="relative px-5 py-4">
        {/* Cabeçalho: o que é, e quanto falta */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
              {comp?.name ?? "Jornada"}
            </p>
            <h3 className="font-display text-xl leading-tight text-white">
              {completa ? "Jornada completa" : jornada.label}
            </h3>
          </div>

          {resta && !completa && (
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
              <Clock className="h-3 w-3" /> fecha em {resta}
            </span>
          )}
          {completa && (
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
              <CheckCircle2 className="h-3 w-3" /> tudo feito
            </span>
          )}
        </div>

        {/* Progresso — cinco pastilhas, uma por jogo */}
        <div className="mb-3 flex items-center gap-2">
          <div className="flex flex-1 gap-1.5">
            {jornada.jogos.map(j => (
              <span key={j.id} className="h-1.5 flex-1 rounded-full transition-smooth"
                style={{ background: j.already_voted ? "#fff" : "rgba(255,255,255,0.22)" }} />
            ))}
          </div>
          <span className="shrink-0 text-xs font-bold text-white/80 tabular-nums">
            {feitas}/{total}
          </span>
        </div>

        {/* Os jogos, em miniatura — dá contexto sem obrigar a navegar */}
        <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {jornada.jogos.map(j => (
            <Link key={j.id} to="/jogo/$id" params={{ id: j.id }}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 transition-smooth ${
                j.already_voted ? "bg-white/10" : "bg-black/20 hover:bg-black/30"
              }`}>
              <TeamBadge code={j.home.code} flag={j.home.flag} name={j.home.name} size="sm" />
              <span className="text-[10px] font-bold text-white/50">v</span>
              <TeamBadge code={j.away.code} flag={j.away.flag} name={j.away.name} size="sm" />
              {j.already_voted && <CheckCircle2 className="h-3 w-3 shrink-0 text-white/70" />}
            </Link>
          ))}
        </div>

        {/* Ação */}
        <div className="flex items-center gap-2">
          <Link to="/jogos"
            className="flex-1 rounded-xl bg-white px-4 py-2.5 text-center text-sm font-bold transition-smooth hover:scale-[1.01]"
            style={{ color: comp?.deep ?? "#1a1a1a" }}>
            {completa ? "Rever as minhas previsões" : porFazer === total ? "Fazer as previsões" : `Faltam ${porFazer}`}
          </Link>
          <Link to="/prognosticos"
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/25 px-3 py-2.5 text-sm font-bold text-white/90 transition-smooth hover:bg-white/10"
            title="Análises antes de votares">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Prognósticos</span>
          </Link>
        </div>
      </div>

      <span className="sr-only" style={{ color: cor }} />
    </div>
  );
}

/** Quando não há jornada publicada — diz o que está a acontecer, sem parecer avaria. */
export function CartaoSemJornada({ comp }: { comp: Competition | null }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 px-5 py-6 text-center">
      <p className="font-display text-lg">Ainda não há jornada aberta</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        Assim que a próxima jornada de {comp?.name ?? "competição"} for publicada,
        os 5 jogos aparecem aqui para votares.
      </p>
    </div>
  );
}
