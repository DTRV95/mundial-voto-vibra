import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "../components/AppShell";
import { Toaster } from "sonner";

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
  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <div>
        <h1 className="font-display text-3xl">Algo correu mal</h1>
        <p className="mt-2 text-sm text-muted-foreground">Tenta novamente daqui a uns segundos.</p>
        <p className="mt-2 text-xs text-red-400 font-mono max-w-md break-all">{error.message}</p>
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
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Uma Geração — Mundial 2026" },
      { name: "twitter:description", content: "Vota, compara e vibra com a comunidade de adeptos do Mundial 2026." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", type: "image/svg+xml", href: "/icon.svg" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
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

function PageTransition() {
  const isLoading = useRouterState({ select: s => s.isLoading });
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (isLoading) {
      setVisible(true);
    } else {
      timerRef.current = setTimeout(() => setVisible(false), 350);
    }
    return () => clearTimeout(timerRef.current);
  }, [isLoading]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none",
        background: "oklch(0.12 0.02 165)",
        opacity: visible ? (isLoading ? 1 : 0) : 0,
        transition: isLoading ? "opacity 80ms ease-in" : "opacity 320ms ease-out",
      }}
    />
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <PageTransition />
      <AppShell>
        <Outlet />
      </AppShell>
      <Toaster theme="dark" position="top-center" richColors />
    </QueryClientProvider>
  );
}
