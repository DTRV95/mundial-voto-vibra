import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, ArrowLeft, Calendar, Eye } from "lucide-react";

export const Route = createFileRoute("/noticias/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Artigo — Uma Geração 2026` },
      { name: "robots", content: "index, follow" },
      { property: "og:site_name", content: "Uma Geração 2026" },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Article,
});

const CATEGORY_STYLE: Record<string, { label: string; cls: string }> = {
  analise:   { label: "Análise ScoreLab", cls: "border-gold/40 bg-gold/10 text-gold" },
  antevisao: { label: "Antevisão",        cls: "border-primary/40 bg-primary/10 text-primary" },
  noticia:   { label: "Notícia",          cls: "border-border bg-secondary text-muted-foreground" },
  opiniao:   { label: "Opinião",          cls: "border-border bg-secondary text-muted-foreground" },
};

function Article() {
  const { id } = Route.useParams();

  const { data: article, isLoading } = useQuery({
    queryKey: ["news", id],
    queryFn: async () => {
      // UUID regex — if it looks like a UUID go straight to id lookup, otherwise try slug
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (!isUuid) {
        const { data } = await supabase.from("news").select("*").eq("slug", id).eq("published", true).maybeSingle();
        if (data) return data;
      }
      const { data } = await supabase.from("news").select("*").eq("id", id).eq("published", true).maybeSingle();
      return data;
    },
  });

  const { data: related = [] } = useQuery({
    queryKey: ["news", "related", article?.id],
    enabled: !!article,
    queryFn: async () => {
      const { data } = await supabase
        .from("news")
        .select("id,title,excerpt,image_url,category,created_at")
        .eq("published", true)
        .eq("category", article!.category)
        .neq("id", article!.id)
        .order("created_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  // Use the real UUID from the fetched article, not the URL param (which may be a slug)
  useEffect(() => {
    if (article?.id) {
      supabase.rpc("increment_news_views", { article_id: article.id }).catch(() => {});
    }
  }, [article?.id]);

  if (isLoading) return (
    <div className="px-4 pt-6 md:px-8 space-y-4">
      <div className="h-4 w-20 shimmer rounded" />
      <div className="h-8 w-3/4 shimmer rounded-lg" />
      <div className="h-52 shimmer rounded-2xl" />
      <div className="space-y-3">
        {[0,1,2,3].map(i => <div key={i} className="h-4 shimmer rounded" />)}
      </div>
    </div>
  );

  if (!article) return (
    <div className="px-4 pt-10 text-center">
      <p className="font-display text-2xl">Artigo não encontrado</p>
      <Link to="/noticias" className="mt-4 inline-block text-sm text-gold">← Voltar às notícias</Link>
    </div>
  );

  const cat = CATEGORY_STYLE[article.category] ?? CATEGORY_STYLE.noticia;

  return (
    <div className="px-4 pt-6 pb-12 md:px-8 max-w-3xl">
      <Link to="/noticias" className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-smooth">
        <ArrowLeft className="h-3.5 w-3.5" /> Notícias
      </Link>

      {/* Header */}
      <header className="mt-3 mb-6">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${cat.cls}`}>
          {article.category === "analise" && <TrendingUp className="h-3 w-3" />}
          {cat.label}
        </span>
        <h1 className="mt-4 font-display text-3xl md:text-4xl leading-tight">{article.title}</h1>
        {article.excerpt && (
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">{article.excerpt}</p>
        )}
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(article.created_at).toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </span>
          {(article as any).views > 0 && (
            <span className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              {(article as any).views.toLocaleString("pt-PT")} {(article as any).views === 1 ? "leitura" : "leituras"}
            </span>
          )}
        </div>
      </header>

      {/* Imagem de capa */}
      {article.image_url && (
        <figure className="mb-6 overflow-hidden rounded-2xl">
          <img src={article.image_url} alt={article.title} className="w-full object-cover h-64 md:h-80" style={{ objectPosition: (article as any).image_position ?? "50% 50%" }} />
          {(article as any).image_caption && (
            <figcaption className="mt-2 px-1 text-[11px] text-muted-foreground italic">
              {(article as any).image_caption}
            </figcaption>
          )}
        </figure>
      )}

      {/* Conteúdo */}
      {article.content && (
        <div className="prose-article text-sm leading-7 text-foreground/90 space-y-4 whitespace-pre-wrap">
          {article.content}
        </div>
      )}

      {/* ScoreLab badge */}
      {article.category === "analise" && (
        <div className="mt-8 rounded-2xl border border-gold/30 bg-gold/5 p-4 flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-gold shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gold">Análise produzida pelo ScoreLab</p>
            <p className="text-xs text-muted-foreground">Probabilidades baseadas em modelos estatísticos do ScoreLab.</p>
          </div>
        </div>
      )}

      {/* Relacionados */}
      {related.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-xl mb-4">Mais artigos</h2>
          <div className="space-y-3">
            {related.map((r: any) => (
              <Link key={r.id} to="/noticias/$id" params={{ id: (r as any).slug ?? r.id }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-3 transition-smooth hover:border-gold/40">
                {r.image_url && (
                  <img src={r.image_url} alt={r.title} className="h-14 w-20 rounded-xl object-cover shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold line-clamp-2">{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(r.created_at).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
