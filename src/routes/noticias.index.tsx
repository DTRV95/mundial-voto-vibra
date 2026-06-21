import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Newspaper, Clock, Target } from "lucide-react";

function readingTime(content?: string | null): number {
  if (!content) return 1;
  return Math.max(1, Math.round(content.trim().split(/\s+/).length / 200));
}

export const Route = createFileRoute("/noticias/")({
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

type FilterTab = "todas" | "prognosticos" | "analises" | "noticias";
const TABS: { key: FilterTab; label: string }[] = [
  { key: "todas",        label: "Todas" },
  { key: "prognosticos", label: "Prognósticos" },
  { key: "analises",    label: "Análises" },
  { key: "noticias",    label: "Notícias" },
];

const TAB_CATEGORIES: Record<FilterTab, string[]> = {
  todas:        [],
  prognosticos: ["prognostico"],
  analises:     ["analise", "antevisao"],
  noticias:     ["noticia", "opiniao"],
};

function Noticias() {
  const [tab, setTab] = useState<FilterTab>("todas");

  const { data: articles = [], isLoading } = useQuery({
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

  const filtered = tab === "todas"
    ? articles
    : articles.filter((a: any) => TAB_CATEGORIES[tab].includes(a.category));

  const isPrognosticos = tab === "prognosticos";
  const featured = (!isPrognosticos && filtered[0]) as any;
  const rest = (!isPrognosticos ? filtered.slice(1) : filtered) as any[];

  return (
    <div className="px-4 pt-6 pb-10 md:px-8">
      <header className="mb-5">
        <h1 className="font-display text-3xl md:text-4xl">Notícias</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Antevisões, análises e as últimas do Mundial 2026.</p>
      </header>

      {/* Filtros */}
      <div className="mb-6 -mx-4 md:mx-0 overflow-x-auto px-4 md:px-0">
        <div className="flex gap-2 w-max">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-smooth ${
                tab === t.key
                  ? t.key === "prognosticos"
                    ? "border-wc-red bg-wc-red text-white"
                    : "border-gold bg-gold text-background"
                  : "border-border bg-card/60 text-muted-foreground hover:border-gold/40 hover:text-foreground"
              }`}
            >
              {t.key === "prognosticos" && <Target className="h-3.5 w-3.5" />}
              {t.key === "analises" && <TrendingUp className="h-3.5 w-3.5" />}
              {t.label}
            </button>
          ))}
        </div>
      </div>

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
            {tab === "prognosticos" ? "Sem prognósticos publicados" : "Sem artigos publicados"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Volta em breve.</p>
        </div>
      )}

      {/* Prognósticos — layout em grid de cards */}
      {isPrognosticos && rest.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {rest.map((a: any) => (
            <PrognosticoCard key={a.id} article={a} />
          ))}
        </div>
      )}

      {/* Outras categorias — layout normal com featured */}
      {!isPrognosticos && (
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
  return (
    <Link
      to="/noticias/$id"
      params={{ id: article.id }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-wc-red/30 bg-card/70 transition-smooth hover:border-wc-red/60"
      style={{ transition: "transform 260ms cubic-bezier(0.16,1,0.3,1), box-shadow 260ms ease" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 32px -6px oklch(0.54 0.24 27 / 0.2)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
    >
      {/* Stripe */}
      <div className="h-0.5 w-full bg-gradient-to-r from-wc-red via-gold to-wc-green" />

      <div className="flex flex-1 flex-col p-4">
        {/* Jogo associado */}
        {match?.home && match?.away ? (
          <div className="mb-3 flex items-center justify-between rounded-xl bg-secondary/60 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span>{match.home.flag}</span>
              <span className="text-foreground">{match.home.name}</span>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">vs</span>
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span className="text-foreground">{match.away.name}</span>
              <span>{match.away.flag}</span>
            </div>
          </div>
        ) : (
          <div className="mb-3">
            <CategoryBadge category="prognostico" small />
          </div>
        )}

        <h3 className="font-display text-base leading-tight line-clamp-2 flex-1">{article.title}</h3>
        {article.excerpt && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{article.excerpt}</p>}

        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">{formatArticleDate(article.created_at)}</span>
          {match?.id ? (
            <span className="text-[11px] font-bold text-wc-red group-hover:underline">Ver jogo →</span>
          ) : (
            <span className="text-[11px] font-bold text-wc-red group-hover:underline">Ler →</span>
          )}
        </div>
      </div>
    </Link>
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
