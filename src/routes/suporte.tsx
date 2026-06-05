import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { MessageCircle, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/suporte")({
  component: SuportePage,
});

function SuportePage() {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [done, setDone] = useState(false);

  const send = useMutation({
    mutationFn: async () => {
      if (!message.trim()) throw new Error("Escreve uma mensagem.");
      const { error } = await supabase.from("support_messages").insert({
        user_id: user?.id ?? null,
        email: email.trim() || null,
        subject: subject.trim() || null,
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setDone(true);
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao enviar. Tenta novamente."),
  });

  return (
    <div className="mx-auto max-w-lg px-5 py-10 md:py-14">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-wc-red">
          <MessageCircle className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl leading-none">Suporte</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Estamos aqui para ajudar.</p>
        </div>
      </div>

      {done ? (
        <div className="rounded-2xl border border-wc-green/30 bg-wc-green/5 p-8 text-center">
          <CheckCircle className="mx-auto mb-3 h-10 w-10 text-wc-green" />
          <p className="font-display text-xl mb-1">Mensagem enviada!</p>
          <p className="text-sm text-muted-foreground">Receberemos a tua mensagem e responderemos o mais brevemente possível.</p>
          <button
            onClick={() => { setDone(false); setSubject(""); setMessage(""); }}
            className="mt-5 rounded-xl border border-border px-5 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-smooth"
          >
            Enviar outra mensagem
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {!user && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                O teu email
              </label>
              <input
                type="email"
                placeholder="para podermos responder"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-card/60 px-4 py-3 text-sm outline-none focus:border-wc-red/50 focus:ring-1 focus:ring-wc-red/20 transition-smooth"
              />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Assunto
            </label>
            <input
              type="text"
              placeholder="ex: problema no ranking, dúvida sobre pontos…"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border border-border bg-card/60 px-4 py-3 text-sm outline-none focus:border-wc-red/50 focus:ring-1 focus:ring-wc-red/20 transition-smooth"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Mensagem <span className="text-wc-red">*</span>
            </label>
            <textarea
              rows={5}
              placeholder="Descreve o teu problema ou questão…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-xl border border-border bg-card/60 px-4 py-3 text-sm outline-none focus:border-wc-red/50 focus:ring-1 focus:ring-wc-red/20 transition-smooth resize-none"
            />
          </div>
          <button
            onClick={() => send.mutate()}
            disabled={send.isPending || !message.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-wc-red py-3 text-sm font-bold text-white shadow-gold transition-smooth hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:scale-100"
          >
            <Send className="h-4 w-4" />
            {send.isPending ? "A enviar…" : "Enviar mensagem"}
          </button>
        </div>
      )}
    </div>
  );
}
