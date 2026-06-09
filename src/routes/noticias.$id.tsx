import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, TrendingUp, Clock } from "lucide-react";

function readingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export const Route = createFileRoute("/noticias/$id")({
  component: Article,
});

const CATEGORY_STYLE: Record<string, { label: string; cls: string }> = {
  analise:   { label: "Análise ScoreLab", cls: "border-gold/40 bg-gold/10 text-gold" },
  antevisao: { label: "Antevisão",        cls: "border-primary/40 bg-primary/10 text-primary" },
  noticia:   { label: "Notícia",           cls: "border-border bg-secondary text-muted-foreground" },
  opiniao:   { label: "Opinião",           cls: "border-border bg-secondary text-muted-foreground" },
};

function CategoryBadge({ category }: { category: string }) {
  const s = CATEGORY_STYLE[category] ?? CATEGORY_STYLE.noticia;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${s.cls}`}>
      {category === "analise" && <TrendingUp className="h-2.5 w-2.5" />}
      {s.label}
    </span>
  );
}

function Article() {
  const { id } = Route.useParams();
  const [article, setArticle] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("news")
      .select("id,title,excerpt,content,image_url,image_caption,category,created_at")
      .eq("id", id)
      .eq("published", true)
      .maybeSingle()
      .then(({ data }) => {
        setArticle(data ?? null);
        setLoading(false);
        if (data?.category) {
          supabase
            .from("news")
            .select("id,title,excerpt,image_url,category,created_at")
            .eq("published", true)
            .eq("category", data.category)
            .neq("id", data.id)
            .order("created_at", { ascending: false })
            .limit(3)
            .then(({ data: rel }) => setRelated(rel ?? []));
        }
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (article?.id) {
      supabase
        .from("news")
        .update({ views: (article.views ?? 0) + 1 })
        .eq("id", article.id)
        .then(() => {})
        .catch(() => {});
    }
  }, [article?.id]);

  if (loading) {
    return (
      <div className="px-4 pt-6 md:px-8 space-y-4">
        <div className="h-4 w-20 shimmer rounded" />
        <div className="h-8 w-3/4 shimmer rounded-lg" />
        <div className="h-52 shimmer rounded-2xl" />
        <div className="space-y-3">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-4 shimmer rounded" />)}
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="px-4 pt-10 text-center">
        <p className="font-display text-2xl">Artigo não encontrado</p>
        <Link to="/noticias" className="mt-4 inline-block text-sm text-gold">← Voltar às notícias</Link>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-16 md:px-8 max-w-2xl mx-auto">
      <Link
        to="/noticias"
        className="mb-8 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-smooth"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Notícias
      </Link>

      <header className="mt-2 mb-8">
        <div className="mb-4 flex items-center flex-wrap gap-3">
          <CategoryBadge category={article.category} />
          <span className="text-xs text-muted-foreground">
            {new Date(article.created_at).toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </span>
          {article.content && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> {readingTime(article.content)} min de leitura
            </span>
          )}
        </div>

        <h1 className="font-display text-3xl md:text-[2.6rem] leading-[1.15] tracking-tight">{article.title}</h1>

        {article.excerpt && (
          <p className="mt-4 text-[1.05rem] leading-relaxed text-muted-foreground font-light border-l-2 border-gold/50 pl-4">
            {article.excerpt}
          </p>
        )}
      </header>

      {article.image_url && (
        <figure className="mb-8">
          <div className="overflow-hidden rounded-xl">
            <img src={article.image_url} alt={article.title} className="w-full object-cover h-64 md:h-[22rem]" />
          </div>
          {article.image_caption && (
            <figcaption className="mt-2 text-[11px] text-muted-foreground italic px-1">
              {article.image_caption}
            </figcaption>
          )}
        </figure>
      )}

      {article.content && (
        <div className="prose-article">
          {article.content.split("\n\n").filter(Boolean).map((para, i) => (
            <p key={i}>{para.replace(/\n/g, " ")}</p>
          ))}
        </div>
      )}

      {related.length > 0 && (
        <aside className="mt-12 pt-8 border-t border-border">
          <h2 className="font-display text-xl mb-4">Artigos relacionados</h2>
          <div className="space-y-3">
            {related.map((a: any) => (
              <Link
                key={a.id}
                to="/noticias/$id"
                params={{ id: a.id }}
                className="group flex items-center gap-4 rounded-xl border border-border bg-card/60 p-3 hover:border-gold/40 transition-smooth"
              >
                {a.image_url && (
                  <img src={a.image_url} alt={a.title} className="h-16 w-24 shrink-0 rounded-lg object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-gold transition-smooth">{a.title}</p>
                  {a.excerpt && <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{a.excerpt}</p>}
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString("pt-PT", { day: "numeric", month: "long" })}
                  </p>
                </div>
                <span className="text-xs text-gold shrink-0">Ler →</span>
              </Link>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}
