import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Newspaper, Clock, Target } from "lucide-react";
import { TeamBadge } from "@/lib/teamColors.tsx";
import { formatTime, PHASE_LABEL } from "@/lib/format";

function readingTime(content?: string | null): number {
  if (!content) return 1;
  return Math.max(1, Math.round(content.trim().split(/\s+/).length / 200));
}

export const Route = createFileRoute("/noticias/")({
  validateSearch: (s: Record<string, unknown>) => ({ prog: s.prog === "1" || s.prog === true }),
  head: () => ({
    meta: [
      { title: "Notícias — Uma Geração" },
      { name: "description", content: "As últimas notícias, antevisões e análises ScoreLab sobre o Mundial 2026." },
    ],
  }),
  component: Noticias,
});

const CATEGORY_STYLE: Record<string, { label: string; cls: string }> = {
  analise:      { label: "Análise ScoreLab", cls: "border-gold/40 bg-gold/10 text-gold" },
  antevisao:    { label: "Antevisão",        cls: "border-primary/40 bg-primary/10 text-primary" },
  noticia:      { label: "Notícia",           cls: "border-border bg-secondary text-muted-foreground" },
  opiniao:      { label: "Opinião",           cls: "border-border bg-secondary text-muted-foreground" },
  prognostico:  { label: "Prognóstico",       cls: "border-wc-red/40 bg-wc-red/10 text-wc-red" },
};

function Noticias() {
  const { prog } = useSearch({ from: "/noticias/" });
  const [showPrognosticos, setShowPrognosticos] = useState(prog ?? false);

  const { data: articles = [], isLoading: loadingNews } = useQuery({
    queryKey: ["news", "all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("news")
        .select("id,title,excerpt,content,image_url,image_position,category,created_at,match_id,match:match_id(id,kickoff_at,home:home_team_id(name,flag),away:away_team_id(name,flag))")
        .eq("published", true)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: prognosticos = [], isLoading: loadingProg } = useQuery({
    queryKey: ["prognosticos", "published"],
    enabled: showPrognosticos,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("prognosticos")
        .select("id,suggestion,summary,created_at,match:match_id(id,kickoff_at,home:home_team_id(name,flag),away:away_team_id(name,flag))")
        .eq("published", true)
        .order("created_at", { ascending: false });
      return ((data ?? []) as any[]).sort((a, b) => {
        const ta = a.match?.kickoff_at ? new Date(a.match.kickoff_at).getTime() : Infinity;
        const tb = b.match?.kickoff_at ? new Date(b.match.kickoff_at).getTime() : Infinity;
        return ta - tb;
      });
    },
  });

  const isLoading = showPrognosticos ? loadingProg : loadingNews;
  const filtered = articles.filter((a: any) => a.category !== "prognostico");
  const featured = (!showPrognosticos && filtered[0]) as any;
  const rest = (!showPrognosticos ? filtered.slice(1) : prognosticos) as any[];

  return (
    <div className="px-4 pt-6 pb-10 md:px-8">
      <header className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">Notícias</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Antevisões, análises e as últimas do Mundial 2026.</p>
        </div>
        <button
          onClick={() => setShowPrognosticos(v => !v)}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-smooth ${
            showPrognosticos
              ? "border-wc-red bg-wc-red text-white"
              : "border-border bg-card/60 text-muted-foreground"
          }`}
        >
          <Target className="h-3.5 w-3.5" />
          Prognósticos
        </button>
      </header>

      {isLoading && (
        <div className="space-y-4">
          <div className="h-56 shimmer rounded-2xl" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[0,1,2,3].map(i => <div key={i} className="h-36 shimmer rounded-2xl" />)}
          </div>
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <Newspaper className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="font-display text-lg">
            {showPrognosticos ? "Sem prognósticos publicados" : "Sem artigos publicados"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Volta em breve.</p>
        </div>
      )}

      {/* Prognósticos — layout em grid de cards */}
      {showPrognosticos && rest.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {rest.map((a: any) => (
            <PrognosticoCard key={a.id} article={a} />
          ))}
        </div>
      )}

      {/* Outras categorias — layout normal com featured */}
      {!showPrognosticos && (
        <>
          {featured && (
            <Link
              to="/noticias/$id"
              params={{ id: featured.id }}
              className="group mb-6 block overflow-hidden rounded-2xl border border-border bg-card/70 transition-smooth hover:border-gold/40"
              style={{ transition: "transform 260ms cubic-bezier(0.16,1,0.3,1), box-shadow 260ms ease" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px -8px oklch(0.82 0.15 88 / 0.2)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
            >
              {featured.image_url ? (
                <div className="relative h-52 md:h-64 w-full overflow-hidden">
                  <img src={featured.image_url} alt={featured.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" style={{ objectPosition: featured.image_position ?? "50% 50%" }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <CategoryBadge category={featured.category} className="absolute left-4 top-4" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="font-display text-2xl md:text-3xl text-white leading-tight drop-shadow">{featured.title}</h2>
                  </div>
                </div>
              ) : (
                <div className="p-5">
                  <CategoryBadge category={featured.category} />
                  <h2 className="mt-3 font-display text-2xl md:text-3xl leading-tight">{featured.title}</h2>
                </div>
              )}
              {featured.excerpt && (
                <p className="px-5 py-4 text-sm text-muted-foreground line-clamp-2">{featured.excerpt}</p>
              )}
              <div className="flex items-center justify-between border-t border-border/50 px-5 py-3">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatArticleDate(featured.created_at)}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{readingTime(featured.content)} min</span>
                </div>
                <span className="text-xs font-semibold text-gold group-hover:underline">Ler artigo →</span>
              </div>
            </Link>
          )}

          {rest.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {rest.map((a: any) => (
                <Link
                  key={a.id}
                  to="/noticias/$id"
                  params={{ id: a.id }}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card/70 transition-smooth hover:border-gold/40"
                  style={{ transition: "transform 260ms cubic-bezier(0.16,1,0.3,1), box-shadow 260ms ease" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 32px -6px oklch(0.82 0.15 88 / 0.15)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
                >
                  {a.image_url ? (
                    <div className="relative h-36 overflow-hidden">
                      <img src={a.image_url} alt={a.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" style={{ objectPosition: a.image_position ?? "50% 50%" }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                      <CategoryBadge category={a.category} className="absolute left-3 top-3" small />
                    </div>
                  ) : (
                    <div className="p-4 pb-0">
                      <CategoryBadge category={a.category} small />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="font-display text-base leading-tight line-clamp-2">{a.title}</h3>
                    {a.excerpt && <p className="mt-1 text-xs text-muted-foreground line-clamp-2 flex-1">{a.excerpt}</p>}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{formatArticleDate(a.created_at)}</span>
                        <span className="inline-flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{readingTime(a.content)} min</span>
                      </div>
                      <span className="text-[11px] font-semibold text-gold group-hover:underline">Ler →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PrognosticoCard({ article }: { article: any }) {
  const match = article.match as any;

  const inner = (
    <>
      {/* Stripe tricolor — mesmo que MatchCard */}
      <div className="card-stripe" />

      {/* Top bar: fase + badge prognóstico */}
      <div className="flex items-center justify-between px-4 pt-3 pb-0">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {match?.phase ? (PHASE_LABEL[match.phase] ?? match.phase) : "Prognóstico"}
        </span>
        <span className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold flex items-center gap-1">
          <Target className="h-2.5 w-2.5" /> Análise
        </span>
      </div>

      {/* Teams — layout idêntico ao MatchCard */}
      {match?.home && match?.away ? (
        <div className="flex items-center justify-between gap-2 px-4 py-4">
          <div className="flex flex-1 flex-col items-center gap-2">
            <TeamBadge code={match.home.code} flag={match.home.flag} name={match.home.name} size="md" />
            <span className="text-center text-xs font-bold leading-tight text-foreground md:text-sm">{match.home.name}</span>
          </div>
          <div className="flex flex-col items-center gap-1 px-2">
            <div className="flex items-center gap-1 text-wc-red">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-display text-2xl tabular-nums md:text-3xl">
                {match.kickoff_at ? formatTime(match.kickoff_at) : "–:––"}
              </span>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">vs</span>
          </div>
          <div className="flex flex-1 flex-col items-center gap-2">
            <TeamBadge code={match.away.code} flag={match.away.flag} name={match.away.name} size="md" />
            <span className="text-center text-xs font-bold leading-tight text-foreground md:text-sm">{match.away.name}</span>
          </div>
        </div>
      ) : (
        <div className="px-4 py-4">
          <p className="font-display text-lg leading-tight">{article.title}</p>
        </div>
      )}

      {/* Sugestão */}
      <div className="mx-4 mb-3 rounded-xl border border-gold/20 bg-gold/8 px-3 py-2.5">
        <p className="text-[9px] font-bold uppercase tracking-widest text-gold/70 mb-0.5">Sugestão</p>
        <p className="text-sm font-semibold text-foreground leading-snug">{article.suggestion}</p>
      </div>

      {/* Bottom bar — estilo MatchCard */}
      <div className="flex items-center justify-between border-t border-border bg-muted/50 px-4 py-2.5">
        <span className="text-xs text-muted-foreground">
          {match?.kickoff_at
            ? new Date(match.kickoff_at).toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "short" })
            : formatArticleDate(article.created_at)}
        </span>
        <span className="text-xs font-bold text-wc-red group-hover:underline transition-smooth">
          Ver análise →
        </span>
      </div>
    </>
  );

  const cls = "group block overflow-hidden rounded-2xl bg-card transition-smooth";
  const shadowBase = "0 2px 12px oklch(0 0 0 / 0.30), 0 0 0 1px oklch(1 0 0 / 0.06)";
  const shadowHover = "0 16px 40px oklch(0.54 0.24 27 / 0.25), 0 0 0 1.5px oklch(0.54 0.24 27 / 0.40)";

  if (match?.id) {
    return (
      <Link
        to="/jogo/$id"
        params={{ id: match.id }}
        className={cls}
        style={{ boxShadow: shadowBase, transition: "transform 240ms cubic-bezier(0.16,1,0.3,1), box-shadow 240ms ease" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = shadowHover; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = shadowBase; }}
      >
        {inner}
      </Link>
    );
  }
  return (
    <div className={cls} style={{ boxShadow: shadowBase }}>
      {inner}
    </div>
  );
}

function CategoryBadge({ category, className = "", small = false }: { category: string; className?: string; small?: boolean }) {
  const s = CATEGORY_STYLE[category] ?? CATEGORY_STYLE.noticia;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-semibold uppercase tracking-wider ${small ? "text-[9px]" : "text-[10px]"} ${s.cls} ${className}`}>
      {category === "analise" && <TrendingUp className={small ? "h-2.5 w-2.5" : "h-3 w-3"} />}
      {category === "prognostico" && <Target className={small ? "h-2.5 w-2.5" : "h-3 w-3"} />}
      {s.label}
    </span>
  );
}

function formatArticleDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" });
}
