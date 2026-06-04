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

  const statusCls =
    match.status === "live"
      ? "bg-red-100 text-red-600 border-red-200"
      : status.tone === "primary"
        ? "bg-green-50 text-green-700 border-green-200"
        : status.tone === "gold"
          ? "bg-red-50 text-wc-red border-red-200"
          : "bg-gray-100 text-gray-500 border-gray-200";

  return (
    <Link
      to="/jogo/$id"
      params={{ id: match.id }}
      className="group block overflow-hidden rounded-2xl bg-white transition-smooth"
      style={{
        boxShadow: "0 2px 8px oklch(0 0 0 / 0.08), 0 0 0 1px oklch(0 0 0 / 0.06)",
        transition: "transform 240ms cubic-bezier(0.16,1,0.3,1), box-shadow 240ms ease",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px oklch(0.54 0.24 27 / 0.18), 0 0 0 1.5px oklch(0.54 0.24 27 / 0.30)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px oklch(0 0 0 / 0.08), 0 0 0 1px oklch(0 0 0 / 0.06)";
      }}
    >
      {/* Stripe tricolor Panini no topo */}
      <div className="card-stripe" />

      {/* Top bar: fase + status */}
      <div className="flex items-center justify-between px-4 pt-3 pb-0">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
          {PHASE_LABEL[match.phase] ?? match.phase}
        </span>
        <div className="flex items-center gap-2">
          {match.status === "live" && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
          )}
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            match.status === "live" ? "bg-red-100 text-red-600 border-red-200" : statusCls
          }`}>
            {match.status === "live" ? "Ao Vivo" : status.label}
          </span>
        </div>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-2 px-4 py-4">
        <div className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-3xl shadow-sm md:h-16 md:w-16 md:text-4xl border border-gray-100">
            {match.home.flag ?? "⚽"}
          </div>
          <span className="text-center text-xs font-bold leading-tight text-gray-800 md:text-sm">
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
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-500">
            vs
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-3xl shadow-sm md:h-16 md:w-16 md:text-4xl border border-gray-100">
            {match.away.flag ?? "⚽"}
          </div>
          <span className="text-center text-xs font-bold leading-tight text-gray-800 md:text-sm">
            {match.away.name}
          </span>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Users2 className="h-3.5 w-3.5" />
          <span>{match.votes_count ?? 0} previsões</span>
        </div>
        <span className="text-xs font-bold text-wc-red transition-smooth group-hover:underline">
          {match.already_voted ? "Ver Comunidade →" : "Dar Previsão →"}
        </span>
      </div>
    </Link>
  );
}
