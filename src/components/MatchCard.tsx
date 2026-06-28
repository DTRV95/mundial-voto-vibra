import { Link } from "@tanstack/react-router";
import { Clock, Users2, CheckCircle2, Swords } from "lucide-react";
import { formatTime, votingStatus, PHASE_LABEL } from "@/lib/format";
import { TeamBadge } from "@/lib/teamColors.tsx";

export interface MatchCardData {
  id: string;
  kickoff_at: string;
  phase: string;
  status?: string;
  voting_open: boolean;
  home: { name: string; flag: string | null; code: string | null };
  away: { name: string; flag: string | null; code: string | null };
  votes_count?: number;
  already_voted?: boolean;
}

const KNOCKOUT_PHASES = new Set(["ronda32", "oitavos", "quartos", "meias", "final"]);

export function MatchCard({ match }: { match: MatchCardData }) {
  if (!match.home || !match.away) return null;
  const status = votingStatus(match);
  const isKnockout = KNOCKOUT_PHASES.has(match.phase);

  const statusCls =
    match.status === "live"
      ? "bg-wc-red/20 text-wc-red border-wc-red/30"
      : status.tone === "primary"
        ? "bg-wc-green/15 text-wc-green border-wc-green/30"
        : status.tone === "gold"
          ? isKnockout ? "bg-gold/20 text-gold border-gold/40" : "bg-wc-red/15 text-wc-red border-wc-red/30"
          : "bg-muted text-muted-foreground border-border";

  if (isKnockout) {
    return (
      <Link
        to="/jogo/$id"
        params={{ id: match.id }}
        onClick={() => { try { sessionStorage.setItem("jogos_return", "1"); } catch {} }}
        className="group block overflow-hidden rounded-2xl bg-card border border-gold/30 transition-smooth"
        style={{
          boxShadow: "0 2px 16px oklch(0.75 0.18 85 / 0.10), 0 0 0 1px oklch(0.75 0.18 85 / 0.20)",
          transition: "transform 240ms cubic-bezier(0.16,1,0.3,1), box-shadow 240ms ease",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 40px oklch(0.75 0.18 85 / 0.22), 0 0 0 1.5px oklch(0.75 0.18 85 / 0.45)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 16px oklch(0.75 0.18 85 / 0.10), 0 0 0 1px oklch(0.75 0.18 85 / 0.20)";
        }}
      >
        {/* Gold accent stripe */}
        <div className="h-1 w-full rounded-t-2xl" style={{ background: "linear-gradient(90deg, transparent 0%, oklch(0.75 0.18 85) 50%, transparent 100%)" }} />

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-3 pb-0">
          <div className="flex items-center gap-1.5">
            <Swords className="h-3 w-3 text-gold" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-gold">
              {PHASE_LABEL[match.phase] ?? match.phase}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {match.status === "live" && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-wc-red opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-wc-red" />
              </span>
            )}
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              match.status === "live" ? "bg-wc-red/10 text-wc-red border-wc-red/30" : statusCls
            }`}>
              {match.status === "live" ? "Ao Vivo" : status.label}
            </span>
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between gap-2 px-4 py-4">
          <div className="flex flex-1 flex-col items-center gap-2">
            <TeamBadge code={match.home.code} flag={match.home.flag} name={match.home.name} size="md" />
            <span className="text-center text-xs font-bold leading-tight text-foreground md:text-sm">
              {match.home.name}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1 px-2">
            <div className="flex items-center gap-1 text-gold">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-display text-2xl tabular-nums md:text-3xl">
                {formatTime(match.kickoff_at)}
              </span>
            </div>
            <span className="rounded-full bg-gold/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gold">
              vs
            </span>
          </div>

          <div className="flex flex-1 flex-col items-center gap-2">
            <TeamBadge code={match.away.code} flag={match.away.flag} name={match.away.name} size="md" />
            <span className="text-center text-xs font-bold leading-tight text-foreground md:text-sm">
              {match.away.name}
            </span>
          </div>
        </div>

        {/* Bottom bar */}
        <div className={`flex items-center justify-between border-t px-4 py-2.5 ${
          match.already_voted
            ? "border-gold/20 bg-gold/5"
            : "border-border bg-muted/40"
        }`}>
          <div className="flex items-center gap-1.5">
            {match.already_voted ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-gold" />
                <span className="text-xs font-bold text-gold">Previsão feita</span>
              </>
            ) : (
              <>
                <Users2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  <span className="font-bold tabular-nums text-foreground">{(match.votes_count ?? 0).toLocaleString("pt-PT")}</span>
                  {" "}previsões
                </span>
                {(match.votes_count ?? 0) > 0 && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
                  </span>
                )}
              </>
            )}
          </div>
          <span className={`text-xs font-bold transition-smooth group-hover:underline ${
            match.already_voted ? "text-gold" : "text-gold"
          }`}>
            {match.already_voted ? "Ver Comunidade →" : "Dar Previsão →"}
          </span>
        </div>
      </Link>
    );
  }

  // ── Fase de Grupos — mesmo estilo dourado ──────────────────────
  return (
    <Link
      to="/jogo/$id"
      params={{ id: match.id }}
      onClick={() => { try { sessionStorage.setItem("jogos_return", "1"); } catch {} }}
      className="group block overflow-hidden rounded-2xl bg-card border border-gold/30 transition-smooth"
      style={{
        boxShadow: "0 2px 16px rgba(200,150,12,0.10), 0 0 0 1px rgba(200,150,12,0.20)",
        transition: "transform 240ms cubic-bezier(0.16,1,0.3,1), box-shadow 240ms ease",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 40px rgba(200,150,12,0.22), 0 0 0 1.5px rgba(200,150,12,0.45)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 16px rgba(200,150,12,0.10), 0 0 0 1px rgba(200,150,12,0.20)";
      }}
    >
      {/* Gold accent stripe */}
      <div className="h-1 w-full rounded-t-2xl" style={{ background: "linear-gradient(90deg, transparent 0%, #c8960c 50%, transparent 100%)" }} />

      <div className="flex items-center justify-between px-4 pt-3 pb-0">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gold/80">
          {PHASE_LABEL[match.phase] ?? match.phase}
        </span>
        <div className="flex items-center gap-2">
          {match.status === "live" && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-wc-red opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-wc-red" />
            </span>
          )}
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            match.status === "live" ? "bg-wc-red/20 text-wc-red border-wc-red/30" : statusCls
          }`}>
            {match.status === "live" ? "Ao Vivo" : status.label}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 px-4 py-4">
        <div className="flex flex-1 flex-col items-center gap-2">
          <TeamBadge code={match.home.code} flag={match.home.flag} name={match.home.name} size="md" />
          <span className="text-center text-xs font-bold leading-tight text-foreground md:text-sm">
            {match.home.name}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1 px-2">
          <div className="flex items-center gap-1 text-gold">
            <Clock className="h-3.5 w-3.5" />
            <span className="font-display text-2xl tabular-nums md:text-3xl">
              {formatTime(match.kickoff_at)}
            </span>
          </div>
          <span className="rounded-full bg-gold/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gold">
            vs
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center gap-2">
          <TeamBadge code={match.away.code} flag={match.away.flag} name={match.away.name} size="md" />
          <span className="text-center text-xs font-bold leading-tight text-foreground md:text-sm">
            {match.away.name}
          </span>
        </div>
      </div>

      <div className={`flex items-center justify-between border-t px-4 py-2.5 ${
        match.already_voted
          ? "border-wc-green/20 bg-wc-green/5"
          : "border-gold/10 bg-muted/30"
      }`}>
        <div className="flex items-center gap-1.5">
          {match.already_voted ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-wc-green" />
              <span className="text-xs font-bold text-wc-green">Previsão feita</span>
            </>
          ) : (
            <>
              <Users2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                <span className="font-bold tabular-nums text-foreground">{(match.votes_count ?? 0).toLocaleString("pt-PT")}</span>
                {" "}previsões
              </span>
              {(match.votes_count ?? 0) > 0 && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
                </span>
              )}
            </>
          )}
        </div>
        <span className={`text-xs font-bold transition-smooth group-hover:underline ${match.already_voted ? "text-wc-green" : "text-gold"}`}>
          {match.already_voted ? "Ver Comunidade →" : "Dar Previsão →"}
        </span>
      </div>
    </Link>
  );
}
