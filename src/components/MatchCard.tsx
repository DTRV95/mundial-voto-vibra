import { Link } from "@tanstack/react-router";
import { Clock, Users2 } from "lucide-react";
import { formatTime, votingStatus, PHASE_LABEL } from "@/lib/format";

export interface MatchCardData {
  id: string;
  kickoff_at: string;
  phase: string;
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
      className="group block rounded-2xl border border-border bg-card/70 p-4 pitch-lines backdrop-blur-sm transition-smooth hover:border-gold/40 hover:shadow-gold"
    >
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-wider text-muted-foreground">
          {PHASE_LABEL[match.phase] ?? match.phase}
        </span>
        <span className={`rounded-full border px-2.5 py-0.5 font-semibold uppercase tracking-wider ${toneClass}`}>
          {status.label}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <TeamSide flag={match.home.flag} name={match.home.name} />
        <div className="flex flex-col items-center px-2">
          <div className="flex items-center gap-1 text-gold">
            <Clock className="h-3.5 w-3.5" />
            <span className="font-display text-xl tabular-nums">{formatTime(match.kickoff_at)}</span>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">vs</span>
        </div>
        <TeamSide flag={match.away.flag} name={match.away.name} align="right" />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users2 className="h-3.5 w-3.5" />
          <span>{match.votes_count ?? 0} previsões</span>
        </div>
        <span className="text-xs font-semibold text-gold group-hover:underline">
          {match.already_voted ? "Ver Comunidade →" : "Dar Previsão →"}
        </span>
      </div>
    </Link>
  );
}

function TeamSide({ flag, name, align = "left" }: { flag: string | null; name: string; align?: "left" | "right" }) {
  return (
    <div className={`flex flex-1 items-center gap-2 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-xl">
        {flag ?? "⚽"}
      </div>
      <span className="line-clamp-1 text-sm font-semibold">{name}</span>
    </div>
  );
}
