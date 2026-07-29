import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Badge {
  slug: string;
  label: string;
  emoji: string;
  descricao: string | null;
  competicao: string;
  ordem: number;
}

/** Medalhas permanentes de um adepto. Nunca expiram nem se perdem. */
export function useBadges(userId: string | undefined) {
  return useQuery({
    queryKey: ["badges", userId],
    enabled: !!userId,
    staleTime: 300_000,
    queryFn: async (): Promise<Badge[]> => {
      const { data } = await (supabase as any)
        .from("user_badges")
        .select("slug,label,emoji,descricao,competicao,ordem")
        .eq("user_id", userId)
        .order("ordem");
      return (data ?? []) as Badge[];
    },
  });
}

/** As medalhas de topo, para mostrar ao lado de um nome. */
export function BadgeChips({ userId, max = 3 }: { userId: string | undefined; max?: number }) {
  const { data: badges = [] } = useBadges(userId);
  if (badges.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5 align-middle">
      {badges.slice(0, max).map((b) => (
        <span key={b.slug} title={`${b.label}${b.descricao ? ` — ${b.descricao}` : ""}`} className="text-sm leading-none">
          {b.emoji}
        </span>
      ))}
    </span>
  );
}

/** Vitrine completa das medalhas, para o perfil. */
export function BadgeShelf({ userId }: { userId: string | undefined }) {
  const { data: badges = [], isLoading } = useBadges(userId);

  if (isLoading) return <div className="shimmer h-24 rounded-2xl" />;
  if (badges.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center">
        <p className="text-sm text-muted-foreground">Ainda sem medalhas.</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Ganham-se nos pódios de cada mês e no final de cada época.
        </p>
      </div>
    );
  }

  // Agrupa por competição, mantendo a ordem de importância
  const porCompeticao = badges.reduce<Record<string, Badge[]>>((acc, b) => {
    (acc[b.competicao] ??= []).push(b);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(porCompeticao).map(([competicao, lista]) => (
        <div key={competicao}>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {competicao}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {lista.map((b) => (
              <div key={b.slug} className="flex items-center gap-3 rounded-2xl border border-gold/25 bg-gold/5 px-3 py-2.5">
                <span className="text-2xl leading-none">{b.emoji}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{b.label}</p>
                  {b.descricao && (
                    <p className="truncate text-[11px] text-muted-foreground">{b.descricao}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
