import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background px-5 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-sm text-foreground">Ultima Geração</p>
            <p className="text-xs text-muted-foreground mt-0.5">Plataforma de previsões · Mundial 2026 · Sem apostas</p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            {[
              { to: "/suporte", label: "Suporte" },
              { to: "/privacidade", label: "Privacidade" },
              { to: "/cookies", label: "Cookies" },
              { to: "/termos", label: "Termos" },
              { to: "/aviso-legal", label: "Aviso Legal" },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-xs text-muted-foreground hover:text-foreground transition-smooth"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-5 border-t border-border pt-4">
          <p className="text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} Ultima Geração · Não afiliado com a FIFA. Apenas para fins de entretenimento.
          </p>
        </div>
      </div>
    </footer>
  );
}
