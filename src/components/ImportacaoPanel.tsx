import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Download, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { buscarImportacao } from "@/lib/importar.functions";
import { aplicarImportacao, type ResultadoImportacao } from "@/lib/aplicarImportacao";
import { useCompetitions } from "@/lib/useCompetitions";

/** Código da competição na API football-data.org, por slug interno. */
const CODIGO_API: Record<string, string> = {
  "liga-portugal": "PPL",
  "champions": "CL",
};

export function ImportacaoPanel() {
  const { data: competicoes = [] } = useCompetitions();
  const [slug, setSlug] = useState<string>("liga-portugal");
  const [epoca, setEpoca] = useState<number>(2026);
  const [estado, setEstado] = useState<"parado" | "a-buscar" | "a-gravar">("parado");
  const [progresso, setProgresso] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);

  const comp = competicoes.find(c => c.slug === slug);

  // Estado atual da base de dados, para o painel de resumo
  const { data: resumo, refetch } = useQuery({
    queryKey: ["import-resumo", comp?.id],
    enabled: !!comp?.id,
    queryFn: async () => {
      const db = supabase as any;
      const [jogos, jornadas, equipas] = await Promise.all([
        db.from("matches").select("id", { count: "exact", head: true }).eq("competition_id", comp!.id),
        db.from("rounds").select("id", { count: "exact", head: true }).eq("competition_id", comp!.id),
        db.from("teams").select("id", { count: "exact", head: true }).eq("kind", "club"),
      ]);
      return { jogos: jogos.count ?? 0, jornadas: jornadas.count ?? 0, equipas: equipas.count ?? 0 };
    },
  });

  async function importar() {
    if (!comp) return;
    setErro(null); setResultado(null);
    setEstado("a-buscar"); setProgresso("A contactar a API…");

    const resposta = await buscarImportacao({
      data: { codigo: CODIGO_API[slug] ?? "PPL", epoca },
    }).catch((e: any) => ({ ok: false as const, erro: e?.message ?? "falha na chamada" }));

    if (!resposta.ok) {
      setErro(resposta.erro + (("status" in resposta && resposta.status) ? ` (HTTP ${resposta.status})` : ""));
      setEstado("parado");
      return;
    }

    setEstado("a-gravar");
    try {
      const epocaLabel = `${epoca}/${String(epoca + 1).slice(2)}`;   // 2026 → "2026/27"
      const r = await aplicarImportacao(comp.id, epocaLabel, resposta.dados, setProgresso);
      setResultado(r);
      refetch();
    } catch (e: any) {
      setErro(e?.message ?? "erro ao gravar");
    }
    setEstado("parado");
  }

  const ocupado = estado !== "parado";

  return (
    <div className="space-y-4">
      {/* Controlos */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="font-display text-lg">Importar da API</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Traz equipas, jogos e cria as jornadas em rascunho. Pode correr as vezes que quiseres — atualiza, não duplica.
        </p>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <select value={slug} onChange={e => setSlug(e.target.value)} disabled={ocupado}
            className="rounded-xl border border-border bg-input px-3 py-2 text-sm">
            {competicoes.map(c => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>

          <select value={epoca} onChange={e => setEpoca(Number(e.target.value))} disabled={ocupado}
            className="rounded-xl border border-border bg-input px-3 py-2 text-sm">
            <option value={2026}>Época 2026/27</option>
            <option value={2025}>Época 2025/26</option>
          </select>

          <button onClick={importar} disabled={ocupado || !comp}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-bold text-background shadow-gold disabled:opacity-50">
            {ocupado
              ? <><RefreshCw className="h-4 w-4 animate-spin" /> {progresso || "A trabalhar…"}</>
              : <><Download className="h-4 w-4" /> Importar</>}
          </button>
        </div>

        {!CODIGO_API[slug] && (
          <p className="mt-2 text-xs text-destructive">Competição sem código de API configurado.</p>
        )}
      </div>

      {/* Erro */}
      {erro && (
        <div className="flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-bold text-destructive">Falhou</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{erro}</p>
          </div>
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <div className="rounded-2xl border border-wc-green/40 bg-wc-green/5 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-wc-green" />
            <p className="text-sm font-bold">Importação concluída</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Metrica rotulo="Equipas novas" valor={resultado.equipasNovas} />
            <Metrica rotulo="Equipas atualizadas" valor={resultado.equipasAtualizadas} />
            <Metrica rotulo="Jogos novos" valor={resultado.jogosNovos} />
            <Metrica rotulo="Jogos atualizados" valor={resultado.jogosAtualizados} />
            <Metrica rotulo="Jornadas criadas" valor={resultado.jornadasCriadas} />
            <Metrica rotulo="Meses criados" valor={resultado.mesesCriados} />
            <Metrica rotulo="Emblemas" valor={resultado.emblemas} />
          </div>
          {resultado.emblemas === 0 && (
            <p className="mt-3 rounded-xl border border-gold/30 bg-gold/5 px-3 py-2 text-xs text-muted-foreground">
              A API não devolveu emblemas. Se acabaste de publicar uma versão nova,
              espera um minuto e volta a importar — o servidor pode ainda estar a correr a versão anterior.
            </p>
          )}

          {resultado.avisos.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
                {resultado.avisos.length} avisos
              </summary>
              <ul className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
                {resultado.avisos.slice(0, 20).map((a, i) => <li key={i}>· {a}</li>)}
              </ul>
            </details>
          )}
        </div>
      )}

      {/* Estado atual na base de dados */}
      {resumo && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Na base de dados · {comp?.name}
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <Metrica rotulo="Jogos" valor={resumo.jogos} />
            <Metrica rotulo="Jornadas" valor={resumo.jornadas} />
            <Metrica rotulo="Clubes" valor={resumo.equipas} />
          </div>
        </div>
      )}
    </div>
  );
}

function Metrica({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 px-3 py-2">
      <p className="font-display text-xl leading-none">{valor}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{rotulo}</p>
    </div>
  );
}
