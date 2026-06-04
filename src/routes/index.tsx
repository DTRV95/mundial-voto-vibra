import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Trophy, BarChart3, Users2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MatchCard, type MatchCardData } from "@/components/MatchCard";
import trophyImg from "@/assets/trophy-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Uma Geração — Vota, compara e vibra com a comunidade" },
      { name: "description", content: "Faz a tua previsão para cada jogo do Mundial, compara com a comunidade e compete nos rankings por fase." },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: todays = [] } = useQuery({
    queryKey: ["matches", "today"],
    queryFn: async (): Promise<MatchCardData[]> => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(); end.setHours(23, 59, 59, 999);
      const { data } = await supabase
        .from("matches")
        .select("id,kickoff_at,phase,voting_open,home:home_team_id(name,flag,code),away:away_team_id(name,flag,code)")
        .gte("kickoff_at", start.toISOString())
        .lte("kickoff_at", end.toISOString())
        .order("kickoff_at")
        .limit(4);
      return (data as any) ?? [];
    },
  });

  const { data: topLeaders = [] } = useQuery({
    queryKey: ["leaders", "home"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name,total_points,predictions_made")
        .order("total_points", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  return (
    <div className="pb-10">

      {/* ===================== HERO ===================== */}

      {/* MOBILE hero — card flutuante com margem da top bar */}
      <section className="relative md:hidden px-4 pt-4">
        <div className="relative overflow-hidden rounded-3xl" style={{ boxShadow: "0 20px 60px -10px oklch(0 0 0 / 0.5)" }}>
          {/* Trophy image — menor, mais centrada */}
          <div className="relative h-[50vw] min-h-[200px] max-h-[300px] w-full overflow-hidden">
            <img
              src={trophyImg}
              alt="Troféu do Mundial"
              className="h-full w-full object-cover object-center scale-105"
            />
            {/* Gradiente cinematográfico multicamada */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.30_0.10_155/0.3)] via-transparent to-[oklch(0.82_0.15_88/0.08)]" />

            {/* Badge */}
            <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-gold backdrop-blur">
              <Sparkles className="h-3 w-3" /> Mundial 2026
            </span>
          </div>

          {/* Texto sobre gradiente — funde com a imagem */}
          <div className="relative bg-gradient-to-b from-background/0 via-background to-background px-5 pb-6 -mt-8 pt-2 space-y-4">
            <div>
              <h1 className="font-display text-5xl leading-none">
                UMA <span className="text-gold">GERAÇÃO</span>
              </h1>
              <p className="mt-2 text-sm font-medium text-foreground/70">
                Vota, compara e vibra com a comunidade.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/jogos"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gold py-3 text-sm font-bold text-background shadow-gold transition-smooth active:scale-95"
              >
                Ver Jogos de Hoje <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center justify-center rounded-2xl border border-border bg-card/60 px-4 py-3 text-sm font-semibold backdrop-blur transition-smooth"
              >
                Como?
              </a>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[{ label: "Jogos", value: "48" }, { label: "Mercados", value: "8" }, { label: "Fases", value: "4" }].map((s) => (
                <div key={s.label} className="rounded-xl border border-border/60 bg-card/40 py-2.5 text-center">
                  <div className="font-display text-xl text-gold">{s.value}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* DESKTOP hero — card flutuante com margem da topbar */}
      <section className="relative hidden md:block px-6 pt-5">
        <div className="relative overflow-hidden rounded-3xl bg-hero" style={{ boxShadow: "0 24px 80px -12px oklch(0 0 0 / 0.5)" }}>
          <div className="pointer-events-none absolute inset-0 pitch-lines opacity-30" />
          {/* Gradiente lateral colorido */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[oklch(0.30_0.10_155/0.4)] via-transparent to-transparent" />
          <div className="pointer-events-none absolute top-0 right-0 h-full w-1/2 bg-gradient-to-l from-[oklch(0.82_0.15_88/0.05)] to-transparent" />
        <div className="relative grid grid-cols-2 items-center gap-8 px-10 py-14">
          {/* Left: text */}
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-gold">
              <Sparkles className="h-3.5 w-3.5" /> Comunidade do Mundial 2026
            </span>
            <h1 className="font-display text-7xl leading-none text-balance">
              UMA <br /><span className="text-gold">GERAÇÃO</span>
            </h1>
            <p className="text-xl font-medium text-foreground/90 max-w-md">
              Vota, compara e vibra com a comunidade.
            </p>
            <p className="text-sm text-muted-foreground max-w-sm">
              A plataforma de previsões do Mundial onde os adeptos competem por fase e ganham prémios.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <Link
                to="/jogos"
                className="inline-flex items-center gap-2 rounded-2xl bg-gold px-7 py-3.5 text-sm font-bold text-background shadow-gold transition-smooth hover:scale-[1.02]"
              >
                Ver Jogos de Hoje <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#como-funciona"
                className="rounded-2xl border border-border bg-card/60 px-6 py-3.5 text-sm font-semibold backdrop-blur transition-smooth hover:border-gold/40"
              >
                Como funciona
              </a>
            </div>
            <div className="flex gap-6 pt-2">
              {[{ label: "Jogos na fase de grupos", value: "48" }, { label: "Mercados por jogo", value: "8" }, { label: "Fases com prémios", value: "4" }].map((s) => (
                <div key={s.label}>
                  <div className="font-display text-3xl text-gold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: trophy */}
          <div className="relative flex justify-center">
            <div className="absolute inset-0 rounded-3xl bg-gold/20 blur-3xl" />
            <img
              src={trophyImg}
              alt="Troféu do Mundial"
              className="relative h-[420px] w-full max-w-md rounded-3xl object-cover shadow-elegant"
            />
          </div>
        </div>
        </div>
      </section>

      {/* ===================== JOGOS DE HOJE ===================== */}
      <section className="px-5 pt-8 md:px-8 relative">
        {/* Gradiente de fundo subtil */}
        <div className="pointer-events-none absolute -top-12 left-0 right-0 h-32 bg-gradient-to-b from-transparent via-[oklch(0.30_0.10_155/0.06)] to-transparent" />
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl md:text-3xl">Jogos de Hoje</h2>
            <p className="text-xs text-muted-foreground">Dá a tua previsão antes do apito inicial.</p>
          </div>
          <Link to="/jogos" className="text-xs font-semibold text-gold">Ver todos →</Link>
        </div>
        {todays.length === 0 ? (
          <EmptyState
            title="Sem jogos para hoje"
            subtitle="Volta amanhã ou explora as próximas fases."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-2">
            {todays.map((m) => <MatchCard key={m.id} match={m} />)}
          </div>
        )}
      </section>

      {/* ===================== RANKING + PRÉMIOS ===================== */}
      <section className="relative grid gap-4 px-5 pt-10 sm:grid-cols-2 md:px-8">
        <div className="pointer-events-none absolute -top-6 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-[oklch(0.30_0.10_155/0.04)]" />
        {/* Ranking — destaque maior */}
        <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/10 via-card/80 to-card/60 p-5 backdrop-blur-sm" style={{ boxShadow: "0 4px 24px -4px oklch(0.82_0.15_88/0.08)" }}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gold/20">
                <BarChart3 className="h-5 w-5 text-gold" />
              </div>
              <h3 className="font-display text-xl">Líderes</h3>
            </div>
            <Link to="/rankings" className="text-xs font-semibold text-gold">Ver rankings →</Link>
          </div>
          {topLeaders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ainda sem dados — sê o primeiro a marcar pontos.</p>
          ) : (
            <ol className="space-y-3">
              {topLeaders.map((u, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span className="flex items-center gap-3">
                    <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                      i === 0 ? "bg-gold text-background" : i === 1 ? "bg-gold/40 text-foreground" : "bg-secondary"
                    }`}>{i + 1}</span>
                    <span className="font-medium text-sm">{u.display_name ?? "Adepto"}</span>
                  </span>
                  <span className="font-display text-lg text-gold">{u.total_points} <span className="text-xs font-sans text-muted-foreground">pts</span></span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Prémios */}
        <div className="rounded-2xl border border-border bg-card/70 p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary">
                <Trophy className="h-5 w-5 text-gold" />
              </div>
              <h3 className="font-display text-xl">Prémios</h3>
            </div>
            <Link to="/premios" className="text-xs font-semibold text-gold">Ver prémios →</Link>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Um prémio exclusivo para o vencedor de cada fase — Grupos, Oitavos, Quartos e Meias-Finais.
          </p>
          <div className="mt-4 grid grid-cols-4 gap-1.5">
            {["Grupos", "Oitavos", "Quartos", "Meias"].map((f) => (
              <div key={f} className="rounded-lg border border-border bg-secondary/50 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {f}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== COMO FUNCIONA ===================== */}
      <section id="como-funciona" className="px-5 pt-12 md:px-8">
        <h2 className="mb-5 font-display text-2xl md:text-3xl">Como funciona</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Step n="1" title="Vê os jogos">Consulta os jogos do dia e escolhe os que te interessam.</Step>
          <Step n="2" title="Deixa a tua previsão">Vota nos mercados que quiseres até 5 minutos antes do jogo.</Step>
          <Step n="3" title="Compete">Soma pontos pelo teu palpite e sobe no ranking da fase.</Step>
        </div>
        <div className="mt-4 rounded-2xl border border-gold/30 bg-gold/5 p-5 text-sm">
          <div className="mb-1 flex items-center gap-2 font-semibold text-gold">
            <Users2 className="h-4 w-4" /> Opinião da Comunidade
          </div>
          <p className="text-muted-foreground">
            Depois de votares, desbloqueias as percentagens e a tendência da comunidade para cada mercado.
            Todas as previsões são consideradas no tempo regulamentar (90 minutos).
          </p>
        </div>
      </section>
    </div>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5">
      <div className="mb-2 grid h-8 w-8 place-items-center rounded-full bg-gold font-display text-background">{n}</div>
      <h3 className="font-display text-lg">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
      <p className="font-display text-lg">{title}</p>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
