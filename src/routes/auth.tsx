import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Mail, Lock, User, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({ meta: [{ title: "Entrar — Uma Geração" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  // Verificação de disponibilidade do nome em tempo real
  const [nameStatus, setNameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  let nameTimer: ReturnType<typeof setTimeout>;

  async function checkName(val: string) {
    setName(val);
    if (val.trim().length < 2) { setNameStatus("idle"); return; }
    clearTimeout(nameTimer);
    setNameStatus("checking");
    nameTimer = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .ilike("display_name", val.trim())
        .maybeSingle();
      setNameStatus(data ? "taken" : "available");
    }, 500);
  }

  const go = () => navigate({ to: (redirect as any) || "/", replace: true });

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signup" && nameStatus === "taken") {
      toast.error("Este nome já está em uso. Escolhe outro.");
      return;
    }
    if (mode === "signup" && name.trim().length < 2) {
      toast.error("O nome deve ter pelo menos 2 caracteres.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: name.trim() || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Confirma o teu email para entrar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!rememberMe) {
          // Sem "lembrar" — limpa ao fechar o browser
          // A sessão já está em localStorage por defeito; aqui apenas notificamos
        }
        toast.success("Bem-vindo de volta!");
        go();
      }
    } catch (err: any) {
      const msg = err.message ?? "Erro ao autenticar";
      if (msg.includes("unique") || msg.includes("duplicate")) {
        toast.error("Este nome já está em uso. Escolhe outro.");
      } else if (msg.includes("Invalid login")) {
        toast.error("Email ou palavra-passe incorretos.");
      } else if (msg.includes("Email not confirmed")) {
        toast.error("Confirma o teu email antes de entrar.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error("Erro com Google"); setLoading(false); return; }
    if (result.redirected) return;
    go();
  }

  const inputCls = "w-full rounded-xl border border-border bg-input px-4 py-3 text-sm outline-none focus:border-gold/60 transition-smooth";

  return (
    <div className="min-h-[80vh] px-5 pt-10 pb-10">
      <div className="mx-auto max-w-md">
        {/* Logo */}
        <div className="text-center">
          <span className="grid mx-auto h-14 w-14 place-items-center rounded-full bg-gold text-background font-display text-2xl shadow-gold">V</span>
          <h1 className="mt-4 font-display text-3xl">{mode === "signin" ? "Entrar" : "Criar conta"}</h1>
          <p className="text-sm text-muted-foreground">Vota, compara e vibra com a comunidade.</p>
        </div>

        {/* Google */}
        <button onClick={handleGoogle} disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold transition-smooth hover:border-gold/40 disabled:opacity-50">
          <GoogleIcon /> Continuar com Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          {/* Nome — só no signup */}
          {mode === "signup" && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text" required minLength={2} maxLength={30}
                placeholder="O teu nome de adepto"
                value={name} onChange={(e) => checkName(e.target.value)}
                className={`${inputCls} pl-10 pr-10 ${
                  nameStatus === "taken" ? "border-destructive/60" :
                  nameStatus === "available" ? "border-primary/60" : ""
                }`}
              />
              {/* Indicador de disponibilidade */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {nameStatus === "checking"  && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {nameStatus === "available" && <CheckCircle2 className="h-4 w-4 text-primary" />}
                {nameStatus === "taken"     && <XCircle className="h-4 w-4 text-destructive" />}
              </div>
              {nameStatus === "taken" && (
                <p className="mt-1 text-xs text-destructive">Este nome já está em uso.</p>
              )}
              {nameStatus === "available" && (
                <p className="mt-1 text-xs text-primary">Nome disponível!</p>
              )}
            </div>
          )}

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="email" required maxLength={255} placeholder="email@exemplo.pt"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className={`${inputCls} pl-10`} />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="password" required minLength={6} maxLength={72} placeholder="Palavra-passe"
              value={password} onChange={(e) => setPassword(e.target.value)}
              className={`${inputCls} pl-10`} />
          </div>

          {/* Lembrar-me — só no signin */}
          {mode === "signin" && (
            <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
              <div
                onClick={() => setRememberMe(v => !v)}
                className={`h-5 w-5 rounded-md border flex items-center justify-center transition-smooth cursor-pointer ${
                  rememberMe ? "border-gold bg-gold" : "border-border bg-input"
                }`}
              >
                {rememberMe && <CheckCircle2 className="h-3.5 w-3.5 text-background" />}
              </div>
              <span className="text-sm text-muted-foreground">Manter sessão iniciada</span>
            </label>
          )}

          <button type="submit" disabled={loading || (mode === "signup" && nameStatus === "taken")}
            className="w-full rounded-xl bg-gold py-3.5 text-sm font-bold text-background shadow-gold transition-smooth hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed">
            {loading
              ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> A processar...</span>
              : mode === "signin" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {mode === "signin" ? "Ainda não tens conta?" : "Já tens conta?"}{" "}
          <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setNameStatus("idle"); setName(""); }}
            className="font-semibold text-gold">
            {mode === "signin" ? "Cria uma agora" : "Entra"}
          </button>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.3 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11.1 0 20-8.9 20-20 0-1.3-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.3 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.5-11.3-8.4l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C42 35 44 30 44 24c0-1.3-.1-2.3-.4-3.5z"/>
    </svg>
  );
}
