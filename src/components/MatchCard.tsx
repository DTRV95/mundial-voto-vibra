import { Link } from "@tanstack/react-router";
import { Users2, CheckCircle2, Flame } from "lucide-react";
import { formatTime } from "@/lib/format";
import { TeamBadge } from "@/lib/teamColors.tsx";
import { coresDoClube, nomeCurto } from "@/lib/clubBadge";
import { useContagem, type Urgencia } from "@/lib/useContagem";

export interface MatchCardData {
  id: string;
  kickoff_at: string;
  phase: string;
  status?: string;
  voting_open: boolean;
  home: { name: string; flag: string | null; code: string | null; monogram?: string | null; crest_url?: string | null };
  away: { name: string; flag: string | null; code: string | null; monogram?: string | null; crest_url?: string | null };
  votes_count?: number;
  already_voted?: boolean;
  /** Etiqueta a mostrar no topo (ex: "Jornada 8"). */
  round_label?: string | null;
  /** Jogo oficial — conta para o ranking */
  is_official?: boolean;
}

/** Cor e tom da contagem decrescente. O vermelho é só para o fim. */
const TOM_URGENCIA: Record<Urgencia, { cor: string; fundo: string; borda: string; pulsa: boolean }> = {
  longe:    { cor: "var(--muted-foreground)", fundo: "transparent",            borda: "var(--border)",            pulsa: false },
  hoje:     { cor: "var(--foreground)",       fundo: "oklch(0 0 0 / 0.04)",    borda: "var(--border)",            pulsa: false },
  proximo:  { cor: "var(--gold)",             fundo: "oklch(0.66 0.13 82 / 0.12)", borda: "oklch(0.66 0.13 82 / 0.35)", pulsa: false },
  iminente: { cor: "var(--wc-red)",           fundo: "oklch(0.58 0.24 27 / 0.12)", borda: "oklch(0.58 0.24 27 / 0.40)", pulsa: true },
  fechado:  { cor: "var(--muted-foreground)", fundo: "transparent",            borda: "var(--border)",            pulsa: false },
};

/**
 * O cartão de um jogo, vestido com as cores dos dois clubes.
 *
 * Antes eram todos dourados — o dérbi da jornada tinha exatamente o mesmo
 * peso que o quinto jogo. Agora o dourado está reservado ao destaque e o
 * resto veste-se de quem joga.
 */
export function MatchCard({ match, destaque = false, etiqueta }: {
  match: MatchCardData;
  /** O jogo da jornada — ocupa mais espaço e leva a moldura dourada. */
  destaque?: boolean;
  /** Texto da fita de destaque ("O clássico da jornada"). */
  etiqueta?: string;
}) {
  const contagem = useContagem(match.kickoff_at);

  if (!match.home || !match.away) return null;

  const aoVivo = match.status === "live";
  const fechado = contagem.urgencia === "fechado" || !match.voting_open;

  const casa = coresDoClube(match.home.name).primaria;
  const fora = coresDoClube(match.away.name).primaria;

  const tom = TOM_URGENCIA[aoVivo ? "iminente" : contagem.urgencia];
  const rotulo = match.round_label ?? "";

  const tamEmblema = destaque ? "xl" : "lg";

  return (
    <Link
      to="/jogo/$id"
      params={{ id: match.id }}
      onClick={() => { try { sessionStorage.setItem("jogos_return", "1"); } catch {} }}
      className={`group relative isolate block overflow-hidden rounded-3xl border bg-card cartao-eleva ${
        destaque ? "border-gold/45 edge-metal" : "border-border"
      }`}
      style={destaque ? { boxShadow: "0 8px 34px oklch(0.66 0.13 82 / 0.16)" } : undefined}
    >
      {/* As cores dos dois clubes, uma de cada lado. Fica por baixo de
          tudo e é suave o suficiente para o texto continuar legível
          nos dois temas. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            `radial-gradient(115% 130% at 0% 50%, ${casa}2E 0%, ${casa}0A 42%, transparent 66%),` +
            `radial-gradient(115% 130% at 100% 50%, ${fora}2E 0%, ${fora}0A 42%, transparent 66%)`,
        }}
      />

      {/* Fita superior: metade de cada clube, com o corte ao meio */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{
          background:
            `linear-gradient(90deg, ${casa} 0%, ${casa} 44%, transparent 48%, transparent 52%, ${fora} 56%, ${fora} 100%)`,
        }}
      />

      {destaque && etiqueta && (
        <div className="flex items-center justify-center gap-1.5 border-b border-gold/25 bg-gold/10 py-1.5">
          <Flame className="h-3 w-3 text-gold" />
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold">{etiqueta}</span>
        </div>
      )}

      {/* Cabeçalho: jornada à esquerda, quanto falta à direita */}
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <span className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {rotulo}
        </span>
        <span
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tabular-nums"
          style={{ color: tom.cor, background: tom.fundo, borderColor: tom.borda }}
        >
          {(tom.pulsa || aoVivo) && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" style={{ background: tom.cor }} />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: tom.cor }} />
            </span>
          )}
          {aoVivo ? "Ao vivo" : contagem.texto}
        </span>
      </div>

      {/* As equipas */}
      <div className={`flex items-center gap-2 px-4 ${destaque ? "py-6" : "py-4"}`}>
        <Lado nome={match.home.name} equipa={match.home} tamanho={tamEmblema} destaque={destaque} />

        <div className="flex shrink-0 flex-col items-center gap-1 px-1">
          <span className={`font-display leading-none tabular-nums text-foreground ${destaque ? "text-4xl md:text-5xl" : "text-3xl"}`}>
            {formatTime(match.kickoff_at)}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">vs</span>
        </div>

        <Lado nome={match.away.name} equipa={match.away} tamanho={tamEmblema} destaque={destaque} />
      </div>

      {/* A última hora esvazia-se à vista */}
      {contagem.urgencia === "iminente" && !aoVivo && (
        <div className="mx-4 mb-2 h-[3px] overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-wc-red transition-all duration-1000 ease-linear"
            style={{ width: `${Math.round((1 - contagem.progresso) * 100)}%` }}
          />
        </div>
      )}

      {/* Rodapé */}
      <div className={`flex items-center justify-between gap-2 border-t px-4 py-2.5 ${
        match.already_voted ? "border-wc-green/25 bg-wc-green/5" : "border-border/70 bg-muted/25"
      }`}>
        <span className="flex min-w-0 items-center gap-1.5">
          {match.already_voted ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-wc-green" />
              <span className="truncate text-xs font-bold text-wc-green">Previsão feita</span>
            </>
          ) : (
            <>
              <Users2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate text-xs text-muted-foreground">
                <span className="font-bold tabular-nums text-foreground">
                  {(match.votes_count ?? 0).toLocaleString("pt-PT")}
                </span>{" "}
                {match.votes_count === 1 ? "previsão" : "previsões"}
              </span>
            </>
          )}
        </span>
        <span className={`shrink-0 text-xs font-bold transition-smooth group-hover:translate-x-0.5 ${
          match.already_voted ? "text-wc-green" : fechado ? "text-muted-foreground" : "text-gold"
        }`}>
          {match.already_voted ? "Ver a bancada →" : fechado ? "Ver jogo →" : "Dar previsão →"}
        </span>
      </div>
    </Link>
  );
}

function Lado({ nome, equipa, tamanho, destaque }: {
  nome: string;
  equipa: MatchCardData["home"];
  tamanho: "lg" | "xl";
  destaque: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
      <TeamBadge
        code={equipa.code}
        flag={equipa.flag}
        name={nome}
        monogram={equipa.monogram}
        crest={equipa.crest_url}
        size={tamanho}
      />
      <span className={`w-full truncate text-center font-display uppercase leading-none tracking-wide text-foreground ${
        destaque ? "text-lg md:text-2xl" : "text-base md:text-lg"
      }`}>
        {nomeCurto(nome)}
      </span>
    </div>
  );
}
