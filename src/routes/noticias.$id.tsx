import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/noticias/$id")({
  component: Article,
});

function Article() {
  const { id } = Route.useParams();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("news")
      .select("id,title,excerpt,content,image_url,category,created_at")
      .eq("id", id)
      .eq("published", true)
      .maybeSingle()
      .then(({ data }) => {
        setArticle(data ?? null);
        setLoading(false);
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
    <div className="px-4 pt-6 pb-12 md:px-8 max-w-3xl">
      <Link
        to="/noticias"
        className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-smooth"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Notícias
      </Link>

      <header className="mt-3 mb-6">
        {article.category === "analise" && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gold mb-3">
            <TrendingUp className="h-3 w-3" /> Análise ScoreLab
          </span>
        )}
        <h1 className="font-display text-3xl md:text-4xl leading-tight">{article.title}</h1>
        {article.excerpt && (
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">{article.excerpt}</p>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          {new Date(article.created_at).toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </header>

      {article.image_url && (
        <figure className="mb-6 overflow-hidden rounded-2xl">
          <img src={article.image_url} alt={article.title} className="w-full object-cover h-64 md:h-80" />
        </figure>
      )}

      {article.content && (
        <div className="text-sm leading-7 text-foreground/90 space-y-4 whitespace-pre-wrap">
          {article.content}
        </div>
      )}
    </div>
  );
}
