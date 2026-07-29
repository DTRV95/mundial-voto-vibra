import { useState } from "react";
import { X, ChevronRight } from "lucide-react";
import type { Competition } from "@/lib/useCompetitions";
import type { ResumoMensal as Resumo } from "@/lib/useMes";
import { MISSOES } from "@/lib/useMes";

/**
 * O resumo do mês, em cartões de ecrã inteiro.
 *
 * É o único sítio de toda a experiência com gestos horizontais —
 * aqui faz sentido, porque é um momento delimitado e especial.
 * Cada cartão conta UMA ideia. Não é um relatório.
 */

interface Cartao {
  eyebrow: string;
  titulo: string;
  detalhe?: string;
  numero?: string;
}

function construirCartoes(r: Resumo): Cartao[] {
  const c: Cartao[] = [];
  const res = r.resumo ?? {};

  c.push({
    eyebrow: r.label,
    titulo: "Este foi o teu mês",
    detalhe: `${res.jornadas ?? 0} ${(res.jornadas ?? 0) === 1 ? "jornada" : "jornadas"} · ${r.previsoes} previsões`,
  });

  c.push({
    eyebrow: "Pontos",
    titulo: `${r.pontos}`,
    numero: `${r.pontos}`,
    detalhe: r.posicao ? `Terminaste em ${r.posicao}.º lugar do mês.` : undefined,
  });

  if (r.acerto !== null) {
    c.push({
      eyebrow: "Taxa de acerto",
      titulo: `${r.acerto}%`,
      numero: `${r.acerto}%`,
      detalhe: (res.exatos ?? 0) > 0
        ? `E ${res.exatos} ${res.exatos === 1 ? "resultado exato" : "resultados exatos"}.`
        : undefined,
    });
  }

  if (res.rival?.desfecho) {
    const d = res.rival.desfecho;
    c.push({
      eyebrow: "O duelo",
      titulo: d === "vitoria" ? "Ganhaste o teu duelo"
            : d === "derrota" ? "O teu rival levou a melhor"
            : "Ficaram empatados",
      detalhe: `${res.rival.meus} – ${res.rival.dele}`,
    });
  }

  if (res.missao) {
    const nome = MISSOES[res.missao.codigo]?.titulo ?? "O teu desafio";
    c.push({
      eyebrow: "A tua missão",
      titulo: res.missao.concluida ? "Missão cumprida" : "Ficaste perto",
      detalhe: res.missao.concluida
        ? nome
        : `${nome} — chegaste a ${res.missao.progresso} de ${res.missao.alvo}. No próximo mês tens um novo desafio.`,
    });
  }

  c.push({
    eyebrow: "Próximo mês",
    titulo: "Novo desafio à tua espera",
    detalhe: "O teu rival e a tua missão são atribuídos no início do mês.",
  });

  return c;
}

export function ResumoMensalCartoes({ resumo, comp, aoFechar }: {
  resumo: Resumo;
  comp: Competition | null;
  aoFechar: () => void;
}) {
  const cartoes = construirCartoes(resumo);
  const [i, setI] = useState(0);
  const cor = comp?.accent ?? "var(--gold)";
  const eletrico = comp?.electric ?? "var(--gold)";
  const cartao = cartoes[i];
  const ultimo = i === cartoes.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: `linear-gradient(160deg, ${cor} 0%, ${comp?.deep ?? "#12151d"} 55%, #080B12 100%)`,
      }}>

      {/* Progresso, ao estilo das histórias */}
      <div className="flex gap-1.5 px-4 pt-4">
        {cartoes.map((_, k) => (
          <span key={k} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
            <span className="block h-full rounded-full transition-all duration-300"
              style={{ width: k <= i ? "100%" : "0%", background: "#fff" }} />
          </span>
        ))}
      </div>

      <div className="flex justify-end px-4 pt-3">
        <button onClick={aoFechar} className="text-white/60 transition-smooth hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Um cartão, uma ideia */}
      <button onClick={() => ultimo ? aoFechar() : setI(i + 1)}
        className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em]"
          style={{ color: eletrico }}>
          {cartao.eyebrow}
        </p>
        <p className={`font-display leading-[0.95] text-white ${
          cartao.numero ? "text-7xl md:text-8xl" : "text-4xl md:text-5xl"
        }`}>
          {cartao.titulo}
        </p>
        {cartao.detalhe && (
          <p className="mt-4 max-w-sm text-base leading-relaxed text-white/70">
            {cartao.detalhe}
          </p>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 pb-10 text-xs text-white/45">
        {ultimo ? "Toca para fechar" : <>Toca para continuar <ChevronRight className="h-3.5 w-3.5" /></>}
      </div>
    </div>
  );
}

/** Versão compacta, para consultar depois. */
export function ResumoCompacto({ resumo }: { resumo: Resumo }) {
  const res = resumo.resumo ?? {};
  return (
    <div className="rounded-2xl border border-border bg-card/70 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-lg">{resumo.label}</p>
        {resumo.posicao && (
          <span className="text-xs text-muted-foreground">{resumo.posicao}.º do mês</span>
        )}
      </div>
      <div className="mt-2.5 grid grid-cols-3 gap-2">
        {[
          ["Pontos", resumo.pontos],
          ["Previsões", resumo.previsoes],
          ["Acerto", resumo.acerto !== null ? `${resumo.acerto}%` : "—"],
        ].map(([r, v]) => (
          <div key={r as string} className="rounded-xl bg-background/40 px-3 py-2">
            <p className="font-display text-xl leading-none text-gold">{v}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{r}</p>
          </div>
        ))}
      </div>
      {res.rival?.desfecho && (
        <p className="mt-2.5 text-xs text-muted-foreground">
          Duelo: {res.rival.desfecho === "vitoria" ? "ganho" : res.rival.desfecho === "derrota" ? "perdido" : "empatado"} por {res.rival.meus}–{res.rival.dele}.
        </p>
      )}
    </div>
  );
}
