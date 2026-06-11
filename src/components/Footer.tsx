import { Link } from "@tanstack/react-router";

function InstagramIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-background px-5 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-sm text-foreground">Uma Geração</p>
            <p className="text-xs text-muted-foreground mt-0.5">Plataforma de previsões · Mundial 2026 · Sem apostas</p>
            <a
              href="https://instagram.com/umageracao2026"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-pink-500 transition-smooth"
            >
              <InstagramIcon /> @umageracao2026
            </a>
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
            © {new Date().getFullYear()} Uma Geração · Não afiliado com a FIFA. Apenas para fins de entretenimento.
          </p>
        </div>
      </div>
    </footer>
  );
}
