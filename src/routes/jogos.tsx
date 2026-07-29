import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { MatchCard, type MatchCardData } from "@/components/MatchCard";
import { useActiveCompetition } from "@/lib/useActiveCompetition";
import { CalendarClock, Target, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/jogos")({
  head: () => ({
    meta: [
      { title: "A tua jornada — Uma Geração" },
      { name: "description", content: "Os 5 jogos oficiais de cada jornada. Dá a tua previsão antes do apito inicial e sobe no ranking." },
      { property: "og:title", content: "A tua jornada — Uma Geração" },
      { property: "og:description", content: "Os 5 jogos oficiais de cada jornada. Dá a tua previsão e compara com a comunidade." },
      { property: "og:url", content: "https://geracao2026.com/jogos" },
    ],
    links: [{ rel: "canonical", href: "https://geracao2026.com/jogos" }],
  }),
  component: Jogos,
});

interface JogoOficial extends MatchCardData {
  round_id: string;
  round_number: number | null;
  official_position: number | null;
}

function Jogos() {
  const { user } = useAuth();
  const { competitions, active, setSlug } = useActiveCompetition();

  // Só os jogos oficiais de jornadas publicadas da competição ativa
  const { data: jogos = [], isLoading } = useQuery({
    queryKey: ["jogos-oficiais", active?.id],
    enabled: !!active?.id,
    staleTime: 60_000,
    queryFn: async (): Promise<JogoOficial[]> => {
      const { data } = await (supabase as any)
        .from("matches")
        .select(
          "id,kickoff_at,phase,status,voting_open,official_position," +
          "home:home_team_id(name,flag,code),away:away_team_id(name,flag,code)," +
          "round:round_id!inner(id,number,label,status),predictions(count)"
        )
        .eq("competition_id", active!.id)
        .eq("is_official", true)
        .eq("round.status", "publicada")
        .order("kickoff_at");

      return ((data ?? []) as any[])
        .filter((m) => m.home && m.away && m.round)
        .map((m) => ({
          id: m.id,
          kickoff_at: m.kickoff_at,
          phase: m.phase ?? "",
          status: m.status,
          voting_open: m.voting_open,
          home: m.home,
          away: m.away,
          votes_count: m.predictions?.[0]?.count ?? 0,
          is_official: true,
          round_label: m.round.label ?? (m.round.number ? `Jornada ${m.round.number}` : null),
          round_id: m.round.id,
          round_number: m.round.number ?? null,
          official_position: m.official_position ?? null,
        }));
    },
  });

  // IDs dos jogos em que o utilizador já votou
  const { data: votedIds = new Set<string>() } = useQuery({
    queryKey: ["voted-match-ids", user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("predictions")
        .select("match_id")
        .eq("user_id", user!.id);
      return new Set((data ?? []).map((p: any) => p.match_id));
    },
  });

  // Agrupa por jornada, com a mais próxima primeiro
  const jornadas = useMemo(() => {
    const map = new Map<string, { label: string; numero: number | null; jogos: JogoOficial[] }>();
    for (const j of jogos) {
      const atual = map.get(j.round_id);
      const jogo = { ...j, already_voted: votedIds.has(j.id) };
      if (atual) atual.jogos.push(jogo);
      else map.set(j.round_id, { label: j.round_label ?? "Jornada", numero: j.round_number, jogos: [jogo] });
    }
    return [...map.values()].map((r) => ({
      ...r,
      jogos: r.jogos.sort(
        (a, b) => (a.official_position ?? 99) - (b.official_position ?? 99),
      ),
      votados: r.jogos.filter((m) => votedIds.has(m.id)).length,
    }));
  }, [jogos, votedIds]);

  return (
    <div className="px-4 pt-6 pb-10 md:px-8">
      <header className="mb-5">
        <h1 className="font-display text-3xl md:text-4xl">A tua jornada</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Cada jornada tem 5 jogos oficiais — os mesmos para toda a gente.
        </p>
      </header>

      {/* Competições */}
      {competitions.length > 1 && (
        <div className="mb-4 -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <div className="flex w-max gap-2">
            {competitions.map((c) => {
              const ativa = c.id === active?.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSlug(c.slug)}
                  className="whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-smooth"
                  style={
                    ativa
                      ? { borderColor: c.accent, background: c.accent, color: "#fff" }
                      : { borderColor: "var(--border)", color: "var(--muted-foreground)" }
                  }
                >
                  {c.emoji} {c.short}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Banner prognósticos */}
      <Link
        to="/prognosticos"
        className="group mb-6 flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-border px-4 py-3 transition-smooth hover:border-wc-blue/40"
        style={{ background: "linear-gradient(135deg, oklch(0.20 0.04 250 / 0.5) 0%, oklch(0.16 0.02 260 / 0.3) 100%)" }}
      >
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10">
            <Target className="h-4 w-4 text-white/70" />
          </div>
          <div>
            <p className="mb-0.5 text-[9px] font-bold uppercase leading-none tracking-widest text-white/40">Antes de votares</p>
            <p className="text-sm font-bold leading-none text-white/90">Ver prognósticos</p>
          </div>
        </div>
        <span className="shrink-0 text-xs font-bold text-white/50 transition-smooth group-hover:text-white/80">→</span>
      </Link>

      {isLoading && (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => <div key={i} className="shimmer h-32 rounded-2xl" />)}
        </div>
      )}

      {!isLoading && jornadas.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <CalendarClock className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="font-display text-lg">Ainda não há jornada aberta</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Assim que a próxima jornada de {active?.name ?? "competição"} for publicada, os 5 jogos aparecem aqui.
          </p>
        </div>
      )}

      <div className="space-y-8">
        {jornadas.map((r) => (
          <section key={r.label}>
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-xl border border-border bg-card/60 px-3 py-1.5">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: active?.accent }}>
                  {r.label}
                </p>
                <p className="text-[11px] text-muted-foreground">{active?.short}</p>
              </div>
              <div className="h-px flex-1 bg-border" />
              {user ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold">
                  {r.votados === r.jogos.length && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-wc-green" />
                  )}
                  <span className={r.votados === r.jogos.length ? "text-wc-green" : "text-muted-foreground"}>
                    {r.votados} de {r.jogos.length} previsões
                  </span>
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">{r.jogos.length} jogos</span>
              )}
            </div>

            {/* Barra de progresso */}
            {user && (
              <div className="mb-3 h-1 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(r.votados / Math.max(r.jogos.length, 1)) * 100}%`,
                    background: active?.accent ?? "var(--gold)",
                  }}
                />
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              {r.jogos.map((m) => <MatchCard key={m.id} match={m} />)}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
