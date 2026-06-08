import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Newspaper } from "lucide-react";

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
  analise:    { label: "Análise ScoreLab", cls: "border-gold/40 bg-gold/10 text-gold" },
  antevisao:  { label: "Antevisão",        cls: "border-primary/40 bg-primary/10 text-primary" },
  noticia:    { label: "Notícia",           cls: "border-border bg-secondary text-muted-foreground" },
  opiniao:    { label: "Opinião",           cls: "border-border bg-secondary text-muted-foreground" },
};

function Noticias() {
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["news", "all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("news")
        .select("id,title,excerpt,image_url,image_position,category,created_at")
        .eq("published", true)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const featured = articles[0] as any;
  const rest = articles.slice(1) as any[];

  return (
    <div className="px-4 pt-6 pb-10 md:px-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl md:text-4xl">Notícias</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Antevisões, análises e as últimas do Mundial 2026.</p>
      </header>

      {isLoading && (
        <div className="space-y-4">
          <div className="h-56 shimmer rounded-2xl" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[0,1,2,3].map(i => <div key={i} className="h-36 shimmer rounded-2xl" />)}
          </div>
        </div>
      )}

      {!isLoading && articles.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <Newspaper className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="font-display text-lg">Sem notícias publicadas</p>
          <p className="text-sm text-muted-foreground mt-1">Volta em breve.</p>
        </div>
      )}

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
            <span className="text-xs text-muted-foreground">{formatArticleDate(featured.created_at)}</span>
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
                  <span className="text-[11px] text-muted-foreground">{formatArticleDate(a.created_at)}</span>
                  <span className="text-[11px] font-semibold text-gold group-hover:underline">Ler →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryBadge({ category, className = "", small = false }: { category: string; className?: string; small?: boolean }) {
  const s = CATEGORY_STYLE[category] ?? CATEGORY_STYLE.noticia;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-semibold uppercase tracking-wider ${small ? "text-[9px]" : "text-[10px]"} ${s.cls} ${className}`}>
      {category === "analise" && <TrendingUp className={small ? "h-2.5 w-2.5" : "h-3 w-3"} />}
      {s.label}
    </span>
  );
}

function formatArticleDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" });
}
