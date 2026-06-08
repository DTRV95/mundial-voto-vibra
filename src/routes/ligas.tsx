import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { Users, Plus, LogIn, Copy, Check, Trash2, Gift } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/ligas")({
  head: () => ({
    meta: [
      { title: "Torneios Privados — Uma Geração" },
      { name: "description", content: "Cria ou junta-te a um torneio privado com os teus amigos." },
    ],
  }),
  component: Ligas,
});

function genCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function Ligas() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newPrize, setNewPrize] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Ligas onde o utilizador é membro
  const { data: myPools = [] } = useQuery({
    queryKey: ["my-pools", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("pool_members")
        .select("pool:pool_id(id, name, code, created_by, prize)")
        .eq("user_id", user!.id);
      return (data ?? []).map((r: any) => r.pool).filter(Boolean);
    },
  });

  // Contagem de membros por liga
  const { data: memberCounts = {} } = useQuery({
    queryKey: ["pool-counts", myPools.map((p: any) => p.id)],
    enabled: myPools.length > 0,
    queryFn: async () => {
      const ids = myPools.map((p: any) => p.id);
      const { data } = await supabase
        .from("pool_members")
        .select("pool_id")
        .in("pool_id", ids);
      const counts: Record<string, number> = {};
      for (const r of data ?? []) {
        counts[r.pool_id] = (counts[r.pool_id] ?? 0) + 1;
      }
      return counts;
    },
  });

  const createPool = useMutation({
    mutationFn: async ({ name, prize }: { name: string; prize: string }) => {
      let code = genCode();
      // garantir código único (retry simples)
      const { data: existing } = await supabase.from("pools").select("id").eq("code", code).maybeSingle();
      if (existing) code = genCode();

      const { data: pool, error } = await supabase
        .from("pools")
        .insert({ name, code, created_by: user!.id, prize: prize || null })
        .select()
        .single();
      if (error) throw error;

      // auto-entrar na liga
      await supabase.from("pool_members").insert({ pool_id: pool.id, user_id: user!.id });
      return pool;
    },
    onSuccess: () => {
      setNewName("");
      setNewPrize("");
      qc.invalidateQueries({ queryKey: ["my-pools"] });
      toast.success("Torneio criado!");
    },
    onError: () => toast.error("Erro ao criar liga."),
  });

  const joinPool = useMutation({
    mutationFn: async (code: string) => {
      const { data: pool, error } = await supabase
        .from("pools")
        .select("id, name")
        .eq("code", code.toUpperCase().trim())
        .maybeSingle();
      if (error || !pool) throw new Error("Liga não encontrada.");

      const { error: joinError } = await supabase
        .from("pool_members")
        .insert({ pool_id: pool.id, user_id: user!.id });
      if (joinError?.code === "23505") throw new Error("Já és membro deste torneio.");
      if (joinError) throw joinError;
      return pool;
    },
    onSuccess: (pool: any) => {
      setJoinCode("");
      qc.invalidateQueries({ queryKey: ["my-pools"] });
      toast.success(`Entraste na liga "${pool.name}"!`);
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao entrar no torneio."),
  });

  const leavePool = useMutation({
    mutationFn: async (poolId: string) => {
      await supabase.from("pool_members").delete().eq("pool_id", poolId).eq("user_id", user!.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-pools"] });
      toast.success("Saíste do torneio.");
    },
  });

  const deletePool = useMutation({
    mutationFn: async (poolId: string) => {
      await supabase.from("pool_members").delete().eq("pool_id", poolId);
      const { error } = await supabase.from("pools").delete().eq("id", poolId).eq("created_by", user!.id);
      if (error) throw new Error("Não foi possível eliminar o torneio.");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-pools"] });
      toast.success("Torneio eliminado.");
    },
    onError: (e: any) => toast.error(e.message),
  });

  function copyLink(code: string, poolId: string) {
    const url = `${window.location.origin}/liga/${code}`;
    if (navigator.share) {
      navigator.share({ title: "Junta-te ao meu torneio!", text: "Vota comigo no Mundial 2026 🏆", url });
    } else {
      navigator.clipboard.writeText(url);
      setCopiedId(poolId);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success("Link copiado!");
    }
  }

  function shareWhatsApp(code: string, name: string) {
    const url = `${window.location.origin}/liga/${code}`;
    const text = encodeURIComponent(`🏆 Junta-te ao meu torneio "${name}" no Uma Geração!\nVota no Mundial 2026 e compete comigo: ${url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  if (!user) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-5 text-center">
        <Users className="mb-3 h-12 w-12 text-muted-foreground" />
        <h2 className="font-display text-2xl">Torneios Privados</h2>
        <p className="mt-2 text-sm text-muted-foreground">Entra na tua conta para criar ou juntar-te a um torneio.</p>
        <Link to="/auth" className="mt-4 rounded-full bg-wc-red px-6 py-2.5 text-sm font-bold text-white shadow-gold">
          Entrar / Registar
        </Link>
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-10 max-w-2xl">
      <header className="mb-6">
        <h1 className="font-display text-3xl">Torneios Privados</h1>
        <p className="text-sm text-muted-foreground">Cria um torneio privado, convida os amigos e compete entre si.</p>
      </header>

      {/* Criar novo torneio */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-display text-lg flex items-center gap-2">
          <Plus className="h-5 w-5 text-wc-red" /> Criar Torneio
        </h2>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Nome do torneio (ex: Família Silva)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            maxLength={40}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-wc-red/40"
          />
          <div className="relative">
            <Gift className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Prémio do vencedor (ex: Jantar pago, Camisola...)"
              value={newPrize}
              onChange={e => setNewPrize(e.target.value)}
              maxLength={80}
              className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-wc-red/40"
            />
          </div>
          <button
            onClick={() => newName.trim() && createPool.mutate({ name: newName.trim(), prize: newPrize.trim() })}
            disabled={!newName.trim() || createPool.isPending}
            className="w-full rounded-xl bg-wc-red py-2.5 text-sm font-bold text-white shadow-gold disabled:opacity-50"
          >
            Criar Torneio
          </button>
        </div>
      </div>

      {/* Entrar num torneio */}
      <div className="mb-8 rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-display text-lg flex items-center gap-2">
          <LogIn className="h-5 w-5 text-wc-green" /> Entrar com Código
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Código do torneio (ex: XK92PL)"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && joinCode.trim() && joinPool.mutate(joinCode)}
            maxLength={6}
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-wc-green/40"
          />
          <button
            onClick={() => joinCode.trim() && joinPool.mutate(joinCode)}
            disabled={joinCode.length < 6 || joinPool.isPending}
            className="rounded-xl bg-wc-green px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            Entrar
          </button>
        </div>
      </div>

      {/* Minhas ligas */}
      <h2 className="mb-3 font-display text-xl">Os meus torneios</h2>
      {myPools.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
          <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="font-display text-lg">Ainda sem torneios</p>
          <p className="text-sm text-muted-foreground">Cria um torneio ou entra com um código.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myPools.map((pool: any) => (
            <div key={pool.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="card-stripe" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link to="/liga/$code" params={{ code: pool.code }}
                        className="font-display text-lg hover:text-wc-red transition-smooth">
                        {pool.name}
                      </Link>
                      {pool.created_by === user.id && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 border border-gold/30 px-2 py-0.5 text-[10px] font-bold text-gold">
                          👑 Criador
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {memberCounts[pool.id] ?? 1} membro{(memberCounts[pool.id] ?? 1) !== 1 ? "s" : ""} · código: <span className="font-mono font-bold">{pool.code}</span>
                    </p>
                    {pool.prize && (
                      <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-wc-red">
                        <Gift className="h-3 w-3" /> {pool.prize}
                      </p>
                    )}
                  </div>
                  {pool.created_by === user.id ? (
                    <button
                      onClick={() => {
                        if (confirm(`Eliminar "${pool.name}"? Esta ação não pode ser desfeita.`)) {
                          deletePool.mutate(pool.id);
                        }
                      }}
                      className="text-muted-foreground hover:text-destructive transition-smooth"
                      title="Eliminar torneio"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (confirm(`Sair de "${pool.name}"? Perdes o teu lugar no ranking deste torneio.`)) {
                          leavePool.mutate(pool.id);
                        }
                      }}
                      className="text-xs text-muted-foreground hover:text-destructive transition-smooth border border-border rounded-lg px-2 py-1"
                      title="Sair do torneio"
                    >
                      Sair
                    </button>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <Link to="/liga/$code" params={{ code: pool.code }}
                    className="flex-1 rounded-xl border border-border py-2 text-center text-xs font-bold text-foreground transition-smooth hover:border-wc-red/40 hover:text-wc-red">
                    Ver Ranking
                  </Link>
                  <button
                    onClick={() => shareWhatsApp(pool.code, pool.name)}
                    className="flex items-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-2 text-xs font-bold text-white"
                  >
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.524 5.851L0 24l6.336-1.498A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.373l-.36-.214-3.727.881.933-3.625-.235-.372A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
                    WhatsApp
                  </button>
                  <button
                    onClick={() => copyLink(pool.code, pool.id)}
                    className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold text-muted-foreground transition-smooth hover:border-wc-red/40 hover:text-wc-red"
                  >
                    {copiedId === pool.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedId === pool.id ? "Copiado" : "Link"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
