import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, BarChart3, Users2, Users, Sparkles, Timer, TrendingUp, CheckCircle2, XCircle, Zap, ChevronRight, Target } from "lucide-react";

import { TeamBadge } from "@/lib/teamColors.tsx";
import { supabase } from "@/integrations/supabase/client";
import { MatchCard, type MatchCardData } from "@/components/MatchCard";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import { useAuth } from "@/lib/useAuth";
import { useFollowing } from "@/lib/useFollow";
import trophyImg from "@/assets/trophy-hero.jpg";

const SITE = "https://mundial-voto-vibra.davidvilaverde.workers.dev";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Uma Geração — Vota, compara e vibra com a comunidade" },
      { name: "description", content: "Faz a tua previsão para cada jogo do Mundial 2026, compara com a comunidade e compete nos rankings por fase." },
      { property: "og:title", content: "Uma Geração — Mundial 2026" },
      { property: "og:description", content: "Faz as tuas previsões, compara com a comunidade e vibra com cada jogo do Mundial 2026." },
      { property: "og:url", content: `${SITE}/` },
      { property: "og:image", content: `${SITE}/og-image.png` },
    ],
    links: [{ rel: "canonical", href: `${SITE}/` }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SportsOrganization",
        "name": "Uma Geração",
        "url": SITE,
        "description": "Comunidade de previsões do Mundial 2026",
        "sport": "Futebol",
        "sameAs": ["https://instagram.com/umageracao2026"],
      }),
    }],
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
        .select("id,kickoff_at,phase,voting_open,home:home_team_id(name,flag,code),away:away_team_id(name,flag,code),predictions(count)")
        .gte("kickoff_at", start.toISOString())
        .lte("kickoff_at", end.toISOString())
        .order("kickoff_at")
        .limit(4);
      return ((data as any) ?? []).map((m: any) => ({ ...m, votes_count: m.predictions?.[0]?.count ?? 0 }));
    },
  });

  const { data: votedTodayIds = new Set<string>() } = useQuery({
    queryKey: ["voted-today", user?.id],
    enabled: !!user?.id && todays.length > 0,
    queryFn: async () => {
      const ids = todays.map(m => m.id);
      const { data } = await supabase
        .from("predictions")
        .select("match_id")
        .eq("user_id", user!.id)
        .in("match_id", ids);
      return new Set((data ?? []).map((p: any) => p.match_id));
    },
  });

  const todaysWithVoted = todays.map(m => ({ ...m, already_voted: votedTodayIds.has(m.id) }));

  const { data: topLeaders = [] } = useQuery({
    queryKey: ["leaders", "home"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,display_name,total_points,predictions_made")
        .order("total_points", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const { data: topPools = [] } = useQuery({
    queryKey: ["pools", "ranking"],
    queryFn: async () => {
      const { data: pools } = await supabase
        .from("pools")
        .select("id, name");

      if (!pools || pools.length === 0) return [];

      const poolIds = pools.map((p) => p.id);
      const { data: members } = await supabase
        .from("pool_members")
        .select("pool_id, user_id, start_points")
        .in("pool_id", poolIds);

      if (!members || members.length === 0) {
        return pools.map((p) => ({ id: p.id, name: p.name, points: 0, members: 0 }));
      }

      const userIds = [...new Set(members.map((m) => m.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, total_points")
        .in("id", userIds);

      const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.total_points ?? 0]));

      // Agrupar pontos por pool e aplicar regra top-3
      const poolMemberPts: Record<string, number[]> = {};
      for (const member of members) {
        const leaguePts = Math.max(0, (profileMap[member.user_id] ?? 0) - (member.start_points ?? 0));
        if (!poolMemberPts[member.pool_id]) poolMemberPts[member.pool_id] = [];
        poolMemberPts[member.pool_id].push(leaguePts);
      }

      return pools
        .map((p) => {
          const pts = (poolMemberPts[p.id] ?? []).sort((a, b) => b - a);
          const topN = Math.min(3, pts.length);
          const points = pts.slice(0, topN).reduce((s, v) => s + v, 0);
          return { id: p.id, name: p.name, points, members: pts.length };
        })
        .sort((a, b) => b.points - a.points)
        .slice(0, 5);
    },
  });

  const { data: myDivision } = useQuery({
    queryKey: ["my-division-home", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: me } = await supabase
        .from("profiles")
        .select("total_points,vote_streak,max_vote_streak")
        .eq("id", user!.id)
        .maybeSingle();
      if (!me) return null;
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gt("total_points", me.total_points ?? 0);
      const rank = (count ?? 0) + 1;
      const DIVISIONS = [
        { label: "1ª Liga",            emoji: "🏆", min: 1,  max: 5,   border: "border-cyan-400/40",    bg: "bg-cyan-400/10",    text: "text-cyan-400" },
        { label: "2ª Liga",            emoji: "⚽", min: 6,  max: 15,  border: "border-yellow-400/40",  bg: "bg-yellow-400/10",  text: "text-yellow-400" },
        { label: "Distrital",          emoji: "🟡", min: 16, max: 30,  border: "border-slate-400/40",   bg: "bg-slate-400/10",   text: "text-slate-400" },
        { label: "Liga do Zé Povinho", emoji: "🟢", min: 31, max: Infinity, border: "border-green-700/40", bg: "bg-green-700/10", text: "text-green-600" },
      ];
      const div = DIVISIONS.find(d => rank >= d.min && rank <= d.max) ?? DIVISIONS[3];
      return { rank, points: me.total_points ?? 0, streak: (me as any).vote_streak ?? 0, maxStreak: (me as any).max_vote_streak ?? 0, ...div };
    },
  });

  const { data: pendingMatches = [] } = useQuery({
    queryKey: ["pending-votes", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const now = new Date();
      const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
      const tomorrowEnd = new Date(now); tomorrowEnd.setDate(tomorrowEnd.getDate() + 1); tomorrowEnd.setHours(23, 59, 59, 999);

      const { data: matches } = await supabase
        .from("matches")
        .select("id,kickoff_at,voting_open,home:home_team_id(name,flag,code),away:away_team_id(name,flag,code)")
        .gte("kickoff_at", now.toISOString())
        .lte("kickoff_at", tomorrowEnd.toISOString())
        .eq("voting_open", true)
        .order("kickoff_at");

      if (!matches || matches.length === 0) return [];

      const { data: voted } = await supabase
        .from("predictions")
        .select("match_id")
        .eq("user_id", user!.id)
        .in("match_id", matches.map((m: any) => m.id));

      const votedIds = new Set((voted ?? []).map((p: any) => p.match_id));
      return (matches as any[]).filter(m => !votedIds.has(m.id));
    },
  });

  // Personal prediction results on finished matches
  const { data: myResults = [] } = useQuery({
    queryKey: ["my-results", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const { data: finished } = await supabase
        .from("matches")
        .select("id,kickoff_at,home_score,away_score,home:home_team_id(name,flag,code),away:away_team_id(name,flag,code)")
        .not("home_score", "is", null)
        .gte("kickoff_at", fourteenDaysAgo)
        .order("kickoff_at", { ascending: false })
        .limit(15);
      if (!finished?.length) return [];
      const { data: preds } = await supabase
        .from("predictions")
        .select("match_id,points,exact_home,exact_away,result_90")
        .eq("user_id", user!.id)
        .in("match_id", (finished as any[]).map(m => m.id));
      if (!preds?.length) return [];
      const predMap = Object.fromEntries((preds as any[]).map(p => [p.match_id, p]));
      return (finished as any[])
        .filter(m => predMap[m.id])
        .map(m => {
          const pred = predMap[m.id];
          const isExact = pred.exact_home === m.home_score && pred.exact_away === m.away_score;
          const isCorrect = (pred.points ?? 0) > 0;
          return { ...m, pred, isExact, isCorrect };
        })
        .slice(0, 6);
    },
    staleTime: 120_000,
  });

  const [feedShown, setFeedShown] = useState(6);
  const feedSentinelRef = useRef<HTMLButtonElement>(null);
  const { data: following } = useFollowing();


  const { data: activityFeed = [] } = useQuery({
    queryKey: ["activity-feed-v2", following ? [...following].join(",") : "none"],
    enabled: following !== undefined,
    queryFn: async () => {
      const followingIds = following ? [...following] : [];
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

      // Global activity_events (division_up, top3) — or filtered by following
      const eventsBase = (supabase as any)
        .from("activity_events")
        .select("id,user_id,type,data,created_at")
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(30);
      const { data: activityEvents } = followingIds.length > 0
        ? await eventsBase.in("user_id", followingIds)
        : await eventsBase;

      if (!activityEvents?.length) return [];

      // Fetch profiles for event authors
      const authorIds = [...new Set((activityEvents as any[]).map((e: any) => e.user_id))];
      const { data: authors } = await supabase
        .from("profiles")
        .select("id,display_name,total_points")
        .in("id", authorIds);
      const profileMap = Object.fromEntries((authors ?? []).map((p: any) => [p.id, p]));

      // For following users: also include correct predictions on finished matches
      let finishedPredEvents: any[] = [];
      if (followingIds.length > 0) {
        const { data: recentMatches } = await supabase
          .from("matches")
          .select("id,kickoff_at,home_score,away_score,home:home_team_id(name,flag),away:away_team_id(name,flag)")
          .not("home_score", "is", null)
          .gte("kickoff_at", sevenDaysAgo)
          .order("kickoff_at", { ascending: false })
          .limit(20);

        const finishedIds = (recentMatches ?? []).map((m: any) => m.id);
        const finishedMap = Object.fromEntries((recentMatches ?? []).map((m: any) => [m.id, m]));

        if (finishedIds.length > 0) {
          const { data: preds } = await supabase
            .from("predictions")
            .select("id,user_id,match_id,exact_home,exact_away,points")
            .in("user_id", followingIds)
            .in("match_id", finishedIds)
            .gt("points", 0);

          for (const p of (preds ?? [])) {
            const match = finishedMap[p.match_id];
            const profile = profileMap[p.user_id] ?? authors?.find((a: any) => a.id === p.user_id);
            if (!match || !profile) continue;
            const isExact = p.exact_home === match.home_score && p.exact_away === match.away_score;
            finishedPredEvents.push({
              id: `pred-${p.id}`,
              createdAt: match.kickoff_at,
              type: isExact ? "exact" : "correct",
              name: profile.display_name ?? "Alguém",
              home: match.home?.name ?? "", away: match.away?.name ?? "",
              homeFlag: match.home?.flag ?? "", awayFlag: match.away?.flag ?? "",
              homeScore: match.home_score, awayScore: match.away_score,
            });
          }
        }

        // Streak milestones for following
        const STREAK_MILESTONES = [5, 10, 15, 20, 25, 30, 50];
        const { data: followedProfiles } = await supabase
          .from("profiles")
          .select("id,display_name,vote_streak")
          .in("id", followingIds)
          .gt("vote_streak", 4);
        for (const sp of (followedProfiles ?? [])) {
          if (STREAK_MILESTONES.includes(sp.vote_streak)) {
            finishedPredEvents.push({
              id: `streak-${sp.id}`,
              createdAt: new Date(Date.now() - 60000).toISOString(),
              type: "streak",
              name: sp.display_name ?? "Alguém",
              streak: sp.vote_streak,
            });
          }
        }

        // Open-match predictions from following
        const { data: recentVotes } = await supabase
          .from("predictions")
          .select("id,created_at,user_id,match_id,result_90,exact_home,exact_away")
          .in("user_id", followingIds)
          .gte("created_at", twoDaysAgo)
          .order("created_at", { ascending: false })
          .limit(15);

        const openMatchIds = [...new Set((recentVotes ?? []).map((v: any) => v.match_id))];
        if (openMatchIds.length > 0) {
          const { data: openMatches } = await supabase
            .from("matches")
            .select("id,home:home_team_id(name,flag),away:away_team_id(name,flag)")
            .in("id", openMatchIds)
            .eq("voting_open", true);
          const openMatchMap = Object.fromEntries((openMatches ?? []).map((m: any) => [m.id, m]));
          for (const v of (recentVotes ?? [])) {
            const match = openMatchMap[v.match_id];
            const profile = profileMap[v.user_id];
            if (!match || !profile) continue;
            if (!v.result_90 && v.exact_home == null) continue;
            const hasExact = v.exact_home != null && v.exact_away != null;
            finishedPredEvents.push({
              id: `vote-${v.id}`,
              createdAt: v.created_at,
              type: "prediction",
              name: profile.display_name ?? "Alguém",
              home: match.home?.name ?? "", away: match.away?.name ?? "",
              homeFlag: match.home?.flag ?? "", awayFlag: match.away?.flag ?? "",
              result90: v.result_90,
              exactHome: hasExact ? v.exact_home : null,
              exactAway: hasExact ? v.exact_away : null,
            });
          }
        }
      }

      const activityItems = (activityEvents as any[]).map((e: any) => {
        const profile = profileMap[e.user_id];
        return {
          id: `evt-${e.id}`,
          createdAt: e.created_at,
          type: e.type,
          name: profile?.display_name ?? "Alguém",
          ...e.data,
        };
      });

      return [...activityItems, ...finishedPredEvents]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 30);
    },
    staleTime: 60_000,
  });

  const myLeaderEntry = topLeaders.find((u: any) => u.id === user?.id);
  const { data: myLeaderRank } = useQuery({
    queryKey: ["my-rank-home", user?.id],
    enabled: !!user?.id && !myLeaderEntry && topLeaders.length > 0,
    queryFn: async () => {
      const { data: me } = await supabase
        .from("profiles")
        .select("id,display_name,total_points")
        .eq("id", user!.id)
        .maybeSingle();
      if (!me) return null;
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gt("total_points", me.total_points);
      return { display_name: me.display_name, total_points: me.total_points, rank: (count ?? 0) + 1 };
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

      {/* ===================== HERO — Panini WC2026 (mobile + desktop) ===================== */}
      <section className="relative px-4 pt-4 md:px-6 md:pt-5">
        <div
          className="relative overflow-hidden rounded-3xl bg-wc-red panini-stripes"
          style={{ boxShadow: "0 12px 48px oklch(0.54 0.24 27 / 0.35)", minHeight: "200px" }}
        >
          <div className="absolute top-0 right-0 h-[75%] w-[38%] md:h-full md:w-[36%] overflow-hidden"
            style={{ borderBottomLeftRadius: "48px" }}>
            <img src={trophyImg} alt="Troféu do Mundial" className="h-full w-full object-cover object-center trophy-shine" />
          </div>
          <div className="absolute bottom-0 left-0 h-16 w-16 md:h-20 md:w-20 bg-wc-green" style={{ borderTopRightRadius: "40px" }} />
          <div className="relative px-5 py-4 md:px-10 md:py-6 pr-[42%] md:pr-[40%]">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/80 mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> Mundial 2026
            </p>
            <h1 className="font-display text-[clamp(3rem,10vw,6rem)] leading-none text-gold-metallic">
              UMA<br />GERAÇÃO
            </h1>
            <p className="mt-3 text-sm md:text-base font-semibold text-white/90 max-w-xs">
              {user ? "Vota, compara e vibra com a comunidade." : "O jogo de previsões do Mundial. Gratuito. Sem complicações."}
            </p>
            <div className="hidden md:flex items-center gap-3 mt-6">
              {user ? (
                <Link to="/jogos" className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-wc-red shadow-elegant transition-smooth hover:scale-[1.02]">
                  Ver Jogos de Hoje <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link to="/auth" className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-wc-red shadow-elegant transition-smooth hover:scale-[1.02]">
                    Entrar grátis <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a href="#como-funciona" className="rounded-2xl border-2 border-white/40 px-5 py-3 text-sm font-bold text-white transition-smooth hover:bg-white/10">
                    Como funciona
                  </a>
                </>
              )}
            </div>
          </div>
          <div className="relative grid grid-cols-3 gap-px border-t border-white/20 bg-white/20">
            {[{ label: "Equipas", value: "48" }, { label: "Jogos", value: "104" }, { label: "Países", value: "3" }].map((s) => (
              <div key={s.label} className="bg-white/10 py-3 text-center text-white">
                <div className="font-display text-2xl md:text-3xl leading-none">{s.value}</div>
                <div className="text-[10px] uppercase tracking-wider opacity-70 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs mobile */}
        <div className="flex gap-3 pt-4 md:hidden">
          {user ? (
            <Link to="/jogos" className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-wc-red py-3 text-sm font-bold text-white shadow-gold transition-smooth active:scale-95">
              Ver Jogos de Hoje <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link to="/auth" className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-wc-red py-3 text-sm font-bold text-white shadow-gold transition-smooth active:scale-95">
                Entrar grátis <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#como-funciona" className="inline-flex items-center justify-center rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 transition-smooth">
                Como?
              </a>
            </>
          )}
        </div>
      </section>

      {/* ===================== COUNTDOWN + CTA ===================== */}
      <div className={`mx-5 mt-4 md:mx-8 ${nextMatch && !user ? "grid gap-3 sm:grid-cols-2" : ""}`}>
        {nextMatch && (
          <Countdown kickoff_at={nextMatch.kickoff_at} home={(nextMatch as any).home} away={(nextMatch as any).away} />
        )}
        {!user && (
          <div className="relative overflow-hidden rounded-2xl"
            style={{ background: "linear-gradient(135deg, oklch(0.20 0.06 270) 0%, oklch(0.28 0.10 300) 50%, oklch(0.22 0.08 250) 100%)", boxShadow: "0 6px 24px -4px oklch(0.20 0.06 270 / 0.6)" }}>
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 80% 50%, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
            <div className="absolute top-3 right-3 flex gap-1.5">
              {["🇵🇹","🇧🇷","🇦🇷","🇫🇷","🏴󠁧󠁢󠁥󠁮󠁧󠁿"].map(f => <span key={f} className="text-base opacity-60">{f}</span>)}
            </div>
            <div className="relative p-5 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 mb-1.5">Grátis · Sem cartão</p>
              <h3 className="font-display text-[1.5rem] leading-tight">Quem sabe mais<br/>de futebol?</h3>
              <ul className="mt-2.5 space-y-1 text-[12px] text-white/65">
                <li className="flex items-center gap-1.5"><span className="text-gold">✓</span> Vota em cada jogo antes do apito</li>
                <li className="flex items-center gap-1.5"><span className="text-gold">✓</span> Vê o que a comunidade palpitou</li>
                <li className="flex items-center gap-1.5"><span className="text-gold">✓</span> Cria torneios com amigos e família</li>
              </ul>
              <div className="mt-4 flex gap-2">
                <Link to="/auth"
                  className="flex-1 rounded-xl bg-gold py-2.5 text-center text-sm font-bold text-background shadow-gold transition-smooth hover:scale-[1.01] active:scale-95">
                  Entrar grátis
                </Link>
                <a href="#como-funciona"
                  className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white/70 transition-smooth hover:border-white/40 hover:text-white">
                  Como?
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===================== BANNER PERSUASÃO — visitantes ===================== */}
      {!user && (
        <div className="mx-5 mt-6 md:mx-8">
          <div className="relative overflow-hidden rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/8 via-transparent to-transparent px-5 py-4">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 font-display text-6xl opacity-[0.06] select-none pointer-events-none">🏆</div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gold/70 mb-1">Junta-te à comunidade</p>
            <p className="font-display text-base leading-snug mb-0.5">Vota nestes jogos e vê se acertaste</p>
            <p className="text-xs text-muted-foreground mb-3">Regista-te em segundos — é grátis, sem cartão, sem spam.</p>
            <Link to="/auth"
              className="inline-flex items-center gap-2 rounded-xl bg-wc-red px-5 py-2.5 text-sm font-bold text-white shadow-gold transition-smooth hover:scale-[1.01] active:scale-95">
              Criar conta grátis <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* ===================== BANNER PROGNÓSTICOS — todos os utilizadores ===================== */}
      <div className="mx-5 mt-4 md:mx-8">
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            background: "linear-gradient(135deg, oklch(0.18 0.06 260) 0%, oklch(0.22 0.08 280) 50%, oklch(0.18 0.05 250) 100%)",
            boxShadow: "0 6px 28px -4px oklch(0.22 0.10 265 / 0.55)",
          }}
        >
          {/* dot grid */}
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
          {/* glow accent */}
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-gold/20 blur-2xl pointer-events-none" />

          <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gold/20 border border-gold/30">
                <Target className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 mb-1">Antes de votares</p>
                <p className="font-display text-lg leading-tight text-white">Lê os prognósticos dos jogos</p>
                <p className="text-xs text-white/55 mt-0.5">Análise de cada jogo para votares com mais confiança.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:shrink-0">
              <Link
                to="/noticias"
                search={{ prog: true } as any}
                className="flex-1 sm:flex-none rounded-xl border border-white/20 px-4 py-2.5 text-center text-sm font-bold text-white/80 transition-smooth hover:border-white/40 hover:text-white"
              >
                Ver análises
              </Link>
              <Link
                to="/jogos"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-background shadow-gold transition-smooth hover:scale-[1.02] active:scale-95"
              >
                Votar agora <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== BANNER TORNEIO — logado sem liga ===================== */}
      {user && myPools.length === 0 && (
        <div className="mx-5 mt-4 md:mx-8">
          <div className="relative overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-r from-gold/10 via-gold/5 to-transparent px-5 py-4">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex -space-x-2 opacity-30 pointer-events-none select-none text-2xl">
              <span>👤</span><span>👤</span><span>👤</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gold/70 mb-0.5">Novo — Torneios Privados</p>
                <p className="font-display text-base leading-snug">Ainda não tens um grupo de amigos?</p>
                <p className="text-xs text-muted-foreground mt-0.5">Cria um torneio em 30 segundos e partilha o código.</p>
              </div>
              <Link to="/ligas"
                className="shrink-0 rounded-xl bg-gold px-4 py-2 text-xs font-bold text-background shadow-gold transition-smooth hover:scale-[1.02] active:scale-95 whitespace-nowrap">
                Criar grupo →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ===================== DIVISÃO DO UTILIZADOR ===================== */}
      {user && myDivision && (
        <div className="mx-5 mt-4 md:mx-8">
          <Link to="/rankings" search={{ tab: "divisoes" } as any}
            className={`flex items-center gap-4 rounded-2xl border ${myDivision.border} ${myDivision.bg} px-5 py-4 transition-smooth hover:opacity-90`}
          >
            <span className="text-4xl">{myDivision.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">A tua divisão</p>
              <p className={`font-display text-xl leading-none ${myDivision.text}`}>{myDivision.label}</p>
              <p className="text-xs text-muted-foreground mt-1">#{myDivision.rank}º global · {myDivision.points} pts</p>
            </div>
            {myDivision.streak > 0 && (
              <div className="flex flex-col items-center shrink-0 rounded-xl bg-orange-500/15 border border-orange-500/30 px-3 py-1.5">
                <span className="text-lg leading-none">🔥</span>
                <span className="text-[11px] font-bold text-orange-400 leading-none mt-0.5">{myDivision.streak}</span>
              </div>
            )}
            <ArrowRight className={`h-4 w-4 shrink-0 ${myDivision.text}`} />
          </Link>
        </div>
      )}

      {/* ===================== JOGOS POR VOTAR ===================== */}
      {user && pendingMatches.length > 0 && (
        <div className="mx-5 mt-4 md:mx-8">
          <div className="overflow-hidden rounded-2xl bg-wc-green panini-stripes"
            style={{ boxShadow: "0 6px 24px -4px oklch(0.55 0.20 142 / 0.40)" }}>
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">Não percas pontos</p>
                  <h3 className="font-display text-xl text-white leading-tight">
                    {pendingMatches.length === 1
                      ? "1 jogo por votar"
                      : `${pendingMatches.length} jogos por votar`}
                  </h3>
                </div>
                <Link to="/jogos"
                  className="shrink-0 rounded-xl bg-white/15 border border-white/20 px-3 py-2 text-xs font-bold text-white hover:bg-white/25 transition-smooth">
                  Ver todos →
                </Link>
              </div>
              <div className="space-y-2">
                {pendingMatches.slice(0, 3).map((m: any) => {
                  const isToday = new Date(m.kickoff_at).toDateString() === new Date().toDateString();
                  const time = new Date(m.kickoff_at).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
                  return (
                    <Link key={m.id} to="/jogo/$id" params={{ id: String(m.id) }}
                      className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-2.5 hover:bg-white/20 transition-smooth">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <TeamBadge code={m.home?.code} flag={m.home?.flag} name={m.home?.name} size="sm" />
                        <span className="text-xs font-semibold text-white truncate">{m.home?.name}</span>
                        <span className="text-[10px] text-white/40 shrink-0">vs</span>
                        <span className="text-xs font-semibold text-white truncate">{m.away?.name}</span>
                        <TeamBadge code={m.away?.code} flag={m.away?.flag} name={m.away?.name} size="sm" />
                      </div>
                      <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">
                        {isToday ? `Hoje ${time}` : `Amanhã ${time}`}
                      </span>
                    </Link>
                  );
                })}
                {pendingMatches.length > 3 && (
                  <Link to="/jogos"
                    className="flex items-center justify-center py-1.5 text-xs font-semibold text-white/60 hover:text-white transition-smooth">
                    +{pendingMatches.length - 3} mais →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== NOTIFICAÇÕES PUSH ===================== */}
      <PushNotificationPrompt />


      {/* ===================== OS TEUS RESULTADOS ===================== */}
      {user && myResults.length > 0 && (
        <section className="px-5 pt-6 md:px-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl">Os teus resultados</h2>
            <Link to="/jogos" search={{ filter: "votados" } as any} className="text-xs font-semibold text-gold hover:text-gold/80 transition-smooth">Ver todos →</Link>
          </div>

          {/* Mobile: horizontal scroll / Desktop: grid */}
          <div className="md:hidden -mx-5 px-5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <div className="flex gap-3 pb-2" style={{ scrollSnapType: "x mandatory" }}>
              {myResults.map((r: any) => <ResultCard key={r.id} r={r} mobile />)}
            </div>
          </div>
          <div className="hidden md:grid md:grid-cols-3 gap-3">
            {myResults.map((r: any) => <ResultCard key={r.id} r={r} />)}
          </div>
        </section>
      )}

      {/* ===================== FEED DA COMUNIDADE ===================== */}
      {activityFeed.length > 0 && (
        <section className="px-5 pt-6 md:px-8">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl">Comunidade</h2>
              {following && following.size === 0 && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Global</span>
              )}
            </div>
            {following && following.size === 0 && (
              <Link to="/rankings" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-smooth">Seguir adeptos →</Link>
            )}
          </div>

          <div className="space-y-2">
            {activityFeed.slice(0, feedShown).map((item: any) => {
              const mins = Math.floor((Date.now() - new Date(item.createdAt).getTime()) / 60000);
              const timeAgo = mins < 1 ? "agora" : mins < 60 ? `há ${mins}m` : mins < 1440 ? `há ${Math.floor(mins / 60)}h` : `há ${Math.floor(mins / 1440)}d`;

              if (item.type === "division_up" || item.type === "top3") {
                const isTop3 = item.type === "top3";
                const divColors: Record<string, string> = {
                  "1ª Liga": "from-cyan-500/15 border-cyan-400/40 text-cyan-400",
                  "2ª Liga": "from-yellow-500/15 border-yellow-400/40 text-yellow-400",
                  "Distrital": "from-slate-500/15 border-slate-400/40 text-slate-400",
                };
                const colorSet = divColors[item.division] ?? "from-wc-green/15 border-wc-green/40 text-wc-green";
                const [bgClass, borderClass, textClass] = colorSet.split(" ");
                return (
                  <div key={item.id} className={`flex items-center gap-3 overflow-hidden rounded-2xl border bg-gradient-to-r ${bgClass} to-transparent px-4 py-3 ${borderClass}`}>
                    <span className="text-xl shrink-0">{isTop3 ? "⬆️" : "🏆"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {isTop3 ? "entrou no Top 3 da" : "subiu para a"}{" "}
                        <span className={`font-bold ${textClass}`}>{item.division}</span>
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo}</span>
                  </div>
                );
              }

              if (item.type === "exact") {
                return (
                  <div key={item.id} className="flex items-center gap-3 overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-r from-gold/12 to-transparent px-4 py-3">
                    <Zap className="h-5 w-5 text-gold shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{item.name} acertou o placard!</p>
                      <p className="text-xs text-muted-foreground">
                        {item.homeFlag} {item.home} <span className="font-bold text-foreground">{item.homeScore}–{item.awayScore}</span> {item.away} {item.awayFlag}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo}</span>
                  </div>
                );
              }

              if (item.type === "correct") {
                return (
                  <div key={item.id} className="flex items-center gap-3 overflow-hidden rounded-2xl border border-wc-green/25 bg-gradient-to-r from-wc-green/10 to-transparent px-4 py-3">
                    <CheckCircle2 className="h-5 w-5 text-wc-green shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{item.name} acertou</p>
                      <p className="text-xs text-muted-foreground">{item.homeFlag} {item.home} vs {item.away} {item.awayFlag}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo}</span>
                  </div>
                );
              }

              if (item.type === "streak") {
                return (
                  <div key={item.id} className="flex items-center gap-3 overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-500/12 to-transparent px-4 py-3">
                    <span className="text-xl shrink-0">🔥</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">streak de <span className="font-bold text-orange-400">{item.streak} jogos seguidos</span></p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo}</span>
                  </div>
                );
              }

              if (item.type === "prediction") {
                const resultLabel =
                  item.result90 === "home" ? item.home :
                  item.result90 === "away" ? item.away :
                  item.result90 === "draw" ? "empate" : null;
                if (!resultLabel && item.exactHome == null) return null;
                return (
                  <div key={item.id} className="flex items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card/60 px-4 py-3">
                    <span className="text-xl shrink-0">⚽</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        aposta em{" "}
                        <span className="font-semibold text-foreground">
                          {item.exactHome != null
                            ? `${item.home} ${item.exactHome}–${item.exactAway} ${item.away}`
                            : resultLabel}
                        </span>
                        {" "}· {item.home} vs {item.away}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo}</span>
                  </div>
                );
              }

              return null;
            })}
          </div>

          {feedShown < activityFeed.length && (
            <button
              ref={feedSentinelRef}
              onClick={() => setFeedShown(n => n + 6)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-border py-2.5 text-xs font-semibold text-muted-foreground transition-smooth hover:border-gold/40 hover:text-gold"
            >
              Ver mais <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </section>
      )}

      {user && following !== undefined && following.size === 0 && activityFeed.length === 0 && (
        <div className="mx-5 mt-4 md:mx-8">
          <div className="rounded-2xl border border-dashed border-border bg-card/40 px-5 py-4 text-center">
            <p className="text-sm font-semibold">A comunidade ainda não tem eventos recentes</p>
            <p className="text-xs text-muted-foreground mt-1">Segue adeptos no <Link to="/rankings" className="underline underline-offset-2">ranking</Link> para ver a sua atividade aqui</p>
          </div>
        </div>
      )}

      {/* ===================== JOGOS DE HOJE ===================== */}
      <section className="px-5 pt-8 md:px-8 relative">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl md:text-3xl text-gray-900">Jogos de Hoje</h2>
            <p className="text-xs text-gray-400">Dá a tua previsão antes do apito inicial.</p>
          </div>
          <Link to="/jogos" className="text-xs font-bold text-wc-red">Ver todos →</Link>
        </div>
        {todaysWithVoted.length === 0 ? (
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
                {todaysWithVoted.map((m) => (
                  <div key={m.id} style={{ scrollSnapAlign: "start", minWidth: "82vw", maxWidth: "82vw" }}>
                    <MatchCard match={m} />
                  </div>
                ))}
              </div>
              {/* Indicador de scroll */}
              {todaysWithVoted.length > 1 && (
                <div className="flex justify-center gap-1.5 pt-1">
                  {todaysWithVoted.map((_, i) => (
                    <div key={i} className={`h-1 rounded-full bg-gold/40 ${i === 0 ? "w-4 bg-gold/80" : "w-1.5"}`} />
                  ))}
                </div>
              )}
            </div>
            {/* Desktop — grid normal */}
            <div className="hidden md:grid gap-3 md:grid-cols-2">
              {todaysWithVoted.map((m) => <MatchCard key={m.id} match={m} />)}
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
                {(topLeaders as any[]).map((u, i) => (
                  <li key={i} className={`flex items-center justify-between px-5 py-3 ${i < topLeaders.length - 1 ? "border-b border-white/20" : ""}`}>
                    <span className="flex items-center gap-3">
                      <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                        i === 0 ? "bg-white text-wc-green" : "bg-white/20 text-white"
                      }`}>{i + 1}</span>
                      <Link to="/adepto/$id" params={{ id: u.id }} className="font-semibold text-sm hover:underline underline-offset-2">
                        {u.display_name ?? "Adepto"}
                      </Link>
                    </span>
                    <span className="font-display text-lg">{u.total_points} <span className="text-xs font-sans opacity-70">pts</span></span>
                  </li>
                ))}
                {(myLeaderRank || myLeaderEntry) && user && (
                  <>
                    <li className="px-5 py-1 text-center text-[10px] text-white/30 tracking-widest border-t border-white/10">· · ·</li>
                    <li className="flex items-center justify-between px-5 py-3 bg-white/10 border-t border-white/20">
                      <span className="flex items-center gap-3">
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-gold text-background text-xs font-bold">
                          {myLeaderEntry ? (topLeaders as any[]).indexOf(myLeaderEntry) + 1 : myLeaderRank?.rank}
                        </span>
                        <span className="font-semibold text-sm">{myLeaderEntry?.display_name ?? myLeaderRank?.display_name ?? "Tu"} <span className="text-[10px] text-gold font-bold">Tu</span></span>
                      </span>
                      <span className="font-display text-lg">{myLeaderEntry?.total_points ?? myLeaderRank?.total_points ?? 0} <span className="text-xs font-sans opacity-70">pts</span></span>
                    </li>
                  </>
                )}
              </ol>
            )}
            <Link
              to="/rankings"
              className="flex items-center justify-center gap-1.5 border-t border-white/20 px-5 py-3 text-xs font-semibold text-white/70 hover:text-white transition-smooth"
            >
              Ver classificação completa →
            </Link>
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
              <Link to="/rankings" search={{ tab: "ligas" } as any} className="text-xs font-bold text-white/80 hover:text-white">Ver todos →</Link>
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
                  <Link to="/rankings" search={{ tab: "ligas" } as any} className="text-xs font-bold text-white/60 hover:text-white transition-smooth">
                    Ver ranking completo de torneios →
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
        <div className="mb-5 flex items-end justify-between">
          <h2 className="font-display text-2xl md:text-3xl">Como funciona</h2>
          <Link to="/como-funciona" className="text-xs font-semibold text-gold hover:text-gold/70 transition-smooth">
            Guia completo →
          </Link>
        </div>

        {/* 3 passos */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Step n="1" title="Vê os jogos">Consulta os jogos do dia e escolhe os que te interessam.</Step>
          <Step n="2" title="Deixa a tua previsão">Vota nos mercados que quiseres até ao apito inicial.</Step>
          <Step n="3" title="Compete e sobe">Soma pontos e sobe no ranking — geral ou entre amigos.</Step>
        </div>

        {/* Pontos rápidos */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Resultado 1X2",    pts: "3–4 pts" },
            { label: "Marcador exacto",  pts: "10 pts 🔥" },
            { label: "BTTS / Golos",     pts: "2–3 pts" },
            { label: "Combo especial",   pts: "4–5 pts" },
          ].map(({ label, pts }) => (
            <div key={label} className="rounded-xl border border-border bg-card/60 px-3 py-2.5 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className="mt-0.5 font-display text-sm text-gold">{pts}</p>
            </div>
          ))}
        </div>

        {/* CTA final na secção — só para visitantes */}
        {!user && (
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-gold/30 bg-gold/5 p-5">
            <div className="flex items-start gap-3">
              <Users2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <p className="text-sm text-muted-foreground">
                Depois de votares desbloqueias as percentagens da comunidade — o que toda a gente palpitou. <span className="font-semibold text-foreground">O segredo é do clube.</span>
              </p>
            </div>
            <Link to="/auth"
              className="shrink-0 rounded-xl bg-wc-red px-5 py-2.5 text-sm font-bold text-white shadow-gold transition-smooth hover:scale-[1.01] active:scale-95 text-center whitespace-nowrap">
              Entrar grátis →
            </Link>
          </div>
        )}

      </section>

      {/* ===================== NOTÍCIAS EM DESTAQUE ===================== */}
      {featuredNewsList.length > 0 && (
        <section className="px-5 pt-10 pb-2 md:px-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl md:text-3xl">Últimas Notícias</h2>
            <Link to="/noticias" search={{} as any} className="text-xs font-semibold text-gold hover:text-gold/80 transition-smooth">
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <NewsCategory category={main.category} />
                        <h3 className="mt-1.5 font-display text-xl md:text-2xl leading-snug text-white drop-shadow line-clamp-2">{main.title}</h3>
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

          <Link to="/noticias" search={{} as any}
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

function ResultCard({ r, mobile = false }: { r: any; mobile?: boolean }) {
  const isExact = r.isExact;
  const isCorrect = r.isCorrect;
  const datePart = new Date(r.kickoff_at).toLocaleDateString("pt-PT", { day: "numeric", month: "short" });

  return (
    <Link
      to="/jogo/$id"
      params={{ id: r.id }}
      style={mobile ? { scrollSnapAlign: "start", minWidth: "72vw", maxWidth: "72vw" } : undefined}
      className={`group relative shrink-0 md:shrink flex flex-col overflow-hidden rounded-2xl border px-4 py-4 transition-smooth hover:scale-[1.01] ${
        isExact
          ? "border-gold/50 bg-gradient-to-br from-gold/15 via-gold/5 to-transparent"
          : isCorrect
            ? "border-wc-green/40 bg-gradient-to-br from-wc-green/12 via-wc-green/4 to-transparent"
            : "border-border bg-card/60"
      }`}
    >
      {/* Top: badge + date */}
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
          isExact
            ? "bg-gold/20 text-gold border border-gold/30"
            : isCorrect
              ? "bg-wc-green/20 text-wc-green border border-wc-green/30"
              : "bg-muted text-muted-foreground border border-border"
        }`}>
          {isExact ? <Zap className="h-2.5 w-2.5" /> : isCorrect ? <CheckCircle2 className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
          {isExact ? "Placard exato" : isCorrect ? "Acertei" : "Errei"}
        </span>
        <span className="text-[10px] text-muted-foreground">{datePart}</span>
      </div>

      {/* Teams row */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <span className="text-2xl leading-none shrink-0">{r.home?.flag ?? "🏳️"}</span>
          <span className="text-sm font-semibold truncate text-foreground">{r.home?.name}</span>
        </div>
        <div className={`shrink-0 rounded-xl px-3 py-1 font-display text-xl text-foreground ${
          isExact ? "bg-gold/15" : isCorrect ? "bg-wc-green/15" : "bg-muted"
        }`}>
          {r.home_score}–{r.away_score}
        </div>
        <div className="flex flex-1 items-center gap-2 min-w-0 justify-end">
          <span className="text-sm font-semibold truncate text-foreground text-right">{r.away?.name}</span>
          <span className="text-2xl leading-none shrink-0">{r.away?.flag ?? "🏳️"}</span>
        </div>
      </div>

      {/* Points / Ver jogo */}
      <div className="flex items-center justify-between mt-auto">
        {(r.pred.points ?? 0) > 0 ? (
          <span className={`text-sm font-bold ${isExact ? "text-gold" : "text-wc-green"}`}>
            +{r.pred.points} pts
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">0 pts</span>
        )}
        <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-smooth">Ver jogo →</span>
      </div>
    </Link>
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
