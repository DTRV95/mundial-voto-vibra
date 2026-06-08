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
      <head><HeadContent /></head>
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
