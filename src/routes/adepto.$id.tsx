import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { ArrowLeft, Trophy, Target, Percent, Users, Shield } from "lucide-react";
import { UserAvatar } from "@/components/AvatarPicker";
import { PHASE_LABEL, formatDate } from "@/lib/format";
import { TeamBadge } from "@/lib/teamColors.tsx";

export const Route = createFileRoute("/adepto/$id")({
  component: PublicProfile,
});

function PublicProfile() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const isMe = user?.id === id;

  const { data: profile, isLoading } = useQuery({
    queryKey: ["public-profile", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,display_name,avatar_url,total_points,predictions_made,predictions_correct")
        .eq("id", id)
        .maybeSingle();
      return data;
    },
  });

  const { data: recentPredictions = [] } = useQuery({
    queryKey: ["public-predictions", id],
    enabled: !!profile,
    queryFn: async () => {
      const { data } = await supabase
        .from("predictions")
        .select("id,result_90,btts,total_25,total_35,exact_home,exact_away,points,created_at,match:match_id(kickoff_at,phase,status,home_score,away_score,home:home_team_id(name,flag,code),away:away_team_id(name,flag,code))")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  const { data: globalRank } = useQuery({
    queryKey: ["public-global-rank", id],
    enabled: !!profile,
    queryFn: async () => {
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gt("total_points", profile!.total_points ?? 0);
      return (count ?? 0) + 1;
    },
  });

  const { data: leagues = [] } = useQuery({
    queryKey: ["public-leagues", id],
    enabled: !!profile,
    queryFn: async () => {
      const { data } = await supabase
        .from("pool_members")
        .select("pool:pool_id(name,code)")
        .eq("user_id", id);
      return (data ?? []).map((m: any) => m.pool).filter(Boolean);
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-wc-red border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-5 text-center gap-2">
        <span className="text-5xl mb-2">👤</span>
        <h2 className="font-display text-2xl">Perfil não encontrado</h2>
        <Link to="/rankings" className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-wc-red px-5 py-2.5 text-sm font-bold text-white hover:bg-wc-red/80 transition-smooth">
          <ArrowLeft className="h-3.5 w-3.5" /> Rankings
        </Link>
      </div>
    );
  }

  const acc = profile.predictions_made > 0
    ? Math.round((profile.predictions_correct / profile.predictions_made) * 100)
    : 0;

  const RESULT_LABEL: Record<string, string> = { home: "Casa", draw: "Empate", away: "Fora" };
  const BTTS_LABEL: Record<string, string> = { yes: "BTTS Sim", no: "BTTS Não" };
  const GOALS_LABEL: Record<string, string> = { over: "Mais", under: "Menos" };

  return (
    <div className="pb-16">
      {/* Hero */}
      <div className="px-5 pt-5 md:px-8">
        <div
          className="relative overflow-hidden rounded-3xl panini-stripes"
          style={{
            background: "linear-gradient(145deg, oklch(0.54 0.24 27) 0%, oklch(0.40 0.20 15) 55%, oklch(0.28 0.14 270) 100%)",
            boxShadow: "0 12px 40px oklch(0.54 0.24 27 / 0.35)",
          }}
        >
          <div className="absolute bottom-0 left-0 right-0 h-1 wc-tricolor" />
          <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end pr-6 opacity-10 pointer-events-none">
            <Trophy className="h-48 w-48 text-white" />
          </div>

          <div className="relative px-5 pt-5 pb-6 md:px-8">
            <Link to="/rankings" className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white/90 transition-smooth">
              <ArrowLeft className="h-3.5 w-3.5" /> Rankings
            </Link>

            <div className="flex items-center gap-4">
              <UserAvatar avatarUrl={(profile as any).avatar_url} name={profile.display_name} size={16} className="rounded-full ring-2 ring-white/20" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-1">
                  {isMe ? "O teu perfil" : "Perfil de adepto"}
                </p>
                <h1 className="font-display text-3xl leading-none text-white">{profile.display_name}</h1>
                {isMe && (
                  <Link to="/perfil" className="mt-1.5 inline-flex items-center gap-1 text-xs text-white/60 hover:text-white/90 transition-smooth">
                    Editar perfil →
                  </Link>
                )}
              </div>
            </div>

            {/* Rank global destaque */}
            {globalRank && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold/20 border border-gold/30 px-3 py-1.5">
                <Trophy className="h-3.5 w-3.5 text-gold" />
                <span className="text-xs font-bold text-gold">#{globalRank}º no ranking global</span>
              </div>
            )}

            {/* Stats */}
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/10 px-3 py-2.5 text-center">
                <p className="font-display text-2xl text-white">{profile.total_points ?? 0}</p>
                <p className="text-[10px] text-white/60 uppercase tracking-wider">Pontos</p>
              </div>
              <div className="rounded-xl bg-white/10 px-3 py-2.5 text-center">
                <p className="font-display text-2xl text-white">{profile.predictions_made ?? 0}</p>
                <p className="text-[10px] text-white/60 uppercase tracking-wider">Previsões</p>
              </div>
              <div className="rounded-xl bg-white/10 px-3 py-2.5 text-center">
                <p className="font-display text-2xl text-white">{acc}%</p>
                <p className="text-[10px] text-white/60 uppercase tracking-wider">Acerto</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ligas */}
      {leagues.length > 0 && (
        <div className="mx-5 mt-8 md:mx-8">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-xl">Torneios</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {leagues.map((l: any) => (
              <span
                key={l.code}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs font-semibold"
              >
                <Users className="h-3 w-3 text-muted-foreground" />
                {l.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Previsões */}
      {recentPredictions.length > 0 && (
        <div className="mx-5 mt-8 md:mx-8">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-xl">Previsões</h2>
          </div>
          <div className="space-y-2">
            {recentPredictions.map((p: any) => {
              const match = p.match;
              const finished = match?.status === "finished";
              const scored = finished && p.points > 0;
              return (
                <div key={p.id} className={`overflow-hidden rounded-2xl border ${scored ? "border-wc-green/30 bg-wc-green/5" : "border-border bg-card/70"}`}>
                  {/* Cabeçalho do jogo */}
                  <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <TeamBadge code={match.home?.code} flag={match.home?.flag} name={match.home?.name} size="sm" />
                      <span className="text-xs font-semibold truncate">{match.home?.name}</span>
                      {finished && (
                        <span className="text-xs font-bold text-foreground shrink-0">{match.home_score}–{match.away_score}</span>
                      )}
                      <span className="text-[10px] text-muted-foreground shrink-0">{finished ? "" : "vs"}</span>
                      <span className="text-xs font-semibold truncate">{match.away?.name}</span>
                      <TeamBadge code={match.away?.code} flag={match.away?.flag} name={match.away?.name} size="sm" />
                    </div>
                    {finished && (
                      <span className={`shrink-0 text-sm font-bold ${scored ? "text-wc-green" : "text-muted-foreground/50"}`}>
                        {scored ? `+${p.points}` : "0 pts"}
                      </span>
                    )}
                    {!finished && (
                      <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">pendente</span>
                    )}
                  </div>
                  {/* Mercados apostados */}
                  <div className="flex flex-wrap gap-1.5 px-4 py-2.5">
                    {p.result_90 && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold">
                        {RESULT_LABEL[p.result_90] ?? p.result_90}
                      </span>
                    )}
                    {p.btts && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold">
                        {BTTS_LABEL[p.btts] ?? p.btts}
                      </span>
                    )}
                    {p.total_25 && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold">
                        2.5 {GOALS_LABEL[p.total_25] ?? p.total_25}
                      </span>
                    )}
                    {p.total_35 && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold">
                        3.5 {GOALS_LABEL[p.total_35] ?? p.total_35}
                      </span>
                    )}
                    {p.exact_home != null && p.exact_away != null && (
                      <span className="rounded-full bg-wc-blue/20 px-2 py-0.5 text-[10px] font-bold text-wc-blue">
                        {p.exact_home}–{p.exact_away}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
