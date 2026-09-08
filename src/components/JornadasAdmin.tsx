import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star, Check, Send, Undo2, Calendar, AlertTriangle, Wand2 } from "lucide-react";
import { useCompetitions } from "@/lib/useCompetitions";

const MAX_OFICIAIS = 5;

/** Gestão das jornadas oficiais: escolher os 5 jogos e publicar. */
export function JornadasAdmin() {
  const { data: competicoes = [] } = useCompetitions();
  const [slug, setSlug] = useState("liga-portugal");
  const [jornadaId, setJornadaId] = useState<string | null>(null);
  const comp = competicoes.find(c => c.slug === slug);

  const { data: jornadas = [] } = useQuery({
    queryKey: ["admin-rounds", comp?.id],
    enabled: !!comp?.id,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("rounds")
        .select("id,number,label,kind,status,month_id,competition_months(label)")
        .eq("competition_id", comp!.id)
        .order("number", { nullsFirst: false });
      return data ?? [];
    },
  });

  // Quantos oficiais tem cada jornada (para a lista)
  const { data: contagens = {} } = useQuery({
    queryKey: ["admin-rounds-count", comp?.id],
    enabled: !!comp?.id,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("matches").select("round_id").eq("competition_id", comp!.id).eq("is_official", true);
      const c: Record<string, number> = {};
      for (const m of data ?? []) if (m.round_id) c[m.round_id] = (c[m.round_id] ?? 0) + 1;
      return c;
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="font-display text-lg">Jornadas oficiais</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Escolhe os {MAX_OFICIAIS} jogos que contam para o ranking. A votação só abre quando publicares.
        </p>
        <select value={slug} onChange={e => { setSlug(e.target.value); setJornadaId(null); }}
          className="mt-3 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm sm:w-64">
          {competicoes.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
      </div>

      {!jornadaId ? (
        <ListaJornadas jornadas={jornadas} contagens={contagens} onAbrir={setJornadaId} />
      ) : (
        <EditorJornada
          jornadaId={jornadaId}
          competitionId={comp!.id}
          onVoltar={() => setJornadaId(null)}
        />
      )}
    </div>
  );
}

function ListaJornadas({ jornadas, contagens, onAbrir }: {
  jornadas: any[]; contagens: Record<string, number>; onAbrir: (id: string) => void;
}) {
  if (jornadas.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center">
        <Calendar className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Sem jornadas. Faz primeiro a importação.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {jornadas.map(j => {
        const n = contagens[j.id] ?? 0;
        const publicada = j.status === "publicada";
        return (
          <button key={j.id} onClick={() => onAbrir(j.id)}
            className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-left transition-smooth hover:border-gold/40">
            <div className="min-w-0">
              <p className="text-sm font-bold">{j.label}</p>
              <p className="text-[11px] text-muted-foreground">
                {j.competition_months?.label ?? "sem mês"} · {n}/{MAX_OFICIAIS} oficiais
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
              publicada ? "bg-wc-green/15 text-wc-green"
                : n > 0 ? "bg-gold/15 text-gold"
                : "bg-secondary text-muted-foreground"
            }`}>
              {publicada ? "publicada" : n > 0 ? "rascunho" : "vazia"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function EditorJornada({ jornadaId, competitionId, onVoltar }: {
  jornadaId: string; competitionId: string; onVoltar: () => void;
}) {
  const qc = useQueryClient();
  const [aGravar, setAGravar] = useState(false);
  /** Porque é que cada jogo foi sugerido — só para o admin ver */
  const [razoes, setRazoes] = useState<Map<string, string>>(new Map());

  const { data: jornada } = useQuery({
    queryKey: ["admin-round", jornadaId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("rounds").select("*, competition_months(label)").eq("id", jornadaId).maybeSingle();
      return data;
    },
  });

  const { data: jogos = [] } = useQuery({
    queryKey: ["admin-round-matches", jornadaId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("matches")
        .select("id,kickoff_at,is_official,official_position,highlight_tag,status,home_team_id,away_team_id,home:home_team_id(name,short_name,monogram,is_grande),away:away_team_id(name,short_name,monogram,is_grande)")
        .eq("round_id", jornadaId)
        .order("kickoff_at");
      return data ?? [];
    },
  });

  // Quantas previsões há em cada jogo. Vem da vista própria: desde que
  // as previsões dos outros deixaram de ser legíveis antes de votarmos,
  // nem o admin as consegue contar diretamente.
  const { data: votos } = useQuery({
    queryKey: ["admin-round-votes", jornadaId],
    staleTime: 30_000,
    queryFn: async () => {
      const ids = (jogos as any[]).map(j => j.id);
      if (ids.length === 0) return new Map<string, number>();
      const { data } = await (supabase as any)
        .from("v_votos_jogo").select("match_id,votos").in("match_id", ids);
      return new Map<string, number>(((data ?? []) as any[]).map(v => [v.match_id, v.votos ?? 0]));
    },
  });

  const oficiais = jogos.filter((j: any) => j.is_official)
    .sort((a: any, b: any) => (a.official_position ?? 99) - (b.official_position ?? 99));
  const publicada = jornada?.status === "publicada";

  /**
   * Troca um jogo da seleção oficial.
   *
   * Funciona com a jornada publicada — desde que as jornadas passaram a
   * abrir sozinhas, obrigar a despublicar para trocar um jogo era pedir
   * que se fechasse a votação a toda a gente por causa de uma troca.
   * Aqui a votação do jogo acompanha a decisão: entra, abre; sai, fecha.
   */
  async function alternarOficial(jogo: any) {
    const db = supabase as any;
    const jaComecou = new Date(jogo.kickoff_at).getTime() <= Date.now() + 5 * 60_000;
    const comVotos = votos?.get(jogo.id) ?? 0;

    if (jogo.is_official) {
      // Tirar um jogo em que já se votou deita fora o valor dessas
      // previsões. Quem o faz tem de saber quantas são.
      if (comVotos > 0) {
        const certeza = window.confirm(
          `Já há ${comVotos} ${comVotos === 1 ? "previsão" : "previsões"} neste jogo.\n\n` +
          "Se o tirares dos oficiais, essas previsões deixam de contar para os pontos. " +
          "As previsões não se apagam, mas o jogo deixa de valer.\n\nQueres mesmo tirar?",
        );
        if (!certeza) return;
      }
      await db.from("matches")
        .update({ is_official: false, official_position: null, voting_open: false })
        .eq("id", jogo.id);
      toast.success("Jogo retirado dos oficiais.");
    } else {
      if (oficiais.length >= MAX_OFICIAIS) {
        toast.error(`Já tens ${MAX_OFICIAIS} jogos oficiais. Retira um primeiro.`);
        return;
      }
      if (jaComecou) {
        toast.error("Esse jogo já começou — ninguém conseguiria votar nele.");
        return;
      }
      const usadas = new Set(oficiais.map((o: any) => o.official_position));
      let pos = 1; while (usadas.has(pos)) pos++;
      await db.from("matches")
        .update({ is_official: true, official_position: pos, voting_open: publicada })
        .eq("id", jogo.id);
      toast.success(publicada ? "Jogo adicionado. Votação aberta." : "Jogo adicionado.");
    }
    qc.invalidateQueries({ queryKey: ["admin-round-matches", jornadaId] });
    qc.invalidateQueries({ queryKey: ["admin-round-votes", jornadaId] });
    qc.invalidateQueries({ queryKey: ["admin-rounds-count", competitionId] });
  }

  /**
   * Propõe os 5 jogos.
   *
   * Chama a MESMA função que publica as jornadas sozinha, de
   * madrugada. Antes havia dois critérios a decidir a mesma coisa —
   * um aqui em TypeScript e outro no SQL — e o que o admin via ao
   * carregar no botão não era o que sairia sem ninguém a ver.
   *
   * Perdeu-se a explicação por jogo que a versão antiga dava. Vale a
   * troca: uma sugestão que mente sobre o que vai acontecer é pior do
   * que uma sugestão calada.
   */
  async function sugerir() {
    if (publicada) {
      const total = [...(votos?.values() ?? [])].reduce((a, b) => a + b, 0);
      if (total > 0 && !window.confirm(
        `Esta jornada já tem ${total} ${total === 1 ? "previsão" : "previsões"}.\n\n` +
        "Refazer a seleção troca os jogos e essas previsões deixam de contar. Continuar?",
      )) return;
    }

    setAGravar(true);
    const db = supabase as any;

    // A função recusa-se a mexer numa jornada que já tenha escolhas,
    // de propósito — para a automação nunca atropelar ninguém. Aqui o
    // pedido é explícito, por isso limpa-se primeiro.
    await db.from("matches")
      .update({ is_official: false, official_position: null, voting_open: false })
      .eq("round_id", jornadaId);

    const { data: quantos, error } = await db.rpc("escolher_jogos_oficiais", { p_round_id: jornadaId });
    if (error) { toast.error(error.message); setAGravar(false); return; }

    if (publicada) {
      await db.from("matches").update({ voting_open: true })
        .eq("round_id", jornadaId).eq("is_official", true);
    }

    setRazoes(new Map());
    qc.invalidateQueries({ queryKey: ["admin-round-matches", jornadaId] });
    qc.invalidateQueries({ queryKey: ["admin-round-votes", jornadaId] });
    qc.invalidateQueries({ queryKey: ["admin-rounds-count", competitionId] });
    setAGravar(false);

    if ((quantos ?? 0) < 5) {
      toast.error(`Só deu para escolher ${quantos ?? 0} jogos — vê se há jogos suficientes por começar.`);
    } else {
      toast.success("5 jogos escolhidos. Troca o que quiseres.");
    }
  }

  async function marcarDestaque(jogo: any, tag: string | null) {
    await (supabase as any).from("matches").update({ highlight_tag: tag }).eq("id", jogo.id);
    qc.invalidateQueries({ queryKey: ["admin-round-matches", jornadaId] });
  }

  async function publicar() {
    if (oficiais.length !== MAX_OFICIAIS) {
      toast.error(`Precisas de exatamente ${MAX_OFICIAIS} jogos oficiais.`);
      return;
    }
    setAGravar(true);
    const db = supabase as any;
    const ids = oficiais.map((o: any) => o.id);
    const datas = oficiais.map((o: any) => new Date(o.kickoff_at).getTime());

    // Abre votação só nos oficiais
    await db.from("matches").update({ voting_open: true }).in("id", ids);
    await db.from("matches").update({ voting_open: false })
      .eq("round_id", jornadaId).eq("is_official", false);

    await db.from("rounds").update({
      status: "publicada",
      published_at: new Date().toISOString(),
      opens_at: new Date().toISOString(),
      closes_at: new Date(Math.max(...datas)).toISOString(),
    }).eq("id", jornadaId);

    toast.success("Jornada publicada! A votação está aberta.");
    qc.invalidateQueries();
    setAGravar(false);
  }

  async function despublicar() {
    setAGravar(true);
    const db = supabase as any;
    await db.from("matches").update({ voting_open: false }).eq("round_id", jornadaId);
    await db.from("rounds").update({ status: "rascunho", published_at: null }).eq("id", jornadaId);
    toast.success("Jornada em rascunho. Votação fechada.");
    qc.invalidateQueries();
    setAGravar(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="min-w-0">
          <button onClick={onVoltar} className="text-xs text-muted-foreground hover:text-foreground">← Todas as jornadas</button>
          <p className="mt-1 font-display text-xl">{jornada?.label}</p>
          <p className="text-[11px] text-muted-foreground">
            {jornada?.competition_months?.label} · {oficiais.length}/{MAX_OFICIAIS} oficiais
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {!publicada && (
            <button onClick={sugerir} disabled={aGravar || jogos.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-xs font-bold text-gold disabled:opacity-40"
              title="2 de destaque + 2 equilibrados + 1 de rotação">
              <Wand2 className="h-3.5 w-3.5" /> Sugerir 5
            </button>
          )}
          {publicada ? (
            <button onClick={despublicar} disabled={aGravar}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold disabled:opacity-50">
              <Undo2 className="h-3.5 w-3.5" /> Despublicar
            </button>
          ) : (
            <button onClick={publicar} disabled={aGravar || oficiais.length !== MAX_OFICIAIS}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2 text-xs font-bold text-background shadow-gold disabled:opacity-40">
              <Send className="h-3.5 w-3.5" /> Publicar
            </button>
          )}
        </div>
      </div>

      {publicada && (
        <div className="flex items-start gap-2 rounded-xl border border-wc-green/40 bg-wc-green/5 px-3 py-2">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-wc-green" />
          <p className="text-xs text-muted-foreground">
            Publicada — os utilizadores já podem votar nestes {MAX_OFICIAIS} jogos.
          </p>
        </div>
      )}

      {jogos.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">Sem jogos nesta jornada.</p>
        </div>
      )}

      <div className="space-y-2">
        {jogos.map((j: any) => {
          const d = new Date(j.kickoff_at);
          return (
            <div key={j.id}
              className="flex items-center gap-3 rounded-2xl border bg-card px-3 py-2.5"
              style={{ borderColor: j.is_official ? "var(--gold)" : "var(--border)" }}>

              {/* Posição / marcar */}
              <button onClick={() => alternarOficial(j)} disabled={publicada}
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold transition-smooth disabled:opacity-50 ${
                  j.is_official ? "bg-gold text-background" : "border border-border text-muted-foreground hover:border-gold/50"
                }`}
                title={j.is_official ? "Retirar dos oficiais" : "Tornar oficial"}>
                {j.is_official ? j.official_position : <Star className="h-4 w-4" />}
              </button>

              {/* Data */}
              <div className="w-14 shrink-0 text-center">
                <p className="text-[10px] uppercase text-muted-foreground">
                  {d.toLocaleDateString("pt-PT", { weekday: "short", day: "numeric" })}
                </p>
                <p className="text-xs font-bold">
                  {d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              {/* Equipas */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {j.home?.short_name ?? j.home?.name} <span className="text-muted-foreground">vs</span> {j.away?.short_name ?? j.away?.name}
                </p>
                {j.highlight_tag && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gold">{j.highlight_tag}</span>
                )}
                {razoes.has(j.id) && (
                  <p className="truncate text-[10px] text-muted-foreground">{razoes.get(j.id)}</p>
                )}
              </div>

              {/* Marcações manuais */}
              <select value={j.highlight_tag ?? ""} onChange={e => marcarDestaque(j, e.target.value || null)}
                className="shrink-0 rounded-lg border border-border bg-input px-2 py-1 text-[11px]">
                <option value="">—</option>
                <option value="classico">Clássico</option>
                <option value="derbi">Dérbi</option>
                <option value="decisivo">Decisivo</option>
                <option value="destaque">Destaque</option>
              </select>
            </div>
          );
        })}
      </div>

      {!publicada && oficiais.length > 0 && oficiais.length < MAX_OFICIAIS && (
        <div className="flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/5 px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-gold" />
          <p className="text-xs text-muted-foreground">
            Faltam {MAX_OFICIAIS - oficiais.length} jogos para poderes publicar.
          </p>
        </div>
      )}
    </div>
  );
}
