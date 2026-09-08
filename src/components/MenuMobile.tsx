import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  House, CalendarDays, Trophy, CircleUser, ShieldCheck, LogOut, UsersRound,
  CircleHelp, Swords, ListOrdered, Dna, X,
} from "lucide-react";
import { useAuth, useIsAdmin } from "@/lib/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserAvatar } from "@/components/AvatarPicker";
import { useQuery } from "@tanstack/react-query";

/**
 * O menu completo, no telemóvel.
 *
 * A barra de baixo leva a cinco sítios. O site tem mais do que cinco —
 * e a Classificação, os Duelos e o DNA não tinham como lá chegar de
 * telemóvel a não ser por dentro de outra página. O DNA nem isso: só
 * pelo cartão da página inicial.
 *
 * Isto abre com um toque no logótipo, que é onde toda a gente carrega
 * à espera de voltar ao princípio — e continua a fazê-lo, porque a
 * primeira entrada do menu é a Home.
 */

const GRUPOS = [
  {
    titulo: null,
    itens: [{ to: "/", label: "Home", icon: House }],
  },
  {
    titulo: "Jogar",
    itens: [
      { to: "/jogos", label: "Jogos", icon: CalendarDays },
      { to: "/classificacao", label: "Classificação", icon: ListOrdered },
    ],
  },
  {
    titulo: "Competir",
    itens: [
      { to: "/rankings", label: "Rankings", icon: Trophy },
      { to: "/ligas", label: "Torneios", icon: UsersRound },
      { to: "/duelos", label: "Duelos", icon: Swords },
      { to: "/dna", label: "O teu DNA", icon: Dna },
    ],
  },
  {
    titulo: "Conta",
    itens: [
      { to: "/perfil", label: "Perfil", icon: CircleUser },
      { to: "/como-funciona", label: "Como funciona", icon: CircleHelp },
    ],
  },
];

export function MenuMobile({ aberto, fechar }: { aberto: boolean; fechar: () => void }) {
  const { location } = useRouterState();
  const { user } = useAuth();
  const isAdmin = useIsAdmin(user?.id);

  const { data: perfil } = useQuery({
    queryKey: ["profile-avatar", user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("profiles")
        .select("avatar_url, display_name").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  // Fecha ao mudar de página — senão ficava aberto por cima do destino.
  useEffect(() => { fechar(); /* eslint-disable-next-line */ }, [location.pathname]);

  // Com o menu aberto, a página por trás não deve deslizar.
  useEffect(() => {
    if (!aberto) return;
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = antes; };
  }, [aberto]);

  // Escape fecha, como em qualquer diálogo.
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => { if (e.key === "Escape") fechar(); };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto, fechar]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className={`fixed inset-0 z-[60] md:hidden ${aberto ? "" : "pointer-events-none"}`}
      aria-hidden={!aberto}>
      {/* Véu */}
      <div
        onClick={fechar}
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          aberto ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* A gaveta, encostada à esquerda */}
      <nav
        className={`absolute inset-y-0 left-0 flex w-[82%] max-w-[19rem] flex-col border-r border-border bg-card transition-transform duration-300 ease-out ${
          aberto ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ boxShadow: "8px 0 40px oklch(0 0 0 / 0.35)" }}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            {user ? (
              <div className="flex items-center gap-3">
                <UserAvatar avatarUrl={perfil?.avatar_url} name={perfil?.display_name ?? "Adepto"}
                  size={10} className="shrink-0 rounded-full ring-2 ring-border" />
                <div className="min-w-0">
                  <p className="truncate font-display text-lg leading-none">
                    {perfil?.display_name ?? "Adepto"}
                  </p>
                  {isAdmin && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-wc-red/30 bg-wc-red/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-wc-red">
                      <ShieldCheck className="h-3 w-3" /> Admin
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="font-display text-lg leading-none">Uma Geração</p>
            )}
          </div>
          <button onClick={fechar} aria-label="Fechar menu"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-smooth hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {GRUPOS.map((grupo, i) => (
            <div key={grupo.titulo ?? i} className="mb-1">
              {grupo.titulo && (
                <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                  {grupo.titulo}
                </p>
              )}
              {grupo.itens.map(({ to, label, icon: Icone }) => {
                const ativo = to === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(to);
                return (
                  <Link key={to} to={to} onClick={fechar}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-smooth ${
                      ativo
                        ? "bg-wc-red/12 text-wc-red"
                        : "text-foreground/80 hover:bg-accent/60 hover:text-foreground"
                    }`}>
                    <Icone className="h-5 w-5 shrink-0" strokeWidth={ativo ? 2.2 : 1.7} />
                    {label}
                  </Link>
                );
              })}
            </div>
          ))}

          {isAdmin && (
            <Link to="/admin" onClick={fechar}
              className="mt-2 flex items-center gap-3 rounded-xl border border-wc-red/25 bg-wc-red/8 px-3 py-2.5 text-sm font-semibold text-wc-red">
              <ShieldCheck className="h-5 w-5 shrink-0" strokeWidth={1.8} />
              Administração
            </Link>
          )}
        </div>

        {user && (
          <div className="border-t border-border px-3 py-3">
            <button
              onClick={async () => { await supabase.auth.signOut(); toast.success("Sessão terminada."); fechar(); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-smooth hover:bg-accent/60 hover:text-foreground">
              <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.7} />
              Terminar sessão
            </button>
          </div>
        )}
      </nav>
    </div>,
    document.body,
  );
}
