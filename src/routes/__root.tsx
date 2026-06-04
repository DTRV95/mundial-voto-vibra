import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "../components/AppShell";
import { Toaster } from "sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <div>
        <h1 className="font-display text-7xl text-gold">404</h1>
        <p className="mt-2 text-muted-foreground">Esta página perdeu-se no campo.</p>
        <a href="/" className="mt-6 inline-block rounded-full bg-gold px-5 py-2 text-sm font-semibold text-background">Voltar à Home</a>
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
      { name: "theme-color", content: "#0d1f17" },
      { title: "Uma Geração — Vota, compara e vibra com a comunidade" },
      { name: "description", content: "A comunidade onde os adeptos deixam previsões, acompanham os jogos e competem nos rankings do Mundial." },
      { name: "keywords", content: "Mundial, previsões Mundial, palpites Mundial, comunidade Mundial, jogos do Mundial, ranking Mundial, previsões futebol, Uma Geração" },
      { property: "og:title", content: "Uma Geração" },
      { property: "og:description", content: "Vota, compara e vibra com a comunidade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>
        <Outlet />
      </AppShell>
      <Toaster theme="dark" position="top-center" richColors />
    </QueryClientProvider>
  );
}
