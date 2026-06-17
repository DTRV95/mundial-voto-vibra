import { useState, useEffect } from "react";
import { X, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { toast } from "sonner";

const QUESTIONS = [
  { key: "design",       label: "Design e visual da app" },
  { key: "facilidade",   label: "Facilidade de uso" },
  { key: "pontos",       label: "Sistema de pontos e rankings" },
  { key: "torneios",     label: "Torneios privados com amigos" },
  { key: "recomendacao", label: "Recomendarias a um amigo?" },
] as const;

type Ratings = Record<typeof QUESTIONS[number]["key"], number>;

const STORAGE_KEY = "feedback_done";
// Show after 3 minutes, but only if not already submitted
const DELAY_MS = 30 * 1000;

export function FeedbackModal() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [ratings, setRatings] = useState<Partial<Ratings>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(t);
  }, [user?.id]);

  function dismiss() {
    setVisible(false);
    // Don't show again for 7 days
    localStorage.setItem(STORAGE_KEY, String(Date.now() + 7 * 24 * 3600 * 1000));
  }

  async function submit() {
    const answered = QUESTIONS.filter(q => ratings[q.key]);
    if (answered.length === 0) { dismiss(); return; }
    setSubmitting(true);
    try {
      await (supabase as any).from("feedback").insert({
        user_id: user?.id ?? null,
        ...ratings,
      });
      localStorage.setItem(STORAGE_KEY, "permanent");
      setDone(true);
      setTimeout(() => setVisible(false), 1800);
    } catch {
      toast.error("Erro ao enviar feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismiss} />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-3xl border border-border bg-card shadow-2xl overflow-hidden sm:mx-4"
        style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>

        {/* Header */}
        <div className="relative px-6 pt-6 pb-4"
          style={{ background: "linear-gradient(135deg, oklch(0.54 0.24 27) 0%, oklch(0.28 0.14 270) 100%)" }}>
          <button onClick={dismiss}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-1.5 text-white/60 hover:text-white transition-smooth">
            <X className="h-4 w-4" />
          </button>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-1">Uma mensagem nossa</p>
          <h2 className="font-display text-2xl text-white leading-tight">Precisamos de ti 💛</h2>
          <p className="text-sm text-white/75 mt-2 leading-relaxed">
            Estamos a construir isto de raiz e cada pessoa que experimenta ajuda-nos a melhorar. O teu olhar detecta o que nós já não conseguimos ver. Juntos, chegamos mais longe.
          </p>
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center py-10 px-6 gap-3">
            <span className="text-5xl">🙏</span>
            <p className="font-display text-xl text-center">Obrigado pelo feedback!</p>
            <p className="text-sm text-muted-foreground text-center">A tua opinião é muito importante para nós.</p>
          </div>
        ) : (
          <>
            <div className="px-6 py-5 space-y-4">
              {QUESTIONS.map(q => (
                <div key={q.key}>
                  <p className="text-sm font-semibold mb-2">{q.label}</p>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(n => {
                      const active = (ratings[q.key] ?? 0) >= n;
                      return (
                        <button
                          key={n}
                          onClick={() => setRatings(r => ({ ...r, [q.key]: n }))}
                          className="transition-transform active:scale-90"
                        >
                          <Star
                            className={`h-8 w-8 transition-colors ${active ? "fill-gold text-gold" : "text-muted-foreground/30"}`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button onClick={dismiss}
                className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold text-muted-foreground hover:bg-accent/50 transition-smooth">
                Agora não
              </button>
              <button onClick={submit} disabled={submitting}
                className="flex-1 rounded-2xl bg-wc-red py-3 text-sm font-bold text-white shadow-gold transition-smooth hover:bg-wc-red/80 disabled:opacity-60">
                {submitting ? "A enviar…" : "Enviar"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
