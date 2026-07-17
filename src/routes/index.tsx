import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, BarChart3, Users2, Users, Sparkles, Timer, TrendingUp, CheckCircle2, XCircle, Zap, ChevronRight, Target, AlertTriangle, Trophy, Share2, Swords } from "lucide-react";
import { ShareButton, usePodiumShare, useRankShare } from "@/components/ShareCard";

import { TeamBadge } from "@/lib/teamColors.tsx";
import { supabase } from "@/integrations/supabase/client";
import { MatchCard, type MatchCardData } from "@/components/MatchCard";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import { useAuth } from "@/lib/useAuth";
import { useFollowing } from "@/lib/useFollow";
import trophyImg from "@/assets/trophy-hero.jpg";
// Substitui este ficheiro por src/assets/premio-camisola.jpg (a imagem da camisola)
import premioCamisola from "@/assets/premio-camisola.jpg";

const SITE = "https://geracao2026.com";

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

  const { data: myStreak } = useQuery({
    queryKey: ["my-streak", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("predictions_made,predictions_correct")
        .eq("id", user!.id)
        .maybeSingle();
      // Contagem real de todos os jogos votados (inclui fase de grupos)
      const { count } = await supabase
        .from("predictions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return { ...data, predictions_made: count ?? data?.predictions_made ?? 0 };
    },
  });

  const { data: communityPulse } = useQuery({
    queryKey: ["community-pulse"],
    staleTime: 60_000,
    queryFn: async () => {
      const today = new Date(); today.setHours(0,0,0,0);
      const { count: todayVotes } = await supabase
        .from("predictions")
        .select("id", { count: "exact", head: true })
        .gte("created_at", today.toISOString());
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });
      return { todayVotes: todayVotes ?? 0, totalUsers: totalUsers ?? 0 };
    },
  });

  const { data: grupHof = [] } = useQuery({
    queryKey: ["hof", "grupos"],
    queryFn: async () => {
      const { data: hof } = await (supabase as any)
        .from("hall_of_fame")
        .select("rank,total_points,user_id")
        .eq("phase", "grupos")
        .order("rank");
      if (!hof || hof.length === 0) return [];
      const userIds = hof.map((h: any) => h.user_id);
      const { data: profiles } = await supabase
        .from("profiles").select("id,display_name,avatar_url").in("id", userIds);
      const pm = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));
      return hof.map((h: any) => ({ ...h, profile: pm[h.user_id] }));
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
        { label: "1ª Liga",            emoji: "🏆", min: 1,  max: 10,  border: "border-cyan-400/40",    bg: "bg-cyan-400/10",    text: "text-cyan-400" },
        { label: "2ª Liga",            emoji: "⚽", min: 11, max: 25,  border: "border-yellow-400/40",  bg: "bg-yellow-400/10",  text: "text-yellow-400" },
        { label: "Distrital",          emoji: "🟡", min: 26, max: 50,  border: "border-slate-400/40",   bg: "bg-slate-400/10",   text: "text-slate-400" },
        { label: "Liga do Zé Povinho", emoji: "🟢", min: 51, max: Infinity, border: "border-green-700/40", bg: "bg-green-700/10", text: "text-green-600" },
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
      const { data: finished } = await supabase
        .from("matches")
        .select("id,kickoff_at,phase,home_score,away_score,qualifier,home:home_team_id(name,flag,code),away:away_team_id(name,flag,code)")
        .not("home_score", "is", null)
        .neq("phase", "grupos")
        .order("kickoff_at", { ascending: false })
        .limit(40);
      if (!finished?.length) return [];
      const { data: preds } = await supabase
        .from("predictions")
        .select("match_id,points,exact_home,exact_away,result_90,btts,total_25,double_chance,combo_15,qualifier")
        .eq("user_id", user!.id)
        .in("match_id", (finished as any[]).map(m => m.id));
      const predMap = Object.fromEntries(((preds ?? []) as any[]).map(p => [p.match_id, p]));
      return (finished as any[])
        .map(m => {
          const pred = predMap[m.id] ?? null;
          const isExact = pred ? pred.exact_home === m.home_score && pred.exact_away === m.away_score : false;
          const isCorrect = (pred?.points ?? 0) > 0;
          return { ...m, pred, isExact, isCorrect, noVote: !pred };
        });
    },
    staleTime: 120_000,
  });

  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [resultsExpanded, setResultsExpanded] = useState(false);
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

  // Jogo da final (kickoff mais tardio da fase 'final' = a final; o outro é o 3º lugar)
  const { data: finalMatch } = useQuery({
    queryKey: ["matches", "final"],
    staleTime: 300_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("matches")
        .select("id,kickoff_at")
        .eq("phase", "final")
        .order("kickoff_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const { share: shareRank, Portal: RankSharePortal } = useRankShare({
    displayName: myLeaderRank?.display_name ?? myLeaderEntry?.display_name ?? "Tu",
    rank: myLeaderEntry ? (topLeaders as any[]).indexOf(myLeaderEntry) + 1 : myLeaderRank?.rank ?? 1,
    totalPoints: myLeaderEntry?.total_points ?? myLeaderRank?.total_points ?? 0,
    totalUsers: communityPulse?.totalUsers ?? 0,
    division: myDivision?.label ?? "1ª Liga",
    phase: "Mata-Mata",
  });

  return (
    <div className="pb-10">
      {RankSharePortal}

      {/* ===================== HERO ===================== */}
      <section className="relative px-4 pt-4 md:px-6 md:pt-5 animate-fade-in">
        <div
          className="relative overflow-hidden rounded-3xl"
          style={{
            background: "linear-gradient(135deg, oklch(0.30 0.12 142) 0%, oklch(0.22 0.10 142) 55%, oklch(0.18 0.06 165) 100%)",
            boxShadow: "0 16px 48px oklch(0.55 0.20 142 / 0.35), 0 0 0 1px oklch(1 0 0 / 0.08)",
            minHeight: "220px",
          }}
        >
          {/* Shimmer sweep */}
          <div className="hero-shimmer rounded-3xl" />

          {/* Pitch grid subtle overlay */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 39px, oklch(1 0 0) 39px, oklch(1 0 0) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, oklch(1 0 0) 39px, oklch(1 0 0) 40px)" }} />

          {/* Trophy — right side, bleeds off */}
          <div className="absolute right-0 top-0 h-full w-[44%] md:w-[38%] pointer-events-none select-none"
            style={{ maskImage: "linear-gradient(to left, black 40%, transparent 100%)" }}>
            <img src={trophyImg} alt="" className="h-full w-full object-cover object-center scale-110 trophy-shine" />
          </div>

          {/* Red glow behind trophy */}
          <div className="absolute right-[10%] top-1/2 -translate-y-1/2 h-48 w-48 rounded-full pointer-events-none"
            style={{ background: "oklch(0.75 0.18 85 / 0.20)", filter: "blur(48px)" }} />

          {/* Green corner accent */}
          <div className="absolute bottom-0 left-0 h-14 w-14 md:h-18 md:w-18 bg-gold/60" style={{ borderTopRightRadius: "36px" }} />

          {/* Content */}
          <div className="relative px-5 py-5 md:px-10 md:py-7 pr-[46%] md:pr-[42%]">
            {/* Live badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-wc-red opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-wc-red" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">Mundial 2026 · Final</span>
            </div>

            {/* Title */}
            <h1 className="font-display leading-none text-gold-metallic" style={{ fontSize: "clamp(2.8rem,9vw,5.5rem)" }}>
              UMA<br />GERAÇÃO
            </h1>

            {/* Personal stat or tagline */}
            {user && myDivision ? (
              <div className="mt-4 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold backdrop-blur-sm ${myDivision.border} ${myDivision.bg} ${myDivision.text}`}>
                    {myDivision.emoji} {myDivision.label}
                  </span>
                  <span className="text-xs font-bold text-white/60">
                    #{myDivision.rank}º global
                  </span>
                </div>
                <p className="font-display text-2xl text-white leading-none">
                  {myDivision.points} <span className="text-sm font-sans text-white/50 font-semibold">pontos</span>
                </p>
              </div>
            ) : (
              <p className="mt-3 text-xs font-semibold text-white/70 leading-snug">
                {user ? "Vota, compara e vibra." : "Convida os teus amigos e vê quem manda."}
              </p>
            )}

            {/* CTA */}
            <div className="mt-4 flex flex-col gap-2">
              {user ? (
                <Link to="/jogos"
                  className="inline-flex w-fit items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-xs font-bold text-background shadow-gold transition-smooth hover:scale-[1.03] active:scale-95">
                  Votar agora <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <>
                  <Link to="/auth"
                    className="inline-flex w-fit items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-xs font-bold text-background shadow-gold transition-smooth hover:scale-[1.03] active:scale-95">
                    Entrar grátis <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Stats bar — real data */}
          <div className="relative grid grid-cols-3 border-t border-white/8"
            style={{ background: "oklch(1 0 0 / 0.04)" }}>
            {[
              { label: "Previsões hoje", value: (communityPulse?.todayVotes ?? 0) > 0 ? communityPulse!.todayVotes.toLocaleString("pt-PT") : "—", live: true },
              { label: "Adeptos", value: (communityPulse?.totalUsers ?? 0) > 0 ? communityPulse!.totalUsers.toLocaleString("pt-PT") : "—", live: false },
              { label: "Jogos", value: "104", live: false },
            ].map((s, i) => (
              <div key={s.label} className={`py-3 text-center text-white animate-stat-pop ${i === 1 ? "border-x border-white/8" : ""}`}
                style={{ animationDelay: `${i * 80}ms` }}>
                <div className="flex items-center justify-center gap-1.5 font-display text-xl md:text-2xl leading-none">
                  {s.live && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-wc-green opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-wc-green" />
                    </span>
                  )}
                  {s.value}
                </div>
                <div className="text-[10px] uppercase tracking-widest opacity-40 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile CTA only for guests */}
        {!user && (
          <div className="flex gap-3 pt-4 md:hidden">
            <Link to="/auth" className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-wc-red py-3 text-sm font-bold text-white shadow-gold transition-smooth active:scale-95">
              Entrar grátis <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="inline-flex items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-xs font-bold text-gold">
              🏆 +100 membros
            </div>
          </div>
        )}
      </section>

      {/* ===================== A GRANDE FINAL ===================== */}
      <div className="mx-5 mt-4 md:mx-8 animate-enter delay-100">
        <Link {...(finalMatch ? { to: "/jogo/$id" as const, params: { id: finalMatch.id } } : { to: "/jogos" as const })}
          className="group block relative overflow-hidden rounded-3xl border border-gold/40 transition-smooth hover:border-gold/70"
          style={{ background: "radial-gradient(ellipse 120% 90% at 50% -20%, oklch(0.30 0.08 85) 0%, oklch(0.15 0.03 265) 55%, oklch(0.11 0.02 265) 100%)", boxShadow: "0 10px 40px oklch(0.75 0.18 85 / 0.22), inset 0 1px 0 oklch(1 0 0 / 0.08)" }}>
          {/* Glow central atrás do troféu */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: "oklch(0.75 0.18 85 / 0.14)", filter: "blur(52px)" }} />
          {/* Linhas de campo decorativas */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: "radial-gradient(circle at 50% 130%, transparent 39%, white 40%, transparent 41%), linear-gradient(white 1px, transparent 1px)", backgroundSize: "100% 100%, 100% 33.3%" }} />

          <div className="relative px-5 pt-5 pb-4">
            {/* Chip data */}
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gold backdrop-blur-sm">
                Domingo · 19 Jul · 20h00
              </span>
            </div>

            {/* Título */}
            <div className="mt-3 text-center">
              <span className="text-3xl leading-none">🏆</span>
              <h2 className="mt-1 font-display text-gold-metallic leading-none" style={{ fontSize: "clamp(1.9rem, 7vw, 3rem)", letterSpacing: "0.02em" }}>
                A GRANDE FINAL
              </h2>
            </div>

            {/* Confronto */}
            <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <span className="text-5xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-110">🇪🇸</span>
                <span className="text-sm font-bold text-white">Espanha</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="grid h-10 w-10 place-items-center rounded-full border border-gold/50 bg-gold/15 font-display text-sm text-gold shadow-gold">VS</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-5xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-110">🇦🇷</span>
                <span className="text-sm font-bold text-white">Argentina</span>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-4 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-xl bg-gold px-6 py-2.5 text-xs font-bold text-background shadow-gold transition-smooth group-hover:scale-[1.04]">
                Dar a minha previsão <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>

            {/* 3º lugar */}
            <p className="mt-3 text-center text-[11px] text-white/50">
              Sábado 22h00 · 3º lugar: 🇫🇷 França vs Inglaterra 🏴󠁧󠁢󠁥󠁮󠁧󠁿
            </p>
          </div>
        </Link>
      </div>

      {/* ===================== A TUA JORNADA — obrigado ===================== */}
      {user && myDivision && (myStreak?.predictions_made ?? 0) > 0 && (
        <div className="mx-5 mt-4 md:mx-8 animate-enter delay-150">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
            <div className="h-1 w-full wc-tricolor" />
            <div className="px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-1">A tua jornada no Mundial 2026</p>
              <p className="font-display text-lg leading-snug">Obrigado por fazeres parte desta Geração 🙏</p>
              <p className="text-xs text-muted-foreground mt-1">Desde a fase de grupos até à final — isto foi o que construíste:</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(() => {
                  const best = [...myResults].filter((r: any) => !r.noVote).sort((x: any, y: any) => (y.pred?.points ?? 0) - (x.pred?.points ?? 0))[0];
                  const stats = [
                    { label: "Pontos", value: String(myDivision.points), gold: true },
                    { label: "Posição global", value: `#${myDivision.rank}º`, gold: false },
                    { label: "Jogos votados", value: String(myStreak?.predictions_made ?? 0), gold: false },
                    { label: "Melhor jogo", value: best ? `+${best.pred?.points ?? 0}` : "—", sub: best ? `${best.home?.flag} vs ${best.away?.flag}` : "", gold: true },
                  ];
                  return stats.map(s => (
                    <div key={s.label} className="rounded-xl border border-border/60 bg-background/40 px-3 py-2.5 text-center">
                      <p className={`font-display text-xl leading-none ${s.gold ? "text-gold" : "text-foreground"}`}>{s.value}{(s as any).sub && <span className="ml-1 text-xs">{(s as any).sub}</span>}</p>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{s.label}</p>
                    </div>
                  ));
                })()}
              </div>
              <button
                onClick={async () => {
                  const best = [...myResults].filter((r: any) => !r.noVote).sort((x: any, y: any) => (y.pred?.points ?? 0) - (x.pred?.points ?? 0))[0];
                  const text = `⚽ A minha jornada no Mundial 2026 na Geração 2026:\n🏆 ${myDivision.points} pontos · #${myDivision.rank}º global\n🎯 ${myStreak?.predictions_made ?? 0} jogos votados${best ? `\n🔥 Melhor jogo: +${best.pred?.points} pts` : ""}\n\nJunta-te: https://geracao2026.com`;
                  if (navigator.share) { await navigator.share({ text }).catch(() => {}); }
                  else { await navigator.clipboard.writeText(text).catch(() => {}); }
                }}
                className="mt-3 w-full rounded-xl border border-gold/30 bg-gold/10 py-2.5 text-xs font-bold text-gold transition-smooth hover:bg-gold/20">
                <Share2 className="mr-1.5 inline h-3.5 w-3.5" /> Partilhar a minha jornada
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MY POINTS PER MATCH ===================== */}
      {user && myResults.length > 0 && (
        <div className="mx-5 mt-4 md:mx-8 animate-enter delay-100">
          <div className="overflow-hidden rounded-2xl border border-gold/30 bg-card"
            style={{ boxShadow: "0 2px 16px oklch(0.75 0.18 85 / 0.10), 0 0 0 1px oklch(0.75 0.18 85 / 0.20)" }}>
            {/* Gold stripe */}
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, transparent 0%, oklch(0.75 0.18 85) 50%, transparent 100%)" }} />
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Swords className="h-3.5 w-3.5 text-gold" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-gold">Os meus pontos</span>
              </div>
              {myDivision && (
                <span className="font-display text-sm text-gold-metallic">{myDivision.points} pts</span>
              )}
            </div>
            {/* Match rows */}
            <div className="divide-y divide-border/40">
              {(resultsExpanded ? myResults : myResults.slice(0, 5)).map((m: any) => {
                const pts = m.pred?.points ?? 0;
                return (
                  <button key={m.id} onClick={() => !m.noVote && setSelectedResult(m)}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-smooth text-left ${m.noVote ? "opacity-70 cursor-default" : "hover:bg-gold/5"}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-sm">
                        <span>{m.home?.flag}</span>
                        <span className="font-semibold text-foreground truncate">{m.home?.name}</span>
                        <span className="shrink-0 rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-bold text-foreground tabular-nums">
                          {m.home_score}–{m.away_score}
                        </span>
                        <span className="font-semibold text-foreground truncate">{m.away?.name}</span>
                        <span>{m.away?.flag}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {m.noVote ? (
                        <div className="rounded-xl px-3 py-1 text-[11px] font-bold bg-muted text-muted-foreground/50 border border-border">
                          Não votaste · 0 pts
                        </div>
                      ) : (
                        <>
                          <span className="text-[10px] font-semibold text-muted-foreground/50">Ver detalhe</span>
                          <div className={`rounded-xl px-3 py-1 text-sm font-bold tabular-nums ${
                            pts > 0 ? "bg-gold/15 text-gold border border-gold/30" : "bg-muted text-muted-foreground/40 border border-border"
                          }`}>
                            {pts > 0 ? `+${pts}` : "—"}
                          </div>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {/* Expand / collapse */}
            {myResults.length > 5 && (
              <button onClick={() => setResultsExpanded(v => !v)}
                className="w-full border-t border-border/60 py-2.5 text-xs font-bold text-gold hover:bg-gold/5 transition-smooth">
                {resultsExpanded ? "Mostrar menos ↑" : `Ver todos os jogos (${myResults.length}) ↓`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ===================== MATCH BREAKDOWN DRAWER ===================== */}
      {selectedResult && <MatchBreakdownDrawer match={selectedResult} onClose={() => setSelectedResult(null)} />}

      {/* ===================== PRÉ-REGISTO NOVA ÉPOCA ===================== */}
      <SeasonPreRegModal user={user} />

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
                      {(() => {
                        const mins = Math.max(0, Math.round((new Date(m.kickoff_at).getTime() - Date.now()) / 60000) - 5);
                        const closingSoon = mins <= 180;
                        const label = closingSoon
                          ? (mins < 60 ? `⏰ Fecha em ${mins}min` : `⏰ Fecha em ${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, "0")}`)
                          : isToday ? `Hoje ${time}` : `Amanhã ${time}`;
                        return (
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${closingSoon ? "bg-wc-red text-white animate-pulse" : "bg-white/20 text-white"}`}>
                            {label}
                          </span>
                        );
                      })()}
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


      {/* ===================== COUNTDOWN + CTA ===================== */}
      <div className={`mx-5 mt-4 md:mx-8 ${nextMatch && !user ? "grid gap-3 sm:grid-cols-2" : ""}`}>
        {nextMatch && (
          <Countdown id={nextMatch.id} kickoff_at={nextMatch.kickoff_at} home={(nextMatch as any).home} away={(nextMatch as any).away} />
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


      {/* ===================== PÓDIO FASE DE GRUPOS ===================== */}
      <PodioFaseGrupos hof={grupHof} />

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
                to="/noticias/"
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

      {/* ===================== NOTIFICAÇÕES PUSH ===================== */}
      <PushNotificationPrompt />



      {/* ===================== FEED DA COMUNIDADE ===================== */}
      {activityFeed.length > 0 && (
        <section className="px-5 pt-6 md:px-8">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl">Comunidade</h2>
              {following && following.size === 0 && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Global</span>
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
                      <span className="flex items-center gap-2">
                        <button onClick={shareRank} title="Partilhar classificação" className="grid h-7 w-7 place-items-center rounded-full bg-white/15 text-white hover:bg-white/30 transition-smooth">
                          <Share2 className="h-3.5 w-3.5" />
                        </button>
                        <span className="font-display text-lg">{myLeaderEntry?.total_points ?? myLeaderRank?.total_points ?? 0} <span className="text-xs font-sans opacity-70">pts</span></span>
                      </span>
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

      {/* ===================== COMO FUNCIONA — apenas para visitantes ===================== */}
      {!user && <section id="como-funciona" className="px-5 pt-12 md:px-8">
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

      </section>}

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
    <p className={`font-bold uppercase tracking-widest ${small ? "text-[10px]" : "text-[10px]"} ${c.cls}`}>
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

function PodioFaseGrupos({ hof }: { hof: any[] }) {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem("podio_grupos_dismissed") === "1"; } catch { return false; }
  });

  const [first, second, third] = hof ?? [];

  const { share: sharePodium, Portal: SharePortal } = usePodiumShare({
    first: first ? { display_name: first.profile?.display_name, avatar_url: first.profile?.avatar_url, total_points: first.total_points } : { display_name: "—", total_points: 0 },
    second: second ? { display_name: second.profile?.display_name, avatar_url: second.profile?.avatar_url, total_points: second.total_points } : null,
    third: third ? { display_name: third.profile?.display_name, avatar_url: third.profile?.avatar_url, total_points: third.total_points } : null,
    phase: "Fase de Grupos",
  });

  if (!hof || hof.length === 0 || dismissed) return null;

  function dismiss() {
    try { localStorage.setItem("podio_grupos_dismissed", "1"); } catch {}
    setDismissed(true);
  }

  // visual order: 2nd left · 1st center · 3rd right
  const entries  = [second, first, third];
  const hofIdx   = [1, 0, 2];

  const podiumH  = ["h-20", "h-28", "h-14"];
  const avatarSz = ["h-12 w-12", "h-16 w-16", "h-10 w-10"];
  const medals   = ["🥈", "🥇", "🥉"];

  const podiumBg = [
    // silver
    "from-[#C0C0C0] to-[#8a8a8a]",
    // gold
    "from-[#FFD700] to-[#B8860B]",
    // bronze
    "from-[#CD7F32] to-[#7a4a1e]",
  ];

  const borderColor = [
    "border-[#C0C0C0]/60",
    "border-[#FFD700]/80",
    "border-[#CD7F32]/50",
  ];

  const nameFg = ["text-foreground", "text-[#7a5500]", "text-foreground"];

  return (
    <>
    {SharePortal}
    <div className="mx-5 mt-5 md:mx-8">
      <div
        className="relative overflow-hidden rounded-3xl"
        style={{
          background: "linear-gradient(160deg, #e8f4e8 0%, #dceeff 50%, #fff8e1 100%)",
          border: "1px solid rgba(255,215,0,0.35)",
          boxShadow: "0 6px 36px -8px rgba(180,130,0,0.22), 0 1px 0 rgba(255,255,255,0.9) inset",
        }}
      >
        {/* top colour bar: WC green → WC blue → gold */}
        <div className="h-1.5 w-full rounded-t-3xl" style={{ background: "linear-gradient(90deg, #3a7d44 0%, #1a3580 50%, #c8960c 100%)" }} />

        {/* Dismiss button */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/10 text-foreground/40 hover:bg-black/20 hover:text-foreground/70 transition-smooth"
          title="Esconder pódio"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        {/* confetti-style scattered dots */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(circle, #1a3580 1px, transparent 1px)", backgroundSize: "22px 22px" }}
        />

        {/* soft glow behind the 1st-place column */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 -translate-x-1/2 -top-6 h-40 w-56 rounded-full blur-3xl opacity-30" style={{ background: "radial-gradient(circle, #FFD700 0%, transparent 70%)" }} />
        </div>

        <div className="relative px-5 pt-5 pb-0">
          {/* Header */}
          <div className="text-center mb-5">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#3a7d44" }}>Fase de Grupos · Resultado Final</p>
            <h2 className="font-display text-2xl leading-tight text-[#0d1a3a]">Pódio da Fase de Grupos</h2>
            {first?.profile && (
              <p className="mt-1.5 text-sm text-[#333]">
                Parabéns ao campeão{" "}
                <span className="font-bold" style={{ color: "#c8960c" }}>{first.profile.display_name}</span>! 🎉
              </p>
            )}
          </div>

          {/* Podium columns */}
          <div className="flex items-end justify-center gap-2">
            {entries.map((entry, vi) => {
              if (!entry) return <div key={vi} className="flex-1 max-w-[120px]" />;
              const hi = hofIdx[vi];
              const isWinner = hi === 0;
              return (
                <div key={vi} className="flex-1 max-w-[140px] flex flex-col items-center">
                  {/* Avatar */}
                  <div className={`relative mb-2 ${isWinner ? "drop-shadow-lg" : ""}`}>
                    {entry.profile?.avatar_url ? (
                      <img
                        src={entry.profile.avatar_url}
                        alt=""
                        className={`${avatarSz[vi]} rounded-full object-cover border-2 ${isWinner ? "border-[#FFD700]" : "border-white/60"} shadow-md`}
                      />
                    ) : (
                      <div
                        className={`${avatarSz[vi]} rounded-full border-2 ${isWinner ? "border-[#FFD700]" : "border-white/60"} shadow-md flex items-center justify-center font-display text-lg`}
                        style={{ background: isWinner ? "linear-gradient(135deg,#3a7d44,#1a3580)" : "linear-gradient(135deg,#ccc,#888)" }}
                      >
                        <span className="text-white">{entry.profile?.display_name?.[0] ?? "?"}</span>
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 text-lg leading-none">{medals[vi]}</span>
                  </div>

                  {/* Name */}
                  <p className={`text-center text-[11px] font-bold leading-tight mb-0.5 ${nameFg[vi]}`}>{entry.profile?.display_name ?? "—"}</p>

                  {/* Points */}
                  <p className="text-center text-[10px] text-[#555] mb-2">
                    <span className="font-bold text-[#0d1a3a]">{entry.total_points}</span> pts
                  </p>

                  {/* Podium block */}
                  <div
                    className={`w-full ${podiumH[vi]} rounded-t-xl border-t-2 border-x-2 ${borderColor[vi]} bg-gradient-to-b ${podiumBg[vi]} flex items-center justify-center shadow-inner`}
                  >
                    <span className="font-display font-bold text-white text-2xl drop-shadow">{hi + 1}º</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Share button */}
          <div className="flex justify-center pb-5 pt-3">
            <ShareButton onShare={sharePodium} label="Partilhar Pódio" />
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

const DEADLINE = new Date("2026-06-28T23:59:00");

function PremioFaseGrupos({ leader }: { leader: any }) {
  const [diff, setDiff] = useState(DEADLINE.getTime() - Date.now());
  useEffect(() => {
    const t = setInterval(() => setDiff(DEADLINE.getTime() - Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (diff <= 0) return null; // esconde após o prazo

  const totalHours = Math.floor(diff / 3600000);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const mins = Math.floor((diff % 3600000) / 60000);

  return (
    <div className="mx-5 mt-5 md:mx-8">
      <div
        className="relative overflow-hidden rounded-3xl"
        style={{
          background: "linear-gradient(135deg, oklch(0.97 0.010 142) 0%, oklch(0.97 0.012 250) 50%, oklch(0.97 0.014 95) 100%)",
          border: "1px solid oklch(0.88 0.03 142)",
          boxShadow: "0 4px 32px -8px oklch(0.55 0.20 142 / 0.18), 0 1px 0 oklch(1 0 0 / 0.8) inset",
        }}
      >
        {/* Green → Blue → Gold top bar */}
        <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, oklch(0.55 0.20 142) 0%, oklch(0.40 0.18 265) 50%, oklch(0.75 0.18 85) 100%)" }} />

        {/* Soft color washes */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-12 -left-12 h-56 w-56 rounded-full opacity-[0.12]" style={{ background: "radial-gradient(circle, oklch(0.55 0.20 142) 0%, transparent 70%)" }} />
          <div className="absolute -bottom-16 left-1/3 h-64 w-64 rounded-full opacity-[0.08]" style={{ background: "radial-gradient(circle, oklch(0.40 0.18 265) 0%, transparent 70%)" }} />
          <div className="absolute -top-6 right-4 h-44 w-44 rounded-full opacity-[0.10]" style={{ background: "radial-gradient(circle, oklch(0.75 0.18 85) 0%, transparent 70%)" }} />
        </div>

        <div className="relative grid md:grid-cols-[1fr_auto] gap-0">

          {/* ── Coluna esquerda: texto ── */}
          <div className="p-6 md:p-8">

            {/* Label */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-wc-green/40 bg-wc-green/12 px-3 py-1">
              <Trophy className="h-3.5 w-3.5 text-wc-green" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-wc-green">Prémio — Fase de Grupos</span>
            </div>

            {/* Texto de agradecimento */}
            <div className="mb-5 rounded-2xl border border-wc-green/25 bg-wc-green/6 px-5 py-4" style={{ borderLeft: "3px solid oklch(0.55 0.20 142)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-wc-green mb-2">Uma mensagem da equipa</p>
              <p className="text-foreground text-sm leading-relaxed font-medium mb-1.5">
                <span className="font-bold">A fase de grupos está a chegar ao fim...</span> e queremos agradecer a todos os que fizeram parte desta caminhada.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Cada voto, cada previsão e cada visita ajudaram a transformar esta comunidade em algo muito maior do que imaginávamos.
              </p>
            </div>

            {/* Aviso reset */}
            <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-50/60 px-4 py-3.5 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700">O que muda no Mata-Mata</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                🔄 <span className="text-foreground font-semibold">Os pontos voltam a zero</span> — todos começam de novo na fase a eliminar.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                🏆 <span className="text-foreground font-semibold">Os torneios privados também fazem reset</span> — poderás escolher a duração antes de começar.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ⚡ <span className="text-foreground font-semibold">O mata-mata começa a 29 de junho</span> — prepara-te para uma nova corrida!
              </p>
            </div>

            {/* Countdown */}
            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Fase de grupos termina em</p>
              <div className="flex items-end gap-2">
                {[
                  { v: days, label: days === 1 ? "dia" : "dias" },
                  { v: hours, label: hours === 1 ? "hora" : "horas" },
                  { v: mins, label: "min" },
                ].map(({ v, label }, i) => (
                  <div key={label} className="flex items-end gap-2">
                    {i > 0 && <span className="font-display text-3xl text-wc-green/30 mb-1">:</span>}
                    <div className="text-center">
                      <div
                        className="font-display text-4xl md:text-5xl leading-none tabular-nums px-3 py-1 rounded-xl"
                        style={{
                          color: "oklch(0.55 0.20 142)",
                          background: "oklch(0.55 0.20 142 / 0.08)",
                          border: "1px solid oklch(0.55 0.20 142 / 0.20)",
                        }}
                      >
                        {String(v).padStart(2, "0")}
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-2">
              <Link
                to="/rankings"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white/60 px-4 py-2.5 text-sm font-bold text-muted-foreground transition-smooth hover:border-wc-blue/30 hover:text-foreground"
              >
                Ver ranking →
              </Link>
              <Link
                to="/jogos"
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-smooth hover:scale-[1.02] active:scale-95"
                style={{ background: "oklch(0.55 0.20 142)", boxShadow: "0 4px 16px -4px oklch(0.55 0.20 142 / 0.4)" }}
              >
                Votar agora <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* ── Coluna direita: prémio ── */}
          <div
            className="relative flex flex-col items-center justify-between border-t border-border md:border-t-0 md:border-l p-6 md:p-8 md:min-w-[260px]"
            style={{ background: "oklch(0.55 0.20 142 / 0.04)" }}
          >
            <div className="text-center mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Prémio para o</p>
              <p className="font-display text-2xl text-wc-blue leading-none">1º Classificado</p>
              <p className="text-xs text-muted-foreground mt-0.5">Ranking Geral · Fase de Grupos</p>
            </div>

            {/* Imagem da camisola */}
            <div className="relative my-2">
              <div className="absolute inset-0 rounded-full opacity-30 blur-2xl" style={{ background: "radial-gradient(circle, oklch(0.75 0.18 85 / 0.5) 0%, oklch(0.55 0.20 142 / 0.3) 60%, transparent 100%)" }} />
              <img
                src={premioCamisola}
                alt="Camisola de Portugal — prémio"
                className="relative h-48 w-48 object-contain"
                style={{ filter: "drop-shadow(0 4px 16px oklch(0.75 0.18 85 / 0.30)) drop-shadow(0 8px 24px oklch(0 0 0 / 0.10))" }}
              />
            </div>

            <div className="text-center mt-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Camisola de Portugal</p>
              <p className="text-xs text-muted-foreground">Não oficial · Edição especial</p>
            </div>

            {/* Líder atual */}
            {leader && (
              <div className="mt-4 w-full rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gold/70 mb-1 text-center">Atualmente em 1º</p>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold font-display text-background text-xs font-bold">1</div>
                    <Link to="/adepto/$id" params={{ id: leader.id }} className="text-sm font-bold text-foreground truncate hover:underline">
                      {leader.display_name ?? "Adepto"}
                    </Link>
                  </div>
                  <span className="font-display text-lg text-gold shrink-0">{leader.total_points}<span className="text-xs font-sans text-muted-foreground ml-0.5">pts</span></span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
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

function Countdown({ id, kickoff_at, home, away }: { id: string; kickoff_at: string; home: any; away: any }) {
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
    <Link to="/jogo/$id" params={{ id }} className="block overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-r from-card/80 via-gold/5 to-card/80 px-4 py-3 hover:border-gold/40 transition-smooth">
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
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground">h</div>
            </div>
            <span className="font-display text-xl text-gold/30 mb-3">:</span>
          </>
        )}
        <div className="text-center">
          <div className="font-display text-3xl leading-none" style={goldGrad}>{pad(m)}</div>
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground">min</div>
        </div>
        <span className="font-display text-xl text-gold/30 mb-3">:</span>
        <div className="text-center">
          <div className="font-display text-3xl leading-none" style={goldGrad}>{pad(s)}</div>
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground">seg</div>
        </div>
      </div>
    </Link>
  );
}

function MatchBreakdownDrawer({ match, onClose }: { match: any; onClose: () => void }) {
  const pred = match.pred ?? {};
  const h = match.home_score ?? 0;
  const a = match.away_score ?? 0;
  const total = h + a;
  const res90 = h > a ? "home" : h < a ? "away" : "draw";
  const qualifier = h > a ? "home" : h < a ? "away" : match.qualifier;
  const btts = h > 0 && a > 0 ? "yes" : "no";
  const t25 = total > 2 ? "over" : "under";
  const d1x = res90 === "home" || res90 === "draw";
  const dx2 = res90 === "away" || res90 === "draw";

  const KNOCKOUT_PHASES = new Set(["ronda32","oitavos","quartos","meias","final"]);
  const isKnockout = KNOCKOUT_PHASES.has(match.phase);

  const res90Labels: Record<string,string> = { home: match.home?.name, draw: "Empate", away: match.away?.name };
  const boolLabel = (v: string) => v === "yes" ? "Sim" : "Não";
  const ouLabel = (v: string) => v === "over" ? "Mais" : "Menos";
  const dcLabel = (v: string) => v === "1x" ? `${match.home?.name} ou Empate` : `${match.away?.name} ou Empate`;
  const comboLabel = (v: string) => {
    const [dc, ou] = v.split("_");
    return `${dc === "1x" ? `${match.home?.name}/Empate` : `${match.away?.name}/Empate`} + ${ou === "over" ? "Mais" : "Menos"} 1.5`;
  };

  type Row = { label: string; voted: string; correct: boolean; pts: number } | null;
  const rows: Row[] = [
    pred.result_90 ? { label: "Resultado 90 min", voted: res90Labels[pred.result_90] ?? pred.result_90, correct: pred.result_90 === res90, pts: res90 === "draw" ? 4 : 3 } : null,
    pred.btts ? { label: "Ambas marcam", voted: boolLabel(pred.btts), correct: pred.btts === btts, pts: 2 } : null,
    pred.total_25 ? { label: "Total 2.5 golos", voted: ouLabel(pred.total_25), correct: pred.total_25 === t25, pts: 2 } : null,
    pred.double_chance ? { label: "Dupla hipótese", voted: dcLabel(pred.double_chance), correct: (pred.double_chance === "1x" && d1x) || (pred.double_chance === "x2" && dx2), pts: 1 } : null,
    pred.combo_15 ? { label: "Combinação 1.5", voted: comboLabel(pred.combo_15), correct: (() => { const [dc,ou] = pred.combo_15.split("_"); const dcOk = dc === "1x" ? d1x : dx2; const ouOk = ou === "over" ? total > 1 : total <= 1; return dcOk && ouOk; })(), pts: 4 } : null,
    pred.exact_home != null && pred.exact_away != null ? { label: "Resultado exato", voted: `${pred.exact_home}–${pred.exact_away}`, correct: pred.exact_home === h && pred.exact_away === a, pts: 10 } : null,
    isKnockout && pred.qualifier ? { label: "Qualificar", voted: pred.qualifier === "home" ? match.home?.name : match.away?.name, correct: pred.qualifier === qualifier, pts: 4 } : null,
  ].filter(Boolean);

  const totalPts = pred.points ?? 0;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 rounded-t-3xl border-t border-gold/30 bg-card overflow-hidden"
        onClick={e => e.stopPropagation()}>
        {/* Gold stripe */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, transparent 0%, #c8960c 50%, transparent 100%)" }} />
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>
        {/* Header */}
        <div className="px-5 pb-3 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span>{match.home?.flag}</span>
              <span>{match.home?.name}</span>
              <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-bold tabular-nums">{h}–{a}</span>
              <span>{match.away?.name}</span>
              <span>{match.away?.flag}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Detalhes da tua previsão</p>
          </div>
          <div className={`rounded-xl px-3 py-1.5 text-center border ${totalPts > 0 ? "bg-gold/15 border-gold/30" : "bg-muted border-border"}`}>
            <p className={`font-display text-xl leading-none ${totalPts > 0 ? "text-gold" : "text-muted-foreground"}`}>{totalPts > 0 ? `+${totalPts}` : "0"}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">pts</p>
          </div>
        </div>
        {/* Market rows */}
        <div className="divide-y divide-border/40 mx-5 mb-6 rounded-2xl border border-border/60 overflow-hidden">
          {(rows as NonNullable<Row>[]).map((row, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className={`shrink-0 h-5 w-5 rounded-full flex items-center justify-center ${row.correct ? "bg-wc-green/20" : "bg-destructive/20"}`}>
                {row.correct
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-wc-green" />
                  : <XCircle className="h-3.5 w-3.5 text-destructive" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground leading-none mb-0.5">{row.label}</p>
                <p className="text-sm font-semibold text-foreground truncate">{row.voted}</p>
              </div>
              <span className={`shrink-0 text-sm font-bold ${row.correct ? "text-gold" : "text-muted-foreground/40"}`}>
                {row.correct ? `+${row.pts}` : "—"}
              </span>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">Sem previsões registadas</div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

const SEASON_COMPETITIONS = [
  { key: "liga-portugal", label: "🇵🇹 Liga Portugal" },
  { key: "champions", label: "⭐ Champions League" },
  { key: "liga-europa", label: "🟠 Liga Europa" },
  { key: "premier-league", label: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League" },
  { key: "la-liga", label: "🇪🇸 La Liga" },
  { key: "serie-a", label: "🇮🇹 Serie A" },
];

function SeasonPreRegModal({ user }: { user: any }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [competitions, setCompetitions] = useState<Set<string>>(new Set(["liga-portugal", "champions"]));
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [features, setFeatures] = useState<Set<string>>(new Set());
  const [frequency, setFrequency] = useState<string>("");
  const [idea, setIdea] = useState("");

  useEffect(() => {
    try {
      if (localStorage.getItem("season_prereg_v1")) return;
    } catch { return; }
    let cancelled = false;
    async function check() {
      if (user?.id) {
        const { data } = await (supabase as any)
          .from("season_interest")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data || cancelled) return;
      }
      setTimeout(() => { if (!cancelled) setOpen(true); }, 2500);
    }
    check();
    return () => { cancelled = true; };
  }, [user?.id]);

  function dismiss() {
    try { localStorage.setItem("season_prereg_v1", "1"); } catch {}
    setOpen(false);
  }

  function toggleIn(set: Set<string>, setter: (s: Set<string>) => void, key: string) {
    const next = new Set(set);
    if (next.has(key)) next.delete(key); else next.add(key);
    setter(next);
  }

  async function confirm() {
    if (!user?.id || saving) return;
    setSaving(true);
    await (supabase as any).from("season_interest").upsert({
      user_id: user.id,
      competitions: [...competitions],
      answers: {
        liked: [...liked],
        features: [...features],
        frequency,
        idea: idea.trim() || null,
      },
    }, { onConflict: "user_id" });
    setSaving(false);
    setDone(true);
    try { localStorage.setItem("season_prereg_v1", "1"); } catch {}
    setTimeout(() => setOpen(false), 2600);
  }

  if (!open) return null;

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-semibold transition-smooth ${
      active ? "border-gold bg-gold/20 text-gold" : "border-white/15 bg-white/5 text-white/55 hover:border-white/30"
    }`;

  const steps = [
    {
      title: "Que competições queres seguir?",
      sub: "Escolhe todas as que te interessam",
      valid: competitions.size > 0,
      body: (
        <div className="flex flex-wrap justify-center gap-1.5">
          {SEASON_COMPETITIONS.map(c => (
            <button key={c.key} onClick={() => toggleIn(competitions, setCompetitions, c.key)} className={chip(competitions.has(c.key))}>
              {c.label}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "O que mais gostaste no Mundial?",
      sub: "Para fazermos mais disso",
      valid: true,
      body: (
        <div className="flex flex-wrap justify-center gap-1.5">
          {[
            ["torneios", "🏆 Torneios com amigos"],
            ["rankings", "📊 Rankings e divisões"],
            ["palpites", "⚽ Palpites por jogo"],
            ["exato", "🎯 Resultado exato"],
            ["chat", "💬 Chat e sondagens"],
            ["partilha", "📲 Partilhar resultados"],
          ].map(([k, l]) => (
            <button key={k} onClick={() => toggleIn(liked, setLiked, k)} className={chip(liked.has(k))}>{l}</button>
          ))}
        </div>
      ),
    },
    {
      title: "Que novidades te entusiasmam?",
      sub: "Vamos construir com base nisto",
      valid: true,
      body: (
        <div className="flex flex-wrap justify-center gap-1.5">
          {[
            ["epoca", "🏅 Palpites de época (campeão, top 4...)"],
            ["clube", "❤️ Clube do coração e rivalidades"],
            ["mensal", "📅 Vencedor do mês"],
            ["premios", "🎁 Prémios reais"],
            ["notif", "🔔 Alertas da jornada"],
            ["stats", "📈 Estatísticas pessoais avançadas"],
          ].map(([k, l]) => (
            <button key={k} onClick={() => toggleIn(features, setFeatures, k)} className={chip(features.has(k))}>{l}</button>
          ))}
        </div>
      ),
    },
    {
      title: "Com que frequência jogarias?",
      sub: "Sê honesto — ajuda-nos a desenhar o jogo certo",
      valid: frequency !== "",
      body: (
        <div className="flex flex-col gap-1.5">
          {[
            ["sempre", "🔥 Todas as jornadas, sem falhar"],
            ["grandes", "⭐ Só nos jogos grandes e europeus"],
            ["asvezes", "🙂 De vez em quando"],
          ].map(([k, l]) => (
            <button key={k} onClick={() => setFrequency(k)} className={`${chip(frequency === k)} w-full text-center`}>{l}</button>
          ))}
          <input
            value={idea}
            onChange={e => setIdea(e.target.value)}
            maxLength={200}
            placeholder="Uma ideia tua? (opcional)"
            className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-gold/50 focus:outline-none"
          />
        </div>
      ),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-5" onClick={dismiss}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl border border-gold/40 animate-enter"
        style={{ background: "radial-gradient(ellipse 130% 80% at 50% -10%, oklch(0.28 0.07 85) 0%, oklch(0.14 0.03 265) 55%, oklch(0.11 0.02 265) 100%)", boxShadow: "0 20px 60px oklch(0.75 0.18 85 / 0.25)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, transparent 0%, oklch(0.75 0.18 85) 50%, transparent 100%)" }} />
        <button onClick={dismiss} className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-smooth">✕</button>

        {done ? (
          <div className="px-6 py-12 text-center">
            <p className="text-5xl mb-3">🎉</p>
            <p className="font-display text-2xl text-gold-metallic">Estás dentro!</p>
            <p className="mt-2 text-sm text-white/70">Obrigado — a tua opinião vai mesmo moldar o que vamos construir. Até já! ⚽</p>
          </div>
        ) : !user ? (
          <div className="px-6 pt-8 pb-6 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold/80">O jogo não acaba no domingo</p>
            <h2 className="mt-2 font-display text-[1.7rem] leading-tight text-gold-metallic">A GERAÇÃO<br />CONTINUA ⚽</h2>
            <p className="mt-3 text-sm text-white/75 leading-snug">
              Liga Portugal, Champions e muito mais. Cria conta e ajuda-nos a desenhar a próxima época.
            </p>
            <Link to="/auth" onClick={dismiss}
              className="mt-5 block w-full rounded-xl bg-gold py-3 text-center text-sm font-bold text-background shadow-gold transition-smooth hover:scale-[1.02] active:scale-95">
              Criar conta e garantir lugar 🔒
            </Link>
            <p className="mt-2 text-[10px] text-white/35">Grátis, sem compromisso.</p>
          </div>
        ) : (
          <div className="px-6 pt-8 pb-6">
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.22em] text-gold/80">A Geração continua · Nova época</p>
            <h2 className="mt-1.5 text-center font-display text-xl leading-tight text-gold-metallic">{current.title}</h2>
            <p className="mt-1 text-center text-xs text-white/50">{current.sub}</p>

            <div className="mt-4 min-h-[120px]">{current.body}</div>

            {/* Progress dots */}
            <div className="mt-4 flex justify-center gap-1.5">
              {steps.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-5 bg-gold" : "w-1.5 bg-white/20"}`} />
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)}
                  className="rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-white/60 hover:text-white transition-smooth">
                  ←
                </button>
              )}
              <button
                onClick={() => isLast ? confirm() : setStep(s => s + 1)}
                disabled={!current.valid || saving}
                className="flex-1 rounded-xl bg-gold py-3 text-sm font-bold text-background shadow-gold transition-smooth hover:scale-[1.02] active:scale-95 disabled:opacity-50">
                {saving ? "A guardar…" : isLast ? "Garantir o meu lugar 🔒" : "Continuar →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
