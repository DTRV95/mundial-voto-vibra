import { useState } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { useCompetitions, type Competition } from "@/lib/useCompetitions";
import { useMyCompetitions, useSetMyCompetitions } from "@/lib/useMyCompetitions";
import { useAuth } from "@/lib/useAuth";

/**
 * Pop-up de primeira visita: o utilizador escolhe as competições que quer seguir.
 * Só aparece a quem tem sessão iniciada e ainda não escolheu nenhuma.
 */
export function PickCompetitionsModal() {
  const { user } = useAuth();
  const { data: competitions = [] } = useCompetitions();
  const { data: mine, isLoading } = useMyCompetitions();
  const setMine = useSetMyCompetitions();
  const [picked, setPicked] = useState<string[]>([]);
  const [closed, setClosed] = useState(false);

  const shouldShow =
    !!user && !closed && !isLoading && Array.isArray(mine) && mine.length === 0 && competitions.length > 0;

  if (!shouldShow) return null;

  function toggle(id: string) {
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function confirm() {
    // Sem escolha explícita, segue todas — nunca deixa o utilizador sem competições
    const ids = picked.length > 0 ? picked : competitions.map((c) => c.id);
    await setMine.mutateAsync(ids).catch(() => {});
    setClosed(true);
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-5">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-card shadow-elegant animate-enter">
        <div className="card-stripe" />
        <div className="px-6 pt-6 pb-5">
          <h2 className="font-display text-2xl leading-tight">Que competições queres seguir?</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Escolhe as tuas — só verás essas no site. Podes mudar quando quiseres no teu perfil.
          </p>

          <div className="mt-4 space-y-2.5">
            {competitions.map((c: Competition) => {
              const on = picked.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggle(c.id)}
                  className="flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-smooth"
                  style={
                    on
                      ? { borderColor: c.accent, background: `color-mix(in srgb, ${c.accent} 10%, transparent)` }
                      : { borderColor: "var(--border)" }
                  }
                >
                  <span className="text-2xl">{c.emoji}</span>
                  <span className="flex-1 text-sm font-bold">{c.name}</span>
                  <span
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-smooth"
                    style={
                      on
                        ? { borderColor: c.accent, background: c.accent }
                        : { borderColor: "var(--border)" }
                    }
                  >
                    {on && <Check className="h-3.5 w-3.5 text-white" />}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={confirm}
            disabled={setMine.isPending}
            className="mt-5 w-full rounded-xl bg-gold py-3 text-sm font-bold text-background shadow-gold transition-smooth hover:scale-[1.02] active:scale-95 disabled:opacity-60"
          >
            {setMine.isPending ? "A guardar…" : picked.length > 0 ? "Continuar" : "Seguir todas"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
