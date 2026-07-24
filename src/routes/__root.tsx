import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  Link,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../lib/useAuth";
import { supabase } from "../integrations/supabase/client";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "../components/AppShell";
import { Toaster } from "sonner";
import { AuthProvider } from "../lib/AuthContext";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 text-center">
      <div className="space-y-4">
        <div className="relative inline-block">
          <span className="font-display text-[8rem] leading-none text-gold opacity-20 select-none">404</span>
          <span className="absolute inset-0 flex items-center justify-center font-display text-[8rem] leading-none text-gold"
            style={{ WebkitTextStroke: "2px oklch(0.82 0.15 88 / 0.6)", WebkitTextFillColor: "transparent" }}>
            404
          </span>
        </div>
        <p className="font-display text-2xl">Página não encontrada</p>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Esta página saiu do campo. Volta para a homepage ou explora os jogos do Mundial.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <a href="/" className="rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-background shadow-gold transition-smooth hover:scale-[1.02]">
            Ir para a Home
          </a>
          <a href="/jogos" className="rounded-full border border-border bg-card/60 px-5 py-2.5 text-sm font-semibold transition-smooth hover:border-gold/40">
            Ver Jogos
          </a>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);

  // Erro de chunk stale após novo deploy — recarrega silenciosamente
  const isChunkError = /importing a module script failed|failed to fetch dynamically imported|unable to preload css/i.test(error.message);
  useEffect(() => {
    if (isChunkError) window.location.reload();
  }, [isChunkError]);

  if (isChunkError) return null;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <div>
        <h1 className="font-display text-3xl">Algo correu mal</h1>
        <p className="mt-2 text-sm text-muted-foreground">Tenta novamente daqui a uns segundos.</p>
        <button onClick={reset} className="mt-6 rounded-full bg-gold px-5 py-2 text-sm font-semibold text-background">Tentar novamente</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#1a2820" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Uma Geração" },
      { title: "Uma Geração — Vota, compara e vibra com a comunidade" },
      { name: "description", content: "A comunidade onde os adeptos deixam previsões, acompanham os jogos e competem nos rankings do Mundial 2026." },
      { name: "keywords", content: "Mundial 2026, previsões Mundial, palpites futebol, comunidade futebol, jogos do Mundial, ranking Mundial, Uma Geração, ScoreLab" },
      { name: "robots", content: "index, follow" },
      { property: "og:site_name", content: "Uma Geração" },
      { property: "og:title", content: "Uma Geração — Vota, compara e vibra com a comunidade" },
      { property: "og:description", content: "Faz as tuas previsões para o Mundial 2026, compara com a comunidade e compete nos rankings por fase." },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "pt_PT" },
      { property: "og:url", content: "https://geracao2026.com/" },
      { property: "og:image", content: "https://geracao2026.com/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Uma Geração — Mundial 2026" },
      { name: "twitter:description", content: "Vota, compara e vibra com a comunidade de adeptos do Mundial 2026." },
      { name: "twitter:image", content: "https://geracao2026.com/og-image.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", type: "image/svg+xml", href: "/icon.svg" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
      { rel: "canonical", href: "https://geracao2026.com/" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Uma Geração",
          "url": "https://geracao2026.com",
          "description": "A comunidade onde os adeptos fazem previsões, acompanham os jogos e competem nos rankings do Mundial 2026.",
          "inLanguage": "pt-PT",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://geracao2026.com/rankings",
            "query-input": "required name=search_term_string"
          }
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-PT">
      <head>
        <HeadContent />
        {/* Detect Instagram/Facebook in-app browser and show open-in-browser screen */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            var ua = navigator.userAgent || '';
            var isInApp = /Instagram|FBAN|FBAV|FB_IAB|FB4A|FBIOS/.test(ua);
            if (!isInApp) return;

            var url = location.href;
            var isAndroid = /Android/.test(ua);

            function openInBrowser() {
              if (isAndroid) {
                var intentUrl = 'intent://' + url.replace(/^https?:\\/\\//, '') + '#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=' + encodeURIComponent(url) + ';end';
                location.href = intentUrl;
              }
            }

            document.addEventListener('DOMContentLoaded', function() {
              var div = document.createElement('div');
              div.style.cssText = [
                'position:fixed;inset:0;z-index:99999',
                'background:linear-gradient(160deg,#0d1f18 0%,#0a1610 60%,#111827 100%)',
                'display:flex;flex-direction:column;align-items:center;justify-content:center',
                'padding:40px 32px;text-align:center;font-family:system-ui,-apple-system,sans-serif',
              ].join(';');

              var step = isAndroid
                ? '<div style="background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);border-radius:16px;padding:16px 20px;margin-top:8px">'
                    + '<p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:.08em">Passo 1</p>'
                    + '<p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;line-height:1.5">Clica no botão abaixo para abrir no Chrome</p>'
                    + '</div>'
                : '<div style="background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);border-radius:16px;padding:16px 20px;margin-top:8px">'
                    + '<p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:.08em">Como abrir</p>'
                    + '<p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0 0 6px;line-height:1.5">1. Toca nos <strong style="color:#c9a84c">··· três pontos</strong> (canto superior direito)</p>'
                    + '<p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;line-height:1.5">2. Escolhe <strong style="color:#c9a84c">"Abrir no browser externo"</strong></p>'
                    + '</div>';

              var btn = isAndroid
                ? '<button onclick="(function(){var u=\'' + url + '\';location.href=\'intent://\'+u.replace(/^https?:\\/\\//,\'\')+\'#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=\'+encodeURIComponent(u)+\';end\';})()" style="display:block;width:100%;background:#c9a84c;color:#0d1f18;font-weight:700;font-size:16px;padding:16px 32px;border-radius:999px;border:none;cursor:pointer;margin-top:24px;letter-spacing:.01em">Abrir no Chrome →</button>'
                : '<div style="margin-top:24px;background:rgba(255,255,255,0.05);border-radius:12px;padding:12px 16px"><p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0">Ou copia o link:<br><span style="color:#c9a84c;word-break:break-all;font-size:11px">' + url + '</span></p></div>';

              div.innerHTML = ''
                + '<div style="width:64px;height:64px;background:linear-gradient(135deg,#c9a84c,#f0d080);border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:20px;box-shadow:0 8px 32px rgba(201,168,76,0.3)">🏆</div>'
                + '<h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 6px;letter-spacing:-.02em">Uma Geração</h1>'
                + '<p style="color:rgba(255,255,255,0.4);font-size:13px;margin:0 0 28px;letter-spacing:.05em;text-transform:uppercase">Mundial 2026</p>'
                + '<div style="width:100%;max-width:360px">'
                + '<p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 16px">O site não funciona dentro<br>do browser do Instagram.</p>'
                + step
                + btn
                + '</div>';

              document.body.appendChild(div);
            });
          })();
        ` }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const MAINTENANCE = false;

const MAINTENANCE_NOTICE_START = new Date("2026-06-27T00:00:00");
const MAINTENANCE_NOTICE_END   = new Date("2026-06-28T16:00:00");

function MaintenanceNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const now = new Date();
    if (now < MAINTENANCE_NOTICE_START || now > MAINTENANCE_NOTICE_END) return;
    const dismissed = sessionStorage.getItem("maintenance_notice_dismissed");
    if (!dismissed) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div
        className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-amber-500/30 bg-background/95 px-4 py-3.5 shadow-elegant backdrop-blur-md"
        style={{ boxShadow: "0 8px 32px oklch(0 0 0 / 0.4), 0 0 0 1px oklch(0.75 0.18 85 / 0.15) inset" }}
      >
        <span className="text-xl shrink-0 mt-0.5">🔧</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">Manutenção programada</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            O site estará em manutenção no dia <span className="text-foreground font-semibold">28 de junho, das 14h às 16h</span>. Estamos a preparar o mata-mata!
          </p>
        </div>
        <button
          onClick={() => { sessionStorage.setItem("maintenance_notice_dismissed", "1"); setVisible(false); }}
          className="shrink-0 rounded-lg p-1 text-muted-foreground hover:text-foreground transition-smooth"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function MaintenancePage() {
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
      style={{ background: "linear-gradient(135deg, oklch(0.13 0.03 142) 0%, oklch(0.12 0.04 250) 50%, oklch(0.14 0.03 27) 100%)" }}>
      {/* Tricolor top bar */}
      <div className="fixed top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg, oklch(0.54 0.24 27) 0%, oklch(0.55 0.20 142) 50%, oklch(0.40 0.18 265) 100%)" }} />

      {/* Glow orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-[0.06]" style={{ background: "radial-gradient(circle, oklch(0.55 0.20 142) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full opacity-[0.06]" style={{ background: "radial-gradient(circle, oklch(0.40 0.18 265) 0%, transparent 70%)" }} />
      </div>

      <div className="relative max-w-sm">
        {/* Logo / ícone */}
        <div className="mb-8 grid h-20 w-20 mx-auto place-items-center rounded-full border border-white/10"
          style={{ background: "oklch(0.55 0.20 142 / 0.15)" }}>
          <span className="text-4xl">⚽</span>
        </div>

        <h1 className="font-display text-4xl text-white mb-2">Uma Geração</h1>
        <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-8">Mundial 2026</p>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-6">
          <p className="text-white/90 font-semibold text-lg mb-2">
            Estamos a preparar o mata-mata{dots}
          </p>
          <p className="text-white/50 text-sm leading-relaxed">
            A nova fase está quase pronta. Voltamos em breve com os 16 avos de final e pontos a zero para todos!
          </p>
        </div>

        <p className="text-white/25 text-xs">Obrigado pela paciência 🙏</p>
      </div>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // O preview da nova época renderiza sozinho, sem o chrome do Mundial.
  const standalone = pathname.startsWith("/preview");

  useEffect(() => {
    // After a new deploy, old JS chunks no longer exist.
    // We reload once, but use a timestamp so future deploys (>60s ago) also trigger a reload.
    const handler = () => {
      const last = Number(sessionStorage.getItem("preload_reloaded_at") ?? 0);
      const now = Date.now();
      if (now - last < 60_000) return; // already reloaded in the last 60s, stop
      sessionStorage.setItem("preload_reloaded_at", String(now));
      window.location.href = window.location.href; // full navigation, clears stale cache
    };
    window.addEventListener("vite:preloadError", handler);
    return () => window.removeEventListener("vite:preloadError", handler);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {standalone ? (
          <Outlet />
        ) : (
          <MaintenanceGuard>
            <AppShell>
              <Outlet />
            </AppShell>
            <Toaster theme="dark" position="top-center" richColors />
            <MaintenanceNotice />
            {/* Ronda32WelcomeModal desativado — obsoleto após o Mundial */}
          </MaintenanceGuard>
        )}
      </AuthProvider>
    </QueryClientProvider>
  );
}

function Ronda32WelcomeModal() {
  const { user, loading } = useAuth();
  const [visible, setVisible] = useState(false);
  const [phaseResult, setPhaseResult] = useState<{ rank: number; total_points: number } | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (loading) return;
    const key = "ronda32_welcome_v1";
    try {
      if (localStorage.getItem(key)) return;
    } catch { return; }

    if (!user) {
      setDataLoaded(true);
      setVisible(true);
      return;
    }

    supabase
      .from("phase_results" as any)
      .select("rank,total_points")
      .eq("user_id", user.id)
      .eq("phase", "grupos")
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) setPhaseResult({ rank: data.rank, total_points: data.total_points });
        setDataLoaded(true);
        setVisible(true);
      });
  }, [user, loading]);

  function dismiss() {
    try { localStorage.setItem("ronda32_welcome_v1", "1"); } catch { /* noop */ }
    setVisible(false);
  }

  if (!visible || !dataLoaded) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "oklch(0 0 0 / 0.7)" }}
      onClick={dismiss}>
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl"
        style={{ background: "linear-gradient(160deg, oklch(0.18 0.04 250) 0%, oklch(0.14 0.03 142) 100%)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Tricolor bar */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, oklch(0.54 0.24 27) 0%, oklch(0.55 0.20 142) 50%, oklch(0.40 0.18 265) 100%)" }} />

        <div className="px-6 py-7">
          {/* Badge nova fase */}
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10"
              style={{ background: "oklch(0.55 0.20 142 / 0.2)" }}>
              <span className="text-2xl">⚽</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">Uma Geração · Mundial 2026</p>
              <p className="font-display text-xl text-white leading-tight">16 Avos de Final</p>
            </div>
          </div>

          {/* Resultado fase de grupos (utilizadores existentes) */}
          {phaseResult ? (
            <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-xs text-white/50 mb-2 font-semibold uppercase tracking-wider">O teu resultado — Fase de Grupos</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{phaseResult.rank <= 3 ? ["🥇","🥈","🥉"][phaseResult.rank - 1] : "🏅"}</span>
                  <div>
                    <p className="font-display text-3xl text-white leading-none">#{phaseResult.rank}º</p>
                    <p className="text-xs text-white/40">lugar final</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display text-3xl text-gold leading-none">{phaseResult.total_points}</p>
                  <p className="text-xs text-white/40">pontos</p>
                </div>
              </div>
            </div>
          ) : user ? null : (
            <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-sm text-white/70 leading-relaxed">Cria conta para entrar no mata-mata e competir pelos 16 avos de final!</p>
            </div>
          )}

          {/* Mensagem */}
          <p className="text-sm text-white/70 leading-relaxed mb-4">
            A fase de grupos terminou. Os pontos foram a zero e começa uma nova corrida — os 16 avos de final já estão disponíveis!
          </p>

          {/* Novo mercado */}
          <div className="mb-5 rounded-2xl border border-gold/30 bg-gold/8 px-4 py-3 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gold/70">Novidade no mata-mata</p>
            <div className="flex items-start gap-2.5">
              <span className="text-xl shrink-0">⚔️</span>
              <div>
                <p className="text-sm font-bold text-white">Qualificar — 4 pts</p>
                <p className="text-xs text-white/60 mt-0.5">Escolhe qual das equipas passa à próxima ronda. Conta mesmo que seja nos penáltis!</p>
              </div>
            </div>
            <div className="pt-1 border-t border-white/10 grid grid-cols-2 gap-2 text-[10px] text-white/50">
              <div className="flex items-center gap-1"><span className="text-gold">✓</span> Resultado (3–4 pts)</div>
              <div className="flex items-center gap-1"><span className="text-gold">✓</span> BTTS (2 pts)</div>
              <div className="flex items-center gap-1"><span className="text-gold">✓</span> +/- 2.5 golos (2 pts)</div>
              <div className="flex items-center gap-1"><span className="text-gold">✓</span> Marcador exato (10 pts)</div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={dismiss}
              className="w-full rounded-2xl py-3.5 font-bold text-background transition-smooth hover:brightness-110"
              style={{ background: "linear-gradient(90deg, oklch(0.55 0.20 142) 0%, oklch(0.40 0.18 265) 100%)" }}
            >
              Vamos lá! →
            </button>
            <Link to="/como-funciona" onClick={dismiss}
              className="w-full rounded-2xl border border-white/15 py-2.5 text-center text-xs font-semibold text-white/60 transition-smooth hover:border-white/30 hover:text-white/90">
              Ver guia completo do mata-mata
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function MaintenanceGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!MAINTENANCE || loading || !user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user, loading]);

  if (!MAINTENANCE) return <>{children}</>;
  if (isAdmin) return <>{children}</>;
  return <MaintenancePage />;
}
