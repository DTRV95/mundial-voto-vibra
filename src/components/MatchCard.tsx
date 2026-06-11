import { Link } from "@tanstack/react-router";
import { Clock, Users2, CheckCircle2 } from "lucide-react";
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

export function MatchCard({ match }: { match: MatchCardData }) {
  const status = votingStatus(match);

  const statusCls =
    match.status === "live"
      ? "bg-wc-red/20 text-wc-red border-wc-red/30"
      : status.tone === "primary"
        ? "bg-wc-green/15 text-wc-green border-wc-green/30"
        : status.tone === "gold"
          ? "bg-wc-red/15 text-wc-red border-wc-red/30"
          : "bg-muted text-muted-foreground border-border";

  return (
    <Link
      to="/jogo/$id"
      params={{ id: match.id }}
      className="group block overflow-hidden rounded-2xl bg-card transition-smooth"
      style={{
        boxShadow: "0 2px 12px oklch(0 0 0 / 0.30), 0 0 0 1px oklch(1 0 0 / 0.06)",
        transition: "transform 240ms cubic-bezier(0.16,1,0.3,1), box-shadow 240ms ease",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 40px oklch(0.54 0.24 27 / 0.25), 0 0 0 1.5px oklch(0.54 0.24 27 / 0.40)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px oklch(0 0 0 / 0.30), 0 0 0 1px oklch(1 0 0 / 0.06)";
      }}
    >
      {/* Stripe tricolor Panini no topo */}
      <div className="card-stripe" />

      {/* Top bar: fase + status */}
      <div className="flex items-center justify-between px-4 pt-3 pb-0">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
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

      {/* Teams */}
      <div className="flex items-center justify-between gap-2 px-4 py-4">
        <div className="flex flex-1 flex-col items-center gap-2">
          <TeamBadge code={match.home.code} flag={match.home.flag} name={match.home.name} size="md" />
          <span className="text-center text-xs font-bold leading-tight text-foreground md:text-sm">
            {match.home.name}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1 px-2">
          <div className="flex items-center gap-1 text-wc-red">
            <Clock className="h-3.5 w-3.5" />
            <span className="font-display text-2xl tabular-nums md:text-3xl">
              {formatTime(match.kickoff_at)}
            </span>
          </div>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
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
          ? "border-wc-green/20 bg-wc-green/5"
          : "border-border bg-muted/50"
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
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-wc-green opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-wc-green" />
                </span>
              )}
            </>
          )}
        </div>
        <span className={`text-xs font-bold transition-smooth group-hover:underline ${
          match.already_voted ? "text-wc-green" : "text-wc-red"
        }`}>
          {match.already_voted ? "Ver Comunidade →" : "Dar Previsão →"}
        </span>
      </div>
    </Link>
  );
}
