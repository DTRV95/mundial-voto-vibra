import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowRight, Trophy, BarChart3, Users2, Users, Sparkles, Timer, TrendingUp, Newspaper, Star, Gift } from "lucide-react";
import { TeamBadge } from "@/lib/teamColors.tsx";
import { supabase } from "@/integrations/supabase/client";
import { MatchCard, type MatchCardData } from "@/components/MatchCard";
import { useAuth } from "@/lib/useAuth";
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
  const { user } = useAuth();
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
        .limit(10);
      return data ?? [];
    },
  });

  const { data: topPools = [] } = useQuery({
    queryKey: ["pools", "ranking"],
    queryFn: async () => {
      // Buscar ligas (visível também para utilizadores não autenticados se RLS permitir)
      const { data: pools } = await supabase
        .from("pools")
        .select("id, name")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!pools || pools.length === 0) return [];

      // Tentar buscar membros (pode falhar para utilizadores anónimos)
      const poolIds = pools.map((p) => p.id);
      const { data: members } = await supabase
        .from("pool_members")
        .select("pool_id, user_id, joined_at")
        .in("pool_id", poolIds);

      if (!members || members.length === 0) {
        return pools.map((p) => ({ id: p.id, name: p.name, points: 0, members: 0 }));
      }

      // Buscar previsões para calcular pontos por liga
      const userIds = [...new Set(members.map((m) => m.user_id))];
      const { data: preds } = await supabase
        .from("predictions")
        .select("user_id, points, created_at")
        .in("user_id", userIds);

      const poolPoints: Record<string, number> = {};
      const poolMemberCount: Record<string, number> = {};
      for (const member of members) {
        const pts = (preds ?? [])
          .filter((p) => p.user_id === member.user_id && p.created_at >= member.joined_at)
          .reduce((sum, p) => sum + (p.points ?? 0), 0);
        poolPoints[member.pool_id] = (poolPoints[member.pool_id] ?? 0) + pts;
        poolMemberCount[member.pool_id] = (poolMemberCount[member.pool_id] ?? 0) + 1;
      }

      return pools
        .map((p) => ({ id: p.id, name: p.name, points: poolPoints[p.id] ?? 0, members: poolMemberCount[p.id] ?? 0 }))
        .sort((a, b) => b.points - a.points);
    },
  });

  const { data: featuredNewsList = [] } = useQuery({
    queryKey: ["news", "featured"],
    queryFn: async () => {
      const { data } = await supabase
        .from("news")
        .select("id,slug,title,excerpt,image_url,category,created_at")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(4);
      return data ?? [];
    },
  });

  const { data: myPools = [] } = useQuery({
    queryKey: ["my-pools", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: memberships } = await supabase
        .from("pool_members")
        .select("pool_id, joined_at")
        .eq("user_id", user!.id)
        .order("joined_at", { ascending: false });

      if (!memberships || memberships.length === 0) return [];

      const poolIds = memberships.map((m) => m.pool_id);
      const { data: pools } = await supabase
        .from("pools")
        .select("id, name, code, prize")
        .in("id", poolIds);

      // Contar membros de cada liga
      const { data: allMembers } = await supabase
        .from("pool_members")
        .select("pool_id")
        .in("pool_id", poolIds);

      return (pools ?? []).map((p) => ({
        ...p,
        members: (allMembers ?? []).filter((m) => m.pool_id === p.id).length,
        joined_at: memberships.find((m) => m.pool_id === p.id)?.joined_at,
      }));
    },
  });

  const { data: nextMatch } = useQuery({
    queryKey: ["matches", "next"],
    queryFn: async () => {
      const { data } = await supabase
        .from("matches")
        .select("id,kickoff_at,home:home_team_id(name,flag,code),away:away_team_id(name,flag,code)")
        .gt("kickoff_at", new Date().toISOString())
        .eq("status", "scheduled")
        .order("kickoff_at")
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  return (
    <div className="pb-10">

      {/* ===================== HERO ===================== */}

      {/* ===================== HERO — Panini WC2026 (mobile + desktop) ===================== */}
      <section className="relative px-4 pt-4 md:px-6 md:pt-5">
        <div
          className="relative overflow-hidden rounded-3xl bg-wc-red panini-stripes"
          style={{ boxShadow: "0 12px 48px oklch(0.54 0.24 27 / 0.35)", minHeight: "200px" }}
        >
          {/* ── Canto superior direito: troféu cores originais ─── */}
          <div className="absolute top-0 right-0 h-[75%] w-[38%] md:h-full md:w-[36%] overflow-hidden"
            style={{ borderBottomLeftRadius: "48px" }}>
            <img
              src={trophyImg}
              alt="Troféu do Mundial"
              className="h-full w-full object-cover object-center trophy-shine"
            />
          </div>

          {/* ── Canto inferior esquerdo: bloco verde ──────────── */}
          <div
            className="absolute bottom-0 left-0 h-16 w-16 md:h-20 md:w-20 bg-wc-green"
            style={{ borderTopRightRadius: "40px" }}
          />

          {/* ── Conteúdo principal ────────────────────────────── */}
          <div className="relative px-5 py-4 md:px-10 md:py-6 pr-[42%] md:pr-[40%]">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/80 mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> Mundial 2026
            </p>
            <h1 className="font-display text-[clamp(3rem,10vw,6rem)] leading-none text-gold-metallic">
              UMA<br />GERAÇÃO
            </h1>
            <p className="mt-3 text-sm md:text-base font-semibold text-white/90 max-w-xs">
              Vota, compara e vibra com a comunidade.
            </p>
            {/* CTAs — só desktop (mobile tem abaixo) */}
            <div className="hidden md:flex items-center gap-3 mt-6">
              <Link to="/jogos"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-wc-red shadow-elegant transition-smooth hover:scale-[1.02]">
                Ver Jogos de Hoje <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#como-funciona"
                className="rounded-2xl border-2 border-white/40 px-5 py-3 text-sm font-bold text-white transition-smooth hover:bg-white/10">
                Como funciona
              </a>
            </div>
          </div>

          {/* ── Stats strip ───────────────────────────────────── */}
          <div className="relative grid grid-cols-3 gap-px border-t border-white/20 bg-white/20">
            {[{ label: "Equipas", value: "48" }, { label: "Jogos", value: "104" }, { label: "Países", value: "3" }].map((s) => (
              <div key={s.label} className="bg-white/10 py-3 text-center text-white">
                <div className="font-display text-2xl md:text-3xl leading-none">{s.value}</div>
                <div className="text-[10px] uppercase tracking-wider opacity-70 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs mobile — abaixo do card */}
        <div className="flex gap-3 pt-4 md:hidden">
          <Link to="/jogos"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-wc-red py-3 text-sm font-bold text-white shadow-gold transition-smooth active:scale-95">
            Ver Jogos de Hoje <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="#como-funciona"
            className="inline-flex items-center justify-center rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 transition-smooth">
            Como?
          </a>
        </div>
      </section>

      {/* ===================== COUNTDOWN + CTA ===================== */}
      <div className={`mx-5 mt-4 md:mx-8 ${nextMatch && !user ? "grid gap-3 sm:grid-cols-2" : ""}`}>
        {nextMatch && (
          <Countdown
            kickoff_at={nextMatch.kickoff_at}
            home={(nextMatch as any).home}
            away={(nextMatch as any).away}
          />
        )}
        {!user && (
          <div
            className="relative overflow-hidden rounded-2xl panini-stripes"
            style={{ background: "linear-gradient(135deg, oklch(0.54 0.24 27) 0%, oklch(0.36 0.18 350) 50%, oklch(0.28 0.14 270) 100%)", boxShadow: "0 6px 24px -4px oklch(0.54 0.24 27 / 0.35)" }}
          >
            {/* Troféu decorativo */}
            <Trophy className="absolute right-3 top-1/2 -translate-y-1/2 h-20 w-20 text-white/5 pointer-events-none" />
            <div className="relative flex h-full flex-col justify-between p-4 text-white">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50 mb-1">Mundial 2026</p>
                <h3 className="font-display text-2xl leading-none">A tua geração.<br/>O teu torneio.</h3>
                <p className="mt-2 text-xs text-white/70 leading-relaxed max-w-[200px]">Vota, sobe no ranking e prova que sabes mais de futebol.</p>
              </div>
              <div className="mt-4 flex flex-col gap-1.5">
                <Link
                  to="/auth"
                  className="block w-full rounded-xl bg-white py-2.5 text-center text-sm font-bold text-wc-red transition-smooth hover:scale-[1.01] active:scale-95"
                >
                  Entrar agora
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===================== JOGOS DE HOJE ===================== */}
      <section className="px-5 pt-8 md:px-8 relative">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl md:text-3xl text-gray-900">Jogos de Hoje</h2>
            <p className="text-xs text-gray-400">Dá a tua previsão antes do apito inicial.</p>
          </div>
          <Link to="/jogos" className="text-xs font-bold text-wc-red">Ver todos →</Link>
        </div>
        {todays.length === 0 ? (
          <EmptyState
            title="Sem jogos para hoje"
            subtitle="Volta amanhã ou explora as próximas fases."
          />
        ) : (
          <>
            {/* Mobile — carrossel horizontal com scroll snap */}
            <div className="md:hidden -mx-5 px-5">
              <div
                className="flex gap-3 overflow-x-auto pb-3"
                style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
              >
                {todays.map((m) => (
                  <div key={m.id} style={{ scrollSnapAlign: "start", minWidth: "82vw", maxWidth: "82vw" }}>
                    <MatchCard match={m} />
                  </div>
                ))}
              </div>
              {/* Indicador de scroll */}
              {todays.length > 1 && (
                <div className="flex justify-center gap-1.5 pt-1">
                  {todays.map((_, i) => (
                    <div key={i} className={`h-1 rounded-full bg-gold/40 ${i === 0 ? "w-4 bg-gold/80" : "w-1.5"}`} />
                  ))}
                </div>
              )}
            </div>
            {/* Desktop — grid normal */}
            <div className="hidden md:grid gap-3 md:grid-cols-2">
              {todays.map((m) => <MatchCard key={m.id} match={m} />)}
            </div>
          </>
        )}
      </section>

      {/* ===================== RANKING + LIGAS + PRÉMIOS ===================== */}
      <section className="grid gap-4 px-5 pt-10 sm:grid-cols-2 md:px-8">
        {/* Ranking — fundo verde Panini */}
        <div className="rounded-2xl overflow-hidden bg-wc-green panini-stripes" style={{ boxShadow: "0 6px 24px -4px oklch(0.55 0.20 142 / 0.45)" }}>
          <div className="text-white">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/20">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-white/20">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-display text-xl">Líderes</h3>
              </div>
              <Link to="/rankings" className="text-xs font-bold text-white/80 hover:text-white">Ver rankings →</Link>
            </div>
            {/* Linhas da tabela */}
            {topLeaders.length === 0 ? (
              <p className="px-5 py-4 text-sm text-white/70">Ainda sem dados — sê o primeiro a marcar pontos.</p>
            ) : (
              <ol>
                {topLeaders.map((u, i) => (
                  <li key={i} className={`flex items-center justify-between px-5 py-3 ${i < topLeaders.length - 1 ? "border-b border-white/20" : ""}`}>
                    <span className="flex items-center gap-3">
                      <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                        i === 0 ? "bg-white text-wc-green" : "bg-white/20 text-white"
                      }`}>{i + 1}</span>
                      <span className="font-semibold text-sm">{u.display_name ?? "Adepto"}</span>
                    </span>
                    <span className="font-display text-lg">{u.total_points} <span className="text-xs font-sans opacity-70">pts</span></span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* Ranking de Torneios — fundo azul Panini */}
        <div className="rounded-2xl overflow-hidden bg-wc-blue panini-stripes shadow-elegant">
          <div className="text-white">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/20">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-white/20">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-display text-xl">Leader Board Torneios</h3>
              </div>
              <Link to="/ligas" className="text-xs font-bold text-white/80 hover:text-white">Ver todos →</Link>
            </div>
            {topPools.length === 0 ? (
              <div className="px-5 py-5 text-center">
                <p className="text-sm text-white/70 mb-3">Ainda sem torneios — cria o primeiro!</p>
                <Link to="/ligas" className="inline-block rounded-xl bg-white/15 px-4 py-2 text-xs font-bold text-white hover:bg-white/25 transition-smooth">
                  Convida os teus amigos →
                </Link>
              </div>
            ) : (
              <>
                <ol>
                  {topPools.map((pool, i) => (
                    <li key={pool.id} className={`flex items-center justify-between px-5 py-3 ${i < topPools.length - 1 ? "border-b border-white/20" : ""}`}>
                      <span className="flex items-center gap-3 min-w-0">
                        <span className={`shrink-0 grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                          i === 0 ? "bg-white text-wc-blue" : "bg-white/20 text-white"
                        }`}>{i + 1}</span>
                        <span className="font-semibold text-sm truncate">{pool.name}</span>
                      </span>
                      <span className="shrink-0 font-display text-lg ml-2">{pool.points} <span className="text-xs font-sans opacity-70">pts</span></span>
                    </li>
                  ))}
                </ol>
                <div className="border-t border-white/20 px-5 py-3 text-center">
                  <Link to="/ligas" className="text-xs font-bold text-white/60 hover:text-white transition-smooth">
                    + Convida os teus amigos e cria um torneio
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

      </section>

      {/* ===================== CONVIDA OS TEUS AMIGOS ===================== */}
      <section className="px-5 pt-8 md:px-8">
        <div
          className="overflow-hidden rounded-2xl panini-stripes"
          style={{ background: "linear-gradient(135deg, oklch(0.54 0.24 27) 0%, oklch(0.38 0.16 350) 60%, oklch(0.28 0.14 270) 100%)", boxShadow: "0 8px 32px oklch(0.54 0.24 27 / 0.30)" }}
        >
          <div className="flex items-center justify-between gap-4 p-5 text-white">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50 mb-1">Torneio Privado</p>
              <h3 className="font-display text-2xl leading-tight">Convida os teus amigos</h3>
              <p className="mt-1 text-xs text-white/70">Cria um grupo fechado e vê quem sabe mais de futebol.</p>
            </div>
            <Link to="/ligas"
              className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-wc-red shadow-gold transition-smooth hover:scale-[1.02] active:scale-95">
              Criar →
            </Link>
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

      {/* ===================== NOTÍCIAS EM DESTAQUE ===================== */}
      {featuredNewsList.length > 0 && (
        <section className="px-5 pt-10 pb-2 md:px-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl md:text-3xl">Últimas Notícias</h2>
            <Link to="/noticias" className="text-xs font-semibold text-gold hover:text-gold/80 transition-smooth">
              Ver todas →
            </Link>
          </div>

          {/* Artigo principal */}
          {(() => {
            const main = featuredNewsList[0] as any;
            const rest = featuredNewsList.slice(1) as any[];
            return (
              <>
                <Link
                  to="/noticias/$id"
                  params={{ id: main.slug ?? main.id }}
                  className="group mb-3 block overflow-hidden rounded-2xl border border-border bg-card transition-smooth hover:border-gold/40"
                >
                  {main.image_url ? (
                    <div className="relative overflow-hidden h-52 md:h-64">
                      <img src={main.image_url} alt={main.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        style={{ objectPosition: main.image_position ?? "50% 50%" }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <NewsCategory category={main.category} />
                        <h3 className="mt-1.5 font-display text-xl md:text-2xl leading-snug text-white line-clamp-2">{main.title}</h3>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5">
                      <NewsCategory category={main.category} />
                      <h3 className="mt-2 font-display text-xl leading-snug line-clamp-2">{main.title}</h3>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-border/50 px-4 py-2.5">
                    <span className="text-xs text-muted-foreground">
                      {new Date(main.created_at).toLocaleDateString("pt-PT", { day: "numeric", month: "long" })}
                    </span>
                    <span className="text-xs font-semibold text-gold group-hover:underline">Ler →</span>
                  </div>
                </Link>

                {/* Grid dos restantes */}
                {rest.length > 0 && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {rest.map((news: any) => (
                      <Link
                        key={news.id}
                        to="/noticias/$id"
                        params={{ id: news.slug ?? news.id }}
                        className="group flex flex-row sm:flex-col overflow-hidden rounded-2xl border border-border bg-card transition-smooth hover:border-gold/40"
                      >
                        {news.image_url && (
                          <div className="relative h-20 w-28 shrink-0 overflow-hidden sm:h-36 sm:w-full">
                            <img src={news.image_url} alt={news.title}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                              style={{ objectPosition: news.image_position ?? "50% 50%" }} />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent sm:hidden" />
                          </div>
                        )}
                        <div className="flex flex-1 flex-col justify-center p-3">
                          <NewsCategory category={news.category} small />
                          <h3 className="mt-1 font-display text-sm leading-snug line-clamp-2">{news.title}</h3>
                          <p className="mt-1.5 text-[11px] text-muted-foreground">
                            {new Date(news.created_at).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            );
          })()}

          <Link to="/noticias"
            className="mt-3 block w-full rounded-2xl border border-border py-2.5 text-center text-xs font-bold text-muted-foreground transition-smooth hover:border-gold/40 hover:text-gold">
            Ver todas as notícias →
          </Link>
        </section>
      )}
    </div>
  );
}

const NEWS_CATEGORY: Record<string, { label: string; cls: string }> = {
  analise:   { label: "Análise ScoreLab", cls: "text-gold" },
  antevisao: { label: "Antevisão",        cls: "text-primary" },
  noticia:   { label: "Notícia",          cls: "text-muted-foreground" },
  opiniao:   { label: "Opinião",          cls: "text-muted-foreground" },
};

function NewsCategory({ category, small = false }: { category: string; small?: boolean }) {
  const c = NEWS_CATEGORY[category] ?? NEWS_CATEGORY.noticia;
  return (
    <p className={`font-bold uppercase tracking-widest ${small ? "text-[9px]" : "text-[10px]"} ${c.cls}`}>
      {category === "analise" && <TrendingUp className="inline h-2.5 w-2.5 mr-0.5 -mt-0.5" />}
      {c.label}
    </p>
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

function Countdown({ kickoff_at, home, away }: { kickoff_at: string; home: any; away: any }) {
  const [diff, setDiff] = useState(new Date(kickoff_at).getTime() - Date.now());

  useEffect(() => {
    const t = setInterval(() => {
      setDiff(new Date(kickoff_at).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(t);
  }, [kickoff_at]);

  if (diff <= 0) return null;

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  const pad = (n: number) => String(n).padStart(2, "0");

  const goldGrad = {
    background: "linear-gradient(180deg, oklch(0.90 0.12 92), oklch(0.72 0.16 75))",
    WebkitBackgroundClip: "text" as const,
    WebkitTextFillColor: "transparent" as const,
    backgroundClip: "text" as const,
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-r from-card/80 via-gold/5 to-card/80 px-4 py-3">
      {/* Linha superior — label + equipas */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Timer className="h-3.5 w-3.5 text-gold" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Próximo jogo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TeamBadge code={home?.code ?? null} flag={home?.flag ?? null} name={home?.name ?? ""} size="sm" />
          <span className="text-[10px] font-bold text-muted-foreground/50">vs</span>
          <TeamBadge code={away?.code ?? null} flag={away?.flag ?? null} name={away?.name ?? ""} size="sm" />
        </div>
      </div>
      {/* Cronómetro compacto */}
      <div className="mt-2 flex items-end gap-0.5">
        {h > 0 && (
          <>
            <div className="text-center">
              <div className="font-display text-3xl leading-none" style={goldGrad}>{pad(h)}</div>
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground">h</div>
            </div>
            <span className="font-display text-xl text-gold/30 mb-3">:</span>
          </>
        )}
        <div className="text-center">
          <div className="font-display text-3xl leading-none" style={goldGrad}>{pad(m)}</div>
          <div className="text-[8px] uppercase tracking-widest text-muted-foreground">min</div>
        </div>
        <span className="font-display text-xl text-gold/30 mb-3">:</span>
        <div className="text-center">
          <div className="font-display text-3xl leading-none" style={goldGrad}>{pad(s)}</div>
          <div className="text-[8px] uppercase tracking-widest text-muted-foreground">seg</div>
        </div>
      </div>
    </div>
  );
}
