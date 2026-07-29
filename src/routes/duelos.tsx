import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { UserAvatar } from "@/components/AvatarPicker";
import { useCompetitions } from "@/lib/useCompetitions";
import { useMeses, mesAtual } from "@/lib/usePontos";
import {
  useMeusDuelos, useRankingDuelos, useRivalidades, useDesafiar, useResponderDuelo,
  useDuelosEsteMes, mesCorrente, PESO_DUELO, ROTULO_DUELO, EXPLICACAO_DUELO,
  type TipoDuelo, type Duelo,
} from "@/lib/useDuelos";
import { Swords, Trophy, History, Search, Check, X, Clock, Info } from "lucide-react";
import { toast } from "sonner";
import { PageTabs, ABAS_SOCIAL } from "@/components/PageTabs";
import { CompetitionAtmosphere, PageHeader } from "@/components/CompetitionAtmosphere";
import { useActiveCompetition } from "@/lib/useActiveCompetition";

export const Route = createFileRoute("/duelos")({
  head: () => ({
    meta: [
      { title: "Duelos — Uma Geração" },
      { name: "description", content: "Desafia outros adeptos para um duelo 1 contra 1: por jogo, por jornada ou pelo mês inteiro." },
      { property: "og:title", content: "Duelos — Uma Geração" },
      { property: "og:url", content: "https://geracao2026.com/duelos" },
    ],
    links: [{ rel: "canonical", href: "https://geracao2026.com/duelos" }],
  }),
  component: Duelos,
});

function Duelos() {
  const { user } = useAuth();
  const { active } = useActiveCompetition();
  const [tab, setTab] = useState<"ativos" | "ranking" | "rivalidades">("ativos");
  const [aDesafiar, setADesafiar] = useState(false);

  const { data: duelos = [], isLoading } = useMeusDuelos(user?.id);

  if (!user) {
    return (
      <div className="px-5 pt-6">
        <h1 className="font-display text-3xl">Duelos</h1>
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
          <Swords className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="font-display text-lg">Inicia sessão para desafiar</p>
          <Link to="/auth" className="mt-4 inline-block rounded-full bg-gold px-5 py-2 text-sm font-bold text-background">
            Entrar
          </Link>
        </div>
      </div>
    );
  }

  const pendentes = duelos.filter(d => d.estado === "pendente");
  const aRecebidos = pendentes.filter(d => !d.sou_desafiante);
  const emCurso = duelos.filter(d => d.estado === "aceite");
  const terminados = duelos.filter(d => d.estado === "resolvido");

  return (
    <div className="px-5 pt-6 pb-10">
      <CompetitionAtmosphere comp={active} />

      <PageHeader
        title="Duelos"
        subtitle="Um contra um. Ganhar dá pontos no ranking de duelos."
        comp={active}
        acao={
          <button onClick={() => setADesafiar(true)}
            className="rounded-full px-4 py-2 text-sm font-bold text-white transition-smooth"
            style={{
              background: active ? `linear-gradient(135deg, ${active.accent}, ${active.deep})` : "var(--gold)",
              boxShadow: active ? `0 6px 20px ${active.glow}` : undefined,
            }}>
            Desafiar
          </button>
        }
      />

      <PageTabs abas={ABAS_SOCIAL} />

      {/* Como funciona */}
      <div className="mb-5 flex items-start gap-2 rounded-2xl border border-border bg-card/50 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="text-xs text-muted-foreground">
          <p><span className="font-semibold text-foreground">Vitória 3 · Empate 1 · Derrota 0</span>, multiplicado pelo tipo de duelo:</p>
          <p className="mt-0.5">Jogo <span className="font-semibold text-foreground">×2</span> · Jornada <span className="font-semibold text-foreground">×3</span> · Mês <span className="font-semibold text-foreground">×6</span></p>
          <p className="mt-1">O ranking reinicia todos os meses. Contra o mesmo adversário só contam 2 duelos por mês.</p>
        </div>
      </div>

      <div className="mb-5 flex gap-2">
        {([
          ["ativos", <Swords className="h-3.5 w-3.5" key="a" />, `Ativos${aRecebidos.length ? ` (${aRecebidos.length})` : ""}`],
          ["ranking", <Trophy className="h-3.5 w-3.5" key="r" />, "Ranking"],
          ["rivalidades", <History className="h-3.5 w-3.5" key="h" />, "Rivalidades"],
        ] as const).map(([k, icon, rotulo]) => (
          <button key={k} onClick={() => setTab(k as any)}
            className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-smooth ${
              tab === k ? "border-gold bg-gold text-background" : "border-border bg-card/60 text-muted-foreground hover:border-gold/40"
            }`}>
            {icon}{rotulo}
          </button>
        ))}
      </div>

      {tab === "ativos" && (
        <div className="space-y-6">
          {isLoading && <div className="shimmer h-24 rounded-2xl" />}

          {!isLoading && duelos.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
              <Swords className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="font-display text-lg">Ainda sem duelos</p>
              <p className="mt-1 text-sm text-muted-foreground">Desafia alguém e começa a rivalidade.</p>
            </div>
          )}

          <Seccao titulo="Desafios recebidos" lista={aRecebidos} vazio={null} responder />
          <Seccao titulo="À espera de resposta" lista={pendentes.filter(d => d.sou_desafiante)} vazio={null} />
          <Seccao titulo="Em curso" lista={emCurso} vazio={null} />
          <Seccao titulo="Terminados" lista={terminados} vazio={null} />
        </div>
      )}

      {tab === "ranking" && <RankingDuelos meuId={user.id} />}
      {tab === "rivalidades" && <Rivalidades meuId={user.id} />}

      {aDesafiar && <ModalDesafiar meuId={user.id} aoFechar={() => setADesafiar(false)} />}
    </div>
  );
}

// ── Lista de duelos ───────────────────────────────────────────
function Seccao({ titulo, lista, responder }: {
  titulo: string; lista: Duelo[]; vazio: null; responder?: boolean;
}) {
  if (lista.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">{titulo}</h2>
      <div className="space-y-2">
        {lista.map(d => <CartaoDuelo key={d.id} duelo={d} responder={responder} />)}
      </div>
    </section>
  );
}

function CartaoDuelo({ duelo, responder }: { duelo: Duelo; responder?: boolean }) {
  const responderDuelo = useResponderDuelo();

  const meus = duelo.sou_desafiante ? duelo.pontos_desafiante : duelo.pontos_adversario;
  const dele = duelo.sou_desafiante ? duelo.pontos_adversario : duelo.pontos_desafiante;
  const ganhei = duelo.resultado === (duelo.sou_desafiante ? "desafiante" : "adversario");
  const empate = duelo.resultado === "empate";

  const cor = duelo.estado !== "resolvido" ? "border-border"
    : empate ? "border-muted-foreground/30"
    : ganhei ? "border-wc-green/40 bg-wc-green/5" : "border-wc-red/30 bg-wc-red/5";

  return (
    <div className={`rounded-2xl border bg-card/60 px-4 py-3 ${cor}`}>
      <div className="flex items-center gap-3">
        <UserAvatar avatarUrl={duelo.outro?.avatar_url ?? null} name={duelo.outro?.display_name ?? "—"} size={9} className="shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{duelo.outro?.display_name ?? "—"}</p>
          <p className="text-[11px] text-muted-foreground">
            {ROTULO_DUELO[duelo.tipo]} · ×{PESO_DUELO[duelo.tipo]}
            {duelo.pool_id ? " · numa liga" : ""}
            {duelo.estado === "resolvido" && !duelo.vale_pontos && " · não conta (limite mensal)"}
          </p>
        </div>

        {duelo.estado === "resolvido" ? (
          <div className="shrink-0 text-right">
            <p className={`font-display text-xl leading-none ${empate ? "text-muted-foreground" : ganhei ? "text-wc-green" : "text-wc-red"}`}>
              {meus ?? 0} – {dele ?? 0}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {empate ? "Empate" : ganhei ? "Vitória" : "Derrota"}
            </p>
          </div>
        ) : duelo.estado === "aceite" ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold">
            <Clock className="h-3 w-3" /> Em curso
          </span>
        ) : responder ? (
          <div className="flex shrink-0 gap-1.5">
            <button
              onClick={() => responderDuelo.mutate({ id: duelo.id, aceitar: true }, {
                onSuccess: () => toast.success("Desafio aceite!"),
                onError: (e: any) => toast.error(e.message),
              })}
              disabled={responderDuelo.isPending}
              className="grid h-8 w-8 place-items-center rounded-full bg-wc-green/20 text-wc-green disabled:opacity-50">
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => responderDuelo.mutate({ id: duelo.id, aceitar: false }, {
                onSuccess: () => toast("Desafio recusado."),
                onError: (e: any) => toast.error(e.message),
              })}
              disabled={responderDuelo.isPending}
              className="grid h-8 w-8 place-items-center rounded-full bg-wc-red/20 text-wc-red disabled:opacity-50">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Pendente
          </span>
        )}
      </div>
    </div>
  );
}

// ── Ranking de duelos ─────────────────────────────────────────
function RankingDuelos({ meuId }: { meuId: string }) {
  const mes = mesCorrente();
  const { data: ranking = [], isLoading } = useRankingDuelos(mes);

  if (isLoading) return <div className="shimmer h-40 rounded-2xl" />;
  if (ranking.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
        <Trophy className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
        <p className="font-display text-lg">Ranking ainda vazio</p>
        <p className="mt-1 text-sm text-muted-foreground">Aparece aqui assim que os primeiros duelos deste mês forem resolvidos.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/70">
      <div className="border-b border-border px-4 py-2.5">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Este mês</p>
      </div>
      <div className="divide-y divide-border/50">
        {ranking.map(l => (
          <div key={l.user_id} className={`flex items-center gap-3 px-4 py-2.5 ${l.user_id === meuId ? "bg-gold/5" : ""}`}>
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
              l.rank === 1 ? "bg-gold text-background" : l.rank <= 3 ? "bg-gold/25 text-gold" : "bg-secondary text-muted-foreground"
            }`}>{l.rank}</span>
            <Link to="/adepto/$id" params={{ id: l.user_id }} className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-80">
              <UserAvatar avatarUrl={l.avatar_url} name={l.display_name ?? "—"} size={7} className="shrink-0 rounded-full" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{l.display_name ?? "—"}{l.user_id === meuId && " (tu)"}</p>
                <p className="text-[10px] text-muted-foreground">{l.vitorias}V · {l.empates}E · {l.derrotas}D</p>
              </div>
            </Link>
            <span className="shrink-0 font-display text-lg text-gold">{l.pontos}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Rivalidades ───────────────────────────────────────────────
function Rivalidades({ meuId }: { meuId: string }) {
  const { data: rivais = [], isLoading } = useRivalidades(meuId);

  if (isLoading) return <div className="shimmer h-40 rounded-2xl" />;
  if (rivais.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
        <History className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
        <p className="font-display text-lg">Sem rivalidades ainda</p>
        <p className="mt-1 text-sm text-muted-foreground">O confronto direto contra cada adversário fica guardado para sempre.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rivais.map(r => (
        <Link key={r.adversario} to="/adepto/$id" params={{ id: r.adversario }}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 px-4 py-3 transition-smooth hover:brightness-110">
          <UserAvatar avatarUrl={r.avatar_url} name={r.display_name ?? "—"} size={9} className="shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{r.display_name ?? "—"}</p>
            <p className="text-[11px] text-muted-foreground">{r.duelos} duelo{r.duelos !== 1 ? "s" : ""}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-xl leading-none">
              <span className="text-wc-green">{r.vitorias}</span>
              <span className="text-muted-foreground"> – {r.empates} – </span>
              <span className="text-wc-red">{r.derrotas}</span>
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">V · E · D</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ── Modal de desafio ──────────────────────────────────────────
function ModalDesafiar({ meuId, aoFechar }: { meuId: string; aoFechar: () => void }) {
  const [procura, setProcura] = useState("");
  const [alvo, setAlvo] = useState<{ id: string; display_name: string | null; avatar_url: string | null } | null>(null);
  const [tipo, setTipo] = useState<TipoDuelo>("jornada");
  const [compId, setCompId] = useState<string | null>(null);

  const { data: competicoes = [] } = useCompetitions();
  const competicao = competicoes.find(c => c.id === compId) ?? competicoes[0] ?? null;

  const desafiar = useDesafiar();
  const { data: jaFeitos = 0 } = useDuelosEsteMes(meuId, alvo?.id);

  // Adeptos que correspondem à procura
  const { data: resultados = [] } = useQuery({
    queryKey: ["procurar-adeptos", procura],
    enabled: procura.trim().length >= 2,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,display_name,avatar_url")
        .ilike("display_name", `%${procura.trim()}%`)
        .neq("id", meuId)
        .limit(8);
      return data ?? [];
    },
  });

  // Alvo do duelo: a próxima jornada publicada, ou o mês em curso
  const { data: meses = [] } = useMeses(competicao?.id);
  const mes = mesAtual(meses);

  const { data: jornada } = useQuery({
    queryKey: ["jornada-para-duelo", competicao?.id],
    enabled: !!competicao?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("rounds")
        .select("id,label,number")
        .eq("competition_id", competicao!.id)
        .eq("status", "publicada")
        .order("number", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as { id: string; label: string; number: number } | null;
    },
  });

  const alvoDescrito = useMemo(() => {
    if (tipo === "jornada") return jornada?.label ?? null;
    if (tipo === "mes") return mes?.label ?? null;
    return null;   // duelos de jogo lançam-se a partir da página do jogo
  }, [tipo, jornada, mes]);

  const podeEnviar = !!alvo && !!competicao && !!alvoDescrito && !desafiar.isPending;

  function enviar() {
    if (!alvo || !competicao) return;
    desafiar.mutate(
      {
        desafiante_id: meuId,
        adversario_id: alvo.id,
        tipo,
        competition_id: competicao.id,
        round_id: tipo === "jornada" ? jornada?.id : null,
        month_id: tipo === "mes" ? mes?.id : null,
      },
      {
        onSuccess: () => { toast.success(`Desafio enviado a ${alvo.display_name ?? "adepto"}!`); aoFechar(); },
        onError: (e: any) => toast.error(e.message),
      },
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/60 p-0 sm:place-items-center sm:p-4" onClick={aoFechar}>
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border border-border bg-card p-5 sm:max-w-md sm:rounded-3xl"
        onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl">Lançar desafio</h2>
          <button onClick={aoFechar} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        {/* Quem */}
        {!alvo ? (
          <>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contra quem</label>
            <div className="relative mt-1.5">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={procura} onChange={e => setProcura(e.target.value)} autoFocus
                placeholder="Procurar pelo nome…"
                className="w-full rounded-xl border border-border bg-input py-2.5 pl-9 pr-3 text-sm" />
            </div>
            <div className="mt-2 space-y-1">
              {resultados.map((p: any) => (
                <button key={p.id} onClick={() => setAlvo(p)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-accent/50">
                  <UserAvatar avatarUrl={p.avatar_url} name={p.display_name} size={7} className="rounded-full" />
                  <span className="truncate text-sm font-semibold">{p.display_name}</span>
                </button>
              ))}
              {procura.trim().length >= 2 && resultados.length === 0 && (
                <p className="px-2 py-3 text-sm text-muted-foreground">Ninguém encontrado.</p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-gold/30 bg-gold/5 px-3 py-2.5">
              <UserAvatar avatarUrl={alvo.avatar_url} name={alvo.display_name ?? "—"} size={8} className="rounded-full" />
              <span className="flex-1 truncate text-sm font-bold">{alvo.display_name}</span>
              <button onClick={() => setAlvo(null)} className="text-xs font-semibold text-muted-foreground hover:text-foreground">Mudar</button>
            </div>

            {jaFeitos >= 2 && (
              <p className="mb-3 rounded-xl border border-gold/30 bg-gold/5 px-3 py-2 text-[11px] text-muted-foreground">
                Já tiveste 2 duelos pontuados com este adepto este mês. Podem jogar à mesma, mas este não conta para o ranking.
              </p>
            )}

            {/* Competição */}
            {competicoes.length > 1 && (
              <>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Competição</label>
                <div className="mb-4 mt-1.5 flex gap-2">
                  {competicoes.map(c => (
                    <button key={c.id} onClick={() => setCompId(c.id)}
                      className="flex-1 rounded-xl border px-3 py-2 text-xs font-bold transition-smooth"
                      style={c.id === competicao?.id
                        ? { borderColor: c.accent, background: c.accent, color: "#fff" }
                        : { borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                      {c.emoji} {c.short}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Tipo */}
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo de duelo</label>
            <div className="mb-4 mt-1.5 space-y-2">
              {(["jornada", "mes"] as TipoDuelo[]).map(t => (
                <button key={t} onClick={() => setTipo(t)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-smooth ${
                    tipo === t ? "border-gold bg-gold/10" : "border-border hover:border-gold/40"
                  }`}>
                  <div>
                    <p className="text-sm font-bold">{ROTULO_DUELO[t]}</p>
                    <p className="text-[11px] text-muted-foreground">{EXPLICACAO_DUELO[t]}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-bold text-gold">×{PESO_DUELO[t]}</span>
                </button>
              ))}
              <p className="text-[11px] text-muted-foreground">
                Para duelos de um jogo só, lança o desafio a partir da página desse jogo.
              </p>
            </div>

            {/* Alvo */}
            <div className="mb-4 rounded-xl border border-border bg-background/40 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">A disputar</p>
              <p className="text-sm font-bold">
                {alvoDescrito ?? "Nada disponível — ainda não há jornada publicada"}
              </p>
            </div>

            <button onClick={enviar} disabled={!podeEnviar}
              className="w-full rounded-xl bg-gold py-3 text-sm font-bold text-background shadow-gold disabled:opacity-50">
              {desafiar.isPending ? "A enviar…" : "Enviar desafio"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
