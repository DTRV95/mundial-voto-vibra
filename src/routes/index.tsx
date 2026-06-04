import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Trophy, BarChart3, Users2 } from "lucide-react";
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
    <div className="pb-12">

      {/* ═══════════════════════════════════════
          HERO — Card cinematográfico flutuante
          ═══════════════════════════════════════ */}

      {/* MOBILE */}
      <div className="px-4 pt-4 md:hidden">
        <div className="relative overflow-hidden rounded-3xl shadow-elegant grain">
          {/* Imagem base */}
          <img
            src={trophyImg}
            alt="Troféu do Mundial"
            className="h-[72vw] min-h-[280px] max-h-[400px] w-full object-cover object-top"
          />
          {/* Camadas de gradiente cinematográfico */}
          <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.08_0.015_240)] via-[oklch(0.08_0.015_240/0.5)] to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.52_0.22_18/0.25)] via-transparent to-[oklch(0.82_0.16_88/0.1)]" />

          {/* Badge */}
          <div className="absolute left-4 top-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white backdrop-blur-sm">
              🏆 Mundial 2026
            </span>
          </div>

          {/* Conteúdo sobre a imagem — ancorado ao fundo */}
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-16">
            <h1 className="font-display text-6xl leading-none tracking-wide text-white">
              UMA <span className="text-gold glow-gold">GERAÇÃO</span>
            </h1>
            <p className="mt-2 text-sm font-medium text-white/80">
              Vota, compara e vibra com a comunidade.
            </p>
            <div className="mt-4 flex gap-3">
              <Link
                to="/jogos"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gold py-3 text-sm font-bold text-background shadow-gold transition-smooth active:scale-95"
              >
                Ver Jogos de Hoje <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm"
              >
                Como?
              </a>
            </div>
          </div>
        </div>

        {/* Stats strip mobile */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[{ label: "Jogos", value: "48" }, { label: "Mercados", value: "8" }, { label: "Prémios", value: "4" }].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card/60 py-3 text-center shadow-card">
              <div className="font-display text-2xl text-gold">{s.value}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:block px-6 pt-6">
        <div className="relative overflow-hidden rounded-3xl shadow-elegant grain">
          {/* Imagem de fundo */}
          <img
            src={trophyImg}
            alt="Troféu do Mundial"
            className="h-[520px] w-full object-cover object-center"
          />

          {/* Gradientes cinematográficos multicamada */}
          <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.08_0.015_240/0.97)] via-[oklch(0.08_0.015_240/0.6)] to-[oklch(0.08_0.015_240/0.2)]" />
          <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.52_0.22_18/0.20)] via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-tl from-[oklch(0.82_0.16_88/0.08)] via-transparent to-transparent" />
          {/* Linha diagonal de luz */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/[0.02] to-transparent" />

          {/* Conteúdo */}
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-xl px-12 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-px w-8 bg-gold/60" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold/80">Mundial 2026</span>
              </div>
              <h1 className="font-display text-[5.5rem] leading-[0.9] tracking-wide text-white">
                UMA<br />
                <span className="text-gold glow-gold">GERAÇÃO</span>
              </h1>
              <p className="text-lg font-medium text-white/80 max-w-sm">
                Vota, compara e vibra com a comunidade de adeptos.
              </p>
              <p className="text-sm text-white/50 max-w-xs">
                Previsões com análise ScoreLab. Compete por fase. Ganha prémios.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <Link
                  to="/jogos"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gold px-8 py-4 text-sm font-bold text-background shadow-gold transition-smooth hover:scale-[1.03] hover:shadow-[0_12px_40px_-8px_oklch(0.82_0.16_88/0.6)]"
                >
                  Ver Jogos de Hoje <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#como-funciona"
                  className="rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-smooth hover:border-white/30 hover:bg-white/15"
                >
                  Como funciona
                </a>
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-2 border-t border-white/10 pt-6">
                {[
                  { label: "Jogos fase de grupos", value: "48" },
                  { label: "Mercados por jogo", value: "8" },
                  { label: "Fases com prémios", value: "4" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="font-display text-4xl text-gold">{s.value}</div>
                    <div className="text-xs text-white/50 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          JOGOS DE HOJE
          ═══════════════════════════════════════ */}
      <section className="px-4 pt-8 md:px-6">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl md:text-3xl">Jogos de Hoje</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Dá a tua previsão antes do apito inicial.</p>
          </div>
          <Link to="/jogos" className="text-xs font-semibold text-gold hover:text-gold/80 transition-smooth">Ver todos →</Link>
        </div>
        {todays.length === 0 ? (
          <EmptyState title="Sem jogos para hoje" subtitle="Volta amanhã ou explora as próximas fases." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {todays.map((m) => <MatchCard key={m.id} match={m} />)}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════
          RANKING + PRÉMIOS
          ═══════════════════════════════════════ */}
      <section className="grid gap-4 px-4 pt-8 sm:grid-cols-2 md:px-6">
        {/* Ranking */}
        <div className="relative overflow-hidden rounded-2xl border border-gold/20 bg-card-grad p-5 shadow-card grain">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl -translate-y-8 translate-x-8 pointer-events-none" />
          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-gold/15 text-gold">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <h3 className="font-display text-xl">Líderes</h3>
              </div>
              <Link to="/rankings" className="text-xs font-semibold text-gold hover:text-gold/80 transition-smooth">Ver ranking →</Link>
            </div>
            {topLeaders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ainda sem dados — sê o primeiro a marcar pontos.</p>
            ) : (
              <ol className="space-y-3">
                {topLeaders.map((u, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span className="flex items-center gap-3">
                      <span className={`grid h-7 w-7 place-items-center rounded-xl text-xs font-bold ${
                        i === 0 ? "bg-gold text-background shadow-gold" : i === 1 ? "bg-gold/30 text-gold" : "bg-secondary"
                      }`}>{i + 1}</span>
                      <span className="font-medium text-sm">{u.display_name ?? "Adepto"}</span>
                    </span>
                    <span className="font-display text-xl text-gold">{u.total_points}<span className="text-xs text-muted-foreground font-sans ml-1">pts</span></span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* Prémios */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card-grad p-5 shadow-card grain">
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-red/5 rounded-full blur-3xl translate-y-8 -translate-x-8 pointer-events-none" />
          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-secondary text-gold">
                  <Trophy className="h-4 w-4" />
                </div>
                <h3 className="font-display text-xl">Prémios</h3>
              </div>
              <Link to="/premios" className="text-xs font-semibold text-gold hover:text-gold/80 transition-smooth">Ver prémios →</Link>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Um prémio exclusivo para o vencedor de cada fase do torneio.
            </p>
            <div className="mt-4 grid grid-cols-4 gap-1.5">
              {["Grupos", "Oitavos", "Quartos", "Meias"].map((f) => (
                <div key={f} className="rounded-xl border border-border bg-secondary/50 py-2.5 text-center">
                  <div className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">{f}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          COMO FUNCIONA
          ═══════════════════════════════════════ */}
      <section id="como-funciona" className="px-4 pt-10 md:px-6">
        <h2 className="mb-5 font-display text-2xl md:text-3xl">Como funciona</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Step n="1" title="Vê os jogos">Consulta os jogos do dia e escolhe os que te interessam.</Step>
          <Step n="2" title="Dá a tua previsão">Vota nos mercados que quiseres até 5 minutos antes do jogo.</Step>
          <Step n="3" title="Compete">Soma pontos pelo teu palpite e sobe no ranking da fase.</Step>
        </div>
        <div className="mt-4 rounded-2xl border border-gold/20 bg-gold/5 p-5 text-sm">
          <div className="mb-1 flex items-center gap-2 font-semibold text-gold">
            <Users2 className="h-4 w-4" /> Opinião da Comunidade
          </div>
          <p className="text-muted-foreground text-sm">
            Depois de votares, desbloqueias as percentagens da comunidade para cada mercado.
            Todas as previsões são consideradas no tempo regulamentar (90 minutos).
          </p>
        </div>
      </section>
    </div>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card-grad p-5 shadow-card">
      <div className="mb-2 grid h-8 w-8 place-items-center rounded-xl bg-gold font-display text-background shadow-gold">{n}</div>
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
