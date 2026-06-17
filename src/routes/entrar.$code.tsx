import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { Trophy, LogIn } from "lucide-react";
import { toast } from "sonner";

export const Route = (createFileRoute as any)("/entrar/$code")({
  component: EntrarPage,
});

function EntrarPage() {
  const { code } = (Route as any).useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Fetch pool info by code
  const { data: pool, isLoading: poolLoading, isError } = useQuery({
    queryKey: ["pool-invite", code],
    retry: false,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("pools")
        .select("id, name, code, prize, emoji")
        .eq("code", code.toUpperCase())
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });

  // Check if user is already a member
  const { data: isMember, isLoading: memberLoading } = useQuery({
    queryKey: ["pool-invite-member", pool?.id, user?.id],
    enabled: !!pool && !!user,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("pool_members")
        .select("user_id")
        .eq("pool_id", pool!.id)
        .eq("user_id", user!.id)
        .maybeSingle();
      return !!data;
    },
  });

  // Auto-join and redirect once we know the user is logged in and not yet a member
  useEffect(() => {
    if (isMember) {
      navigate({ to: "/liga/$code", params: { code: code.toUpperCase() } });
    } else if (user && pool && isMember === false && !joinPool.isPending && !joinPool.isSuccess) {
      joinPool.mutate();
    }
  }, [isMember, user, pool, code, navigate]);

  const joinPool = useMutation({
    mutationFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_points")
        .eq("id", user!.id)
        .maybeSingle();

      const start_points = profile?.total_points ?? 0;

      const { error } = await (supabase as any)
        .from("pool_members")
        .insert({ pool_id: pool!.id, user_id: user!.id, start_points });

      // 23505 = unique violation — already a member, just proceed
      if (error && error.code !== "23505") throw error;
    },
    onSuccess: () => {
      toast.success(`Bem-vindo ao torneio "${pool?.name}"! 🏆`);
      navigate({ to: "/liga/$code", params: { code: code.toUpperCase() } });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao entrar no torneio."),
  });

  const isLoading = authLoading || poolLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-wc-red border-t-transparent" />
      </div>
    );
  }

  if (isError || !pool) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center gap-3">
        <span className="text-5xl mb-2">🔍</span>
        <h2 className="font-display text-2xl">Torneio não encontrado</h2>
        <p className="text-sm text-muted-foreground">
          O código <span className="font-mono font-bold text-foreground">{code.toUpperCase()}</span> não corresponde a nenhum torneio.
        </p>
        <p className="text-xs text-muted-foreground">Verifica se o link está correto ou pede ao criador para te enviar novamente.</p>
        <Link
          to="/ligas"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-wc-red px-5 py-2.5 text-sm font-bold text-white hover:bg-wc-red/80 transition-smooth"
        >
          Ver os meus torneios
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        {/* Card de convite */}
        <div
          className="overflow-hidden rounded-3xl text-white mb-6"
          style={{
            background: "linear-gradient(145deg, oklch(0.54 0.24 27) 0%, oklch(0.40 0.20 15) 55%, oklch(0.28 0.14 270) 100%)",
            boxShadow: "0 12px 40px oklch(0.54 0.24 27 / 0.35)",
          }}
        >
          <div className="relative px-7 pt-8 pb-7">
            {/* Troféu decorativo de fundo */}
            <div className="absolute right-4 top-4 opacity-10 pointer-events-none select-none">
              <Trophy className="h-24 w-24 text-white" />
            </div>

            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-3">
              Convite para torneio privado
            </p>

            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl leading-none">{(pool as any).emoji || "⚽"}</span>
              <h1 className="font-display text-3xl leading-tight text-white">
                {pool.name}
              </h1>
            </div>

            {pool.prize && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">
                🎁 {pool.prize}
              </div>
            )}

            <div className="mt-4 border-t border-white/15 pt-4">
              <p className="text-sm text-white/70">
                Foste convidado para entrar neste torneio do Mundial 2026. Junta-te, faz as tuas previsões e compete com os teus amigos!
              </p>
            </div>
          </div>
        </div>

        {/* Acções */}
        {!user ? (
          // Utilizador não autenticado — pede para criar conta / entrar
          <div className="space-y-3">
            <Link
              to="/auth"
              search={{ redirect: `/entrar/${code.toUpperCase()}` } as any}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-wc-red px-5 py-4 text-base font-bold text-white shadow-gold transition-smooth hover:scale-[1.02] active:scale-95"
            >
              <LogIn className="h-5 w-5" />
              Criar conta / Entrar
            </Link>
            <p className="text-center text-xs text-muted-foreground">
              Precisas de uma conta para entrar no torneio. É grátis e rápido!
            </p>
          </div>
        ) : (
          // Utilizador autenticado — a entrar automaticamente
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-wc-red border-t-transparent" />
            <p className="text-sm text-muted-foreground">A entrar no torneio…</p>
          </div>
        )}
      </div>
    </div>
  );
}
