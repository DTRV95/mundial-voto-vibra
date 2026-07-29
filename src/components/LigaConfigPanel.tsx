import { useState } from "react";
import { toast } from "sonner";
import { Settings2, Check, Swords } from "lucide-react";
import { useCompetitions } from "@/lib/useCompetitions";
import {
  useClubes, useGuardarConfig, ROTULO_FILTRO, EXPLICACAO_FILTRO,
  type ConfigLiga, type FiltroJogos,
} from "@/lib/useLigaConfig";

/**
 * Painel de configuração de uma liga privada.
 * Só aparece ao dono da liga.
 */
export function LigaConfigPanel({ poolId, config }: { poolId: string; config: ConfigLiga }) {
  const [aberto, setAberto] = useState(false);
  const { data: competicoes = [] } = useCompetitions();
  const { data: clubes = [] } = useClubes();
  const guardar = useGuardarConfig(poolId);

  const [comps, setComps] = useState<string[] | null>(config.competition_ids);
  const [filtro, setFiltro] = useState<FiltroJogos>(config.filtro_jogos ?? "todos");
  const [equipaId, setEquipaId] = useState<string | null>(config.equipa_id);
  const [duelos, setDuelos] = useState(config.duelos_ativos ?? true);

  function alternarComp(id: string) {
    const atual = comps ?? competicoes.map(c => c.id);
    const proximo = atual.includes(id) ? atual.filter(x => x !== id) : [...atual, id];
    // Nenhuma escolhida = todas (é o mesmo que não filtrar)
    setComps(proximo.length === 0 || proximo.length === competicoes.length ? null : proximo);
  }

  const compsAtivas = comps ?? competicoes.map(c => c.id);
  const podeGuardar = filtro !== "equipa" || !!equipaId;

  function submeter() {
    guardar.mutate(
      {
        competition_ids: comps,
        filtro_jogos: filtro,
        equipa_id: filtro === "equipa" ? equipaId : null,
        duelos_ativos: duelos,
      },
      {
        onSuccess: () => { toast.success("Regras da liga atualizadas."); setAberto(false); },
        onError: (e: any) => toast.error(e.message),
      },
    );
  }

  if (!aberto) {
    return (
      <button onClick={() => setAberto(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-smooth hover:border-gold/40 hover:text-foreground">
        <Settings2 className="h-3.5 w-3.5" /> Regras da liga
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-gold/30 bg-card p-4">
      <h3 className="mb-1 font-display text-lg">Regras da liga</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Só tu, como criador, podes mudar isto. Aplica-se a partir de já — os pontos já ganhos não se perdem.
      </p>

      {/* Competições */}
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Competições que contam</label>
      <div className="mb-4 mt-1.5 flex gap-2">
        {competicoes.map(c => {
          const on = compsAtivas.includes(c.id);
          return (
            <button key={c.id} onClick={() => alternarComp(c.id)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-smooth"
              style={on
                ? { borderColor: c.accent, background: c.accent, color: "#fff" }
                : { borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
              {on && <Check className="h-3 w-3" />}{c.emoji} {c.short}
            </button>
          );
        })}
      </div>

      {/* Que jogos contam */}
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Que jogos contam</label>
      <div className="mb-4 mt-1.5 space-y-2">
        {(["todos", "grandes", "equipa"] as FiltroJogos[]).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`w-full rounded-xl border px-3 py-2.5 text-left transition-smooth ${
              filtro === f ? "border-gold bg-gold/10" : "border-border hover:border-gold/40"
            }`}>
            <p className="text-sm font-bold">{ROTULO_FILTRO[f]}</p>
            <p className="text-[11px] text-muted-foreground">{EXPLICACAO_FILTRO[f]}</p>
          </button>
        ))}
      </div>

      {/* Escolha do clube */}
      {filtro === "equipa" && (
        <div className="mb-4">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Clube</label>
          <select value={equipaId ?? ""} onChange={e => setEquipaId(e.target.value || null)}
            className="mt-1.5 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm">
            <option value="">Escolhe um clube…</option>
            {clubes.map(c => (
              <option key={c.id} value={c.id}>{c.short_name ?? c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Duelos */}
      <button onClick={() => setDuelos(v => !v)}
        className={`mb-4 flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-smooth ${
          duelos ? "border-gold bg-gold/10" : "border-border"
        }`}>
        <div className="flex items-center gap-2">
          <Swords className={`h-4 w-4 ${duelos ? "text-gold" : "text-muted-foreground"}`} />
          <div>
            <p className="text-sm font-bold">Duelos 1 contra 1</p>
            <p className="text-[11px] text-muted-foreground">Membros podem desafiar-se dentro da liga.</p>
          </div>
        </div>
        <span className={`h-5 w-9 shrink-0 rounded-full p-0.5 transition-smooth ${duelos ? "bg-gold" : "bg-border"}`}>
          <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${duelos ? "translate-x-4" : ""}`} />
        </span>
      </button>

      <div className="flex gap-2">
        <button onClick={() => setAberto(false)}
          className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-muted-foreground">
          Cancelar
        </button>
        <button onClick={submeter} disabled={!podeGuardar || guardar.isPending}
          className="flex-1 rounded-xl bg-gold py-2.5 text-sm font-bold text-background shadow-gold disabled:opacity-50">
          {guardar.isPending ? "A guardar…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}
