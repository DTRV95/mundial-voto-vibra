import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Lock, User, CheckCircle2, XCircle, Loader2, ArrowLeft, KeyRound, Eye, EyeOff, Trophy, Star, Users } from "lucide-react";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({ meta: [{ title: "Entrar — Uma Geração" }] }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot" | "reset";

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [name, setName] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nameStatus, setNameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  let nameTimer: ReturnType<typeof setTimeout>;

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token")) {
      setMode("reset");
    }
  }, []);

  async function checkName(val: string) {
    setName(val);
    if (val.trim().length < 2) { setNameStatus("idle"); return; }
    clearTimeout(nameTimer);
    setNameStatus("checking");
    nameTimer = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles").select("id").ilike("display_name", val.trim()).maybeSingle();
      setNameStatus(data ? "taken" : "available");
    }, 500);
  }

  const go = () => navigate({ to: (redirect as any) || "/", replace: true });

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signup" && nameStatus === "taken") { toast.error("Este nome já está em uso."); return; }
    if (mode === "signup" && name.trim().length < 2) { toast.error("O nome deve ter pelo menos 2 caracteres."); return; }
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
        toast.success("Bem-vindo de volta!");
        go();
      }
    } catch (err: any) {
      const msg = err.message ?? "";
      if (msg.includes("unique") || msg.includes("duplicate")) toast.error("Este nome já está em uso.");
      else if (msg.includes("Invalid login")) toast.error("Email ou palavra-passe incorretos.");
      else if (msg.includes("Email not confirmed")) toast.error("Confirma o teu email antes de entrar.");
      else toast.error(msg || "Erro ao autenticar");
    } finally { setLoading(false); }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { toast.error("Introduz o teu email."); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Email de recuperação enviado! Verifica a tua caixa de entrada.");
    setMode("signin");
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error("A palavra-passe deve ter pelo menos 6 caracteres."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Palavra-passe actualizada com sucesso!");
    window.location.hash = "";
    navigate({ to: "/", replace: true });
  }

  async function handleGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) { toast.error("Erro com Google: " + error.message); setLoading(false); }
  }

  const inputCls = "w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-gold/70 focus:bg-background focus:ring-2 focus:ring-gold/10 transition-all duration-200";

  return (
    <div className="flex min-h-[90vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">

        {/* ── Cabeçalho ── */}
        <div className="mb-8 text-center">
          <div className="relative inline-flex">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-gold to-gold/70 text-background font-display text-3xl shadow-gold">
              V
            </span>
            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-wc-red text-[9px] font-bold text-white shadow-md">
              26
            </span>
          </div>
          <h1 className="mt-4 font-display text-3xl tracking-tight">
            {mode === "signin"  ? "Bem-vindo de volta" :
             mode === "signup"  ? "Criar conta" :
             mode === "forgot"  ? "Recuperar acesso" :
                                  "Nova palavra-passe"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "forgot"
              ? "Envia-nos o teu email e receberes um link."
              : mode === "reset"
              ? "Define a tua nova palavra-passe."
              : mode === "signup"
              ? "Junta-te à comunidade do Mundial 2026."
              : "Vota, compara e vibra com a comunidade."}
          </p>
        </div>

        {/* ── Card principal ── */}
        <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-elegant backdrop-blur-sm">

          {/* ── RECUPERAR PALAVRA-PASSE ── */}
          {mode === "forgot" && (
            <form onSubmit={handleForgot} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="email" required placeholder="email@exemplo.pt"
                  value={email} onChange={e => setEmail(e.target.value)}
                  className={`${inputCls} pl-10`} />
              </div>
              <button type="submit" disabled={loading}
                className="group w-full rounded-xl bg-gold py-3.5 text-sm font-bold text-background shadow-gold transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_20px_oklch(0.82_0.15_88_/_0.5)] active:scale-[0.98] disabled:opacity-50">
                {loading
                  ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> A enviar...</span>
                  : "Enviar link de recuperação"}
              </button>
              <button type="button" onClick={() => setMode("signin")}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-sm text-muted-foreground transition-all duration-200 hover:border-border/80 hover:bg-accent hover:text-foreground active:scale-[0.98]">
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao login
              </button>
            </form>
          )}

          {/* ── NOVA PALAVRA-PASSE ── */}
          {mode === "reset" && (
            <form onSubmit={handleReset} className="space-y-3">
              <div className="rounded-xl border border-gold/30 bg-gold/8 p-4 text-sm text-gold flex items-center gap-2">
                <KeyRound className="h-4 w-4 shrink-0" />
                Define a tua nova palavra-passe abaixo.
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type={showNewPassword ? "text" : "password"} required minLength={6}
                  placeholder="Nova palavra-passe (mín. 6 caracteres)"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  className={`${inputCls} pl-10 pr-10`} />
                <button type="button" onClick={() => setShowNewPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground">
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button type="submit" disabled={loading}
                className="w-full rounded-xl bg-gold py-3.5 text-sm font-bold text-background shadow-gold transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_20px_oklch(0.82_0.15_88_/_0.5)] active:scale-[0.98] disabled:opacity-50">
                {loading
                  ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> A guardar...</span>
                  : "Guardar nova palavra-passe"}
              </button>
            </form>
          )}

          {/* ── SIGNIN / SIGNUP ── */}
          {(mode === "signin" || mode === "signup") && (
            <>
              {/* Google */}
              <button onClick={handleGoogle} disabled={loading}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-background/50 px-4 py-3 text-sm font-semibold transition-all duration-200 hover:border-gold/40 hover:bg-accent hover:shadow-sm active:scale-[0.98] disabled:opacity-50">
                <GoogleIcon /> Continuar com Google
              </button>

              <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground/60">
                <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={handleEmail} className="space-y-3">
                {mode === "signup" && (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input type="text" required minLength={2} maxLength={30}
                      placeholder="O teu nome de adepto"
                      value={name} onChange={e => checkName(e.target.value)}
                      className={`${inputCls} pl-10 pr-10 ${
                        nameStatus === "taken"     ? "border-destructive/60 focus:border-destructive/60 focus:ring-destructive/10" :
                        nameStatus === "available" ? "border-green-500/60 focus:border-green-500/60 focus:ring-green-500/10" : ""}`} />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {nameStatus === "checking"  && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                      {nameStatus === "available" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {nameStatus === "taken"     && <XCircle className="h-4 w-4 text-destructive" />}
                    </div>
                    {nameStatus === "taken"     && <p className="mt-1 text-xs text-destructive">Este nome já está em uso.</p>}
                    {nameStatus === "available" && <p className="mt-1 text-xs text-green-500">Nome disponível!</p>}
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type="email" required maxLength={255} placeholder="email@exemplo.pt"
                    value={email} onChange={e => setEmail(e.target.value)}
                    className={`${inputCls} pl-10`} />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type={showPassword ? "text" : "password"} required minLength={6} maxLength={72}
                    placeholder="Palavra-passe"
                    value={password} onChange={e => setPassword(e.target.value)}
                    className={`${inputCls} pl-10 pr-10`} />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {mode === "signin" && (
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex cursor-pointer select-none items-center gap-2.5">
                      <div onClick={() => setRememberMe(v => !v)}
                        className={`flex h-5 w-5 cursor-pointer items-center justify-center rounded-md border transition-all duration-150 ${
                          rememberMe
                            ? "border-gold bg-gold shadow-sm"
                            : "border-border bg-input hover:border-gold/40"}`}>
                        {rememberMe && <CheckCircle2 className="h-3.5 w-3.5 text-background" />}
                      </div>
                      <span className="text-sm text-muted-foreground">Manter sessão</span>
                    </label>
                    <button type="button" onClick={() => setMode("forgot")}
                      className="text-xs font-semibold text-gold transition-colors hover:text-gold/70 underline underline-offset-2 decoration-gold/30 hover:decoration-gold/60">
                      Esqueci a palavra-passe
                    </button>
                  </div>
                )}

                {/* Botão principal — CTA */}
                <button type="submit"
                  disabled={loading || (mode === "signup" && nameStatus === "taken")}
                  className="w-full rounded-xl bg-wc-red py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_oklch(0.54_0.24_27_/_0.35)] transition-all duration-200 hover:bg-wc-red/90 hover:shadow-[0_6px_24px_oklch(0.54_0.24_27_/_0.55)] hover:-translate-y-px active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none">
                  {loading
                    ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> A processar...</span>
                    : mode === "signin" ? "Entrar" : "Criar conta"}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                {mode === "signin" ? "Ainda não tens conta?" : "Já tens conta?"}{" "}
                <button
                  onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setNameStatus("idle"); setName(""); }}
                  className="font-semibold text-gold underline underline-offset-2 decoration-gold/30 transition-colors hover:text-gold/80 hover:decoration-gold/60">
                  {mode === "signin" ? "Cria uma agora" : "Entra"}
                </button>
              </p>
            </>
          )}
        </div>

        {/* ── Social proof — só no signin/signup ── */}
        {(mode === "signin" || mode === "signup") && (
          <div className="mt-6 flex items-center justify-center gap-6 text-center">
            {[
              { icon: Trophy, label: "Rankings por fase" },
              { icon: Users, label: "Torneios privados" },
              { icon: Star, label: "Previsões em directo" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <Icon className="h-4 w-4 text-gold/60" />
                <span className="text-[10px] text-muted-foreground/60 leading-tight max-w-[64px]">{label}</span>
              </div>
            ))}
          </div>
        )}

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
