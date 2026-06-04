import { Link } from "@tanstack/react-router";
import { Clock, Users2 } from "lucide-react";
import { formatTime, votingStatus, PHASE_LABEL } from "@/lib/format";

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
  const toneClass =
    status.tone === "primary"
      ? "bg-primary/15 text-primary border-primary/30"
      : status.tone === "gold"
        ? "bg-gold/15 text-gold border-gold/30"
        : "bg-destructive/15 text-destructive border-destructive/30";

  return (
    <Link
      to="/jogo/$id"
      params={{ id: match.id }}
      className="group block rounded-2xl border border-border bg-card/70 pitch-lines backdrop-blur-sm transition-smooth hover:border-gold/50 hover:shadow-gold overflow-hidden"
    >
      {/* Top bar: fase + status */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-0">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {PHASE_LABEL[match.phase] ?? match.phase}
        </span>
        <div className="flex items-center gap-2">
          {match.status === "live" && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
          )}
          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
            match.status === "live"
              ? "border-red-500/40 bg-red-500/15 text-red-400"
              : toneClass
          }`}>
            {match.status === "live" ? "Ao Vivo" : status.label}
          </span>
        </div>
      </div>

      {/* Teams row */}
      <div className="flex items-center justify-between gap-2 px-4 py-4">
        {/* Home team */}
        <div className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/80 text-3xl shadow-sm lg:h-16 lg:w-16 lg:text-4xl">
            {match.home.flag ?? "⚽"}
          </div>
          <span className="text-center text-xs font-bold leading-tight lg:text-sm">
            {match.home.name}
          </span>
        </div>

        {/* Centre: time + vs */}
        <div className="flex flex-col items-center gap-1 px-2">
          <div className="flex items-center gap-1 text-gold">
            <Clock className="h-3.5 w-3.5" />
            <span className="font-display text-2xl tabular-nums lg:text-3xl">
              {formatTime(match.kickoff_at)}
            </span>
          </div>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            vs
          </span>
        </div>

        {/* Away team */}
        <div className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/80 text-3xl shadow-sm lg:h-16 lg:w-16 lg:text-4xl">
            {match.away.flag ?? "⚽"}
          </div>
          <span className="text-center text-xs font-bold leading-tight lg:text-sm">
            {match.away.name}
          </span>
        </div>
      </div>

      {/* Bottom bar: votes + CTA */}
      <div className="flex items-center justify-between border-t border-border/60 bg-background/20 px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users2 className="h-3.5 w-3.5" />
          <span>{match.votes_count ?? 0} previsões</span>
        </div>
        <span className="text-xs font-bold text-gold transition-smooth group-hover:underline">
          {match.already_voted ? "Ver Comunidade →" : "Dar Previsão →"}
        </span>
      </div>
    </Link>
  );
}
