import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Trophy, Users2, BarChart3, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MatchCard, type MatchCardData } from "@/components/MatchCard";
import trophyImg from "@/assets/trophy-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Voz do Mundial — Vota, compara e vibra com a comunidade" },
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
      {/* HERO */}
      <section className="relative overflow-hidden bg-hero">
        <div className="pointer-events-none absolute inset-0 pitch-lines opacity-50" />
        <div className="relative grid gap-6 px-5 pt-8 pb-12 sm:grid-cols-2 sm:items-center sm:gap-4 sm:pb-16">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-gold">
              <Sparkles className="h-3 w-3" /> Comunidade do Mundial
            </span>
            <h1 className="font-display text-5xl leading-none text-balance sm:text-6xl">
              VOZ DO <span className="text-gold">MUNDIAL</span>
            </h1>
            <p className="text-lg font-medium text-foreground/90">
              Vota, compara e vibra com a comunidade.
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              A comunidade onde os adeptos deixam as suas previsões, acompanham os jogos e
              competem nos rankings do Mundial.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link to="/jogos" className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-background shadow-gold transition-smooth hover:scale-[1.02]">
                Ver Jogos de Hoje <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#como-funciona" className="rounded-full border border-border bg-card/60 px-5 py-2.5 text-sm font-semibold backdrop-blur transition-smooth hover:border-gold/40">
                Como Funciona
              </a>
            </div>
          </div>
          <div className="relative mx-auto h-[320px] w-full max-w-sm sm:h-[420px]">
            <div className="absolute inset-0 rounded-3xl bg-gold/20 blur-3xl" />
            <img
              src={trophyImg}
              alt="Troféu do Mundial com luzes de estádio"
              width={1024}
              height={1024}
              className="relative h-full w-full rounded-3xl object-cover shadow-elegant"
            />
          </div>
        </div>
      </section>

      {/* JOGOS DE HOJE */}
      <section className="px-5 pt-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl">Jogos de Hoje</h2>
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
          <div className="grid gap-3">
            {todays.map((m) => <MatchCard key={m.id} match={m} />)}
          </div>
        )}
      </section>

      {/* RANKING + PRIZES */}
      <section className="grid gap-4 px-5 pt-10 sm:grid-cols-2">
        <Card icon={<BarChart3 className="h-5 w-5 text-gold" />} title="Líderes do Ranking" href="/rankings" cta="Ver rankings">
          {topLeaders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ainda sem dados — sê o primeiro a marcar pontos.</p>
          ) : (
            <ol className="space-y-2">
              {topLeaders.map((u, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${i === 0 ? "bg-gold text-background" : "bg-secondary"}`}>{i + 1}</span>
                    <span className="font-medium">{u.display_name ?? "Adepto"}</span>
                  </span>
                  <span className="font-display text-gold">{u.total_points} pts</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
        <Card icon={<Trophy className="h-5 w-5 text-gold" />} title="Prémios por Fase" href="/premios" cta="Ver prémios">
          <p className="text-sm text-muted-foreground">
            Vence o ranking da Fase de Grupos, Oitavos, Quartos ou Meias-Finais e ganha prémios da comunidade.
          </p>
        </Card>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="px-5 pt-12">
        <h2 className="mb-5 font-display text-2xl">Como funciona</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Step n="1" title="Vê os jogos">Consulta os jogos do dia e escolhe os que te interessam.</Step>
          <Step n="2" title="Deixa a tua previsão">Vota nos mercados que quiseres até 5 minutos antes do jogo.</Step>
          <Step n="3" title="Compete">Soma pontos pelo teu palpite e sobe no ranking da fase.</Step>
        </div>
        <div className="mt-6 rounded-2xl border border-gold/30 bg-gold/5 p-5 text-sm">
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

function Card({ icon, title, href, cta, children }: { icon: React.ReactNode; title: string; href: string; cta: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card/70 p-5 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-display text-lg">{title}</h3>
        </div>
        <Link to={href} className="text-xs font-semibold text-gold">{cta} →</Link>
      </div>
      {children}
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
