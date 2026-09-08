import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { useClubeFavorito, useDefinirClubeFavorito } from "@/lib/useDna";
import { nomeCurto } from "@/lib/clubBadge";
import { toast } from "sonner";

/**
 * "De que clube és?"
 *
 * Aparece a quem tem sessão e ainda não escolheu clube. Não é um
 * pormenor de perfil: metade do DNA — o talismã, o fantasma, o "sem
 * clubismos" — precisa de saber por quem bate o coração, e sem isso
 * essas descobertas nunca chegam a existir.
 *
 * Dá para adiar, e a escolha é para a época inteira: só se pode
 * mudar uma vez, senão bastava trocar de clube para o histórico
 * passar a dizer outra coisa.
 */
export function EscolherClubeModal() {
  const { user } = useAuth();
  const { data: clube, isLoading } = useClubeFavorito(user?.id);
  const definir = useDefinirClubeFavorito(user?.id);

  const [adiado, setAdiado] = useState(() => {
    // Adiar vale para a visita; volta a perguntar na próxima.
    try { return sessionStorage.getItem("clube_adiado") === "1"; } catch { return false; }
  });
  const [procura, setProcura] = useState("");
  const [escolhido, setEscolhido] = useState<string | null>(null);

  const { data: clubes = [] } = useQuery({
    queryKey: ["clubes-para-escolher"],
    staleTime: 600_000,
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("teams")
        .select("id,name,crest_url,country")
        .eq("kind", "club")
        .order("name");
      return (data ?? []) as { id: string; name: string; crest_url: string | null; country: string | null }[];
    },
  });

  // Os portugueses primeiro: é de lá que vem quem usa isto.
  const ordenados = useMemo(() => {
    const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    const q = norm(procura.trim());
    return clubes
      .filter(c => !q || norm(c.name).includes(q))
      .sort((a, b) => {
        const pa = a.country === "Portugal" ? 0 : 1;
        const pb = b.country === "Portugal" ? 0 : 1;
        return pa - pb || a.name.localeCompare(b.name, "pt");
      });
  }, [clubes, procura]);

  const mostrar = !!user && !isLoading && !clube?.team_id && !adiado;
  if (!mostrar || typeof document === "undefined") return null;

  function adiar() {
    try { sessionStorage.setItem("clube_adiado", "1"); } catch { /* noop */ }
    setAdiado(true);
  }

  async function guardar() {
    if (!escolhido) return;
    try {
      await definir.mutateAsync(escolhido);
      toast.success("Clube guardado. O teu DNA já sabe por quem bates.");
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível guardar.");
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-5">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={adiar} />

      <div className="relative z-10 flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-elegant animate-enter sm:rounded-3xl">
        <div className="card-stripe" />

        <div className="flex items-start justify-between gap-3 px-6 pt-6">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              Falta uma coisa
            </p>
            <h2 className="mt-1 font-display text-2xl leading-tight">De que clube és?</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Serve para o teu DNA perceber se o coração te atrapalha as previsões —
              e para descobrires a tua equipa-talismã.
            </p>
          </div>
          <button onClick={adiar} aria-label="Agora não"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-smooth hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={procura}
              onChange={e => setProcura(e.target.value)}
              placeholder="Procurar clube…"
              className="w-full rounded-xl border border-border bg-input/60 py-2.5 pl-9 pr-3 text-sm outline-none transition-smooth focus:border-gold/50"
            />
          </div>
        </div>

        <div className="mt-3 flex-1 overflow-y-auto px-3 pb-2">
          {ordenados.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Nenhum clube com esse nome.
            </p>
          )}
          {ordenados.map(c => {
            const ativo = escolhido === c.id;
            return (
              <button key={c.id} onClick={() => setEscolhido(c.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-smooth ${
                  ativo ? "bg-gold/15 ring-1 ring-gold/40" : "hover:bg-accent/60"
                }`}>
                {c.crest_url
                  ? <img src={c.crest_url} alt="" loading="lazy" className="h-7 w-7 shrink-0 object-contain" />
                  : <span className="h-7 w-7 shrink-0 rounded-full bg-secondary" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{nomeCurto(c.name)}</span>
                  {c.country && c.country !== "Portugal" && (
                    <span className="block text-[11px] text-muted-foreground">{c.country}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className="border-t border-border px-6 py-4">
          <p className="mb-3 text-[11px] text-muted-foreground">
            Só podes mudar uma vez por época — senão bastava trocar de clube
            para o histórico passar a dizer outra coisa.
          </p>
          <div className="flex gap-2">
            <button onClick={adiar}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-smooth hover:text-foreground">
              Agora não
            </button>
            <button onClick={guardar} disabled={!escolhido || definir.isPending}
              className="flex-1 rounded-xl bg-gold py-2.5 text-sm font-bold text-background transition-smooth disabled:opacity-40">
              {definir.isPending ? "A guardar…" : "É este"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
