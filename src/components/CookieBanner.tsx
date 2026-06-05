import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";

const COOKIE_KEY = "uma-geracao-cookies-accepted";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(COOKIE_KEY)) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 px-4 pb-2 md:bottom-4 md:left-auto md:right-4 md:max-w-sm">
      <div
        className="overflow-hidden rounded-2xl border border-border bg-card shadow-elegant"
        style={{ boxShadow: "0 8px 32px oklch(0 0 0 / 0.18)" }}
      >
        <div className="wc-tricolor h-1 w-full" />
        <div className="p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <p className="font-display text-base">Cookies</p>
            <button onClick={accept} className="text-muted-foreground hover:text-foreground transition-smooth">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4">
            Utilizamos apenas cookies estritamente necessários para o funcionamento da plataforma (autenticação). Não usamos cookies de publicidade ou rastreio.{" "}
            <Link to="/cookies" className="text-wc-red hover:underline">Saber mais</Link>
          </p>
          <div className="flex gap-2">
            <button
              onClick={accept}
              className="flex-1 rounded-xl bg-wc-red py-2 text-sm font-bold text-white transition-smooth hover:scale-[1.01] active:scale-95"
            >
              Aceitar
            </button>
            <Link
              to="/cookies"
              className="flex-1 rounded-xl border border-border py-2 text-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-smooth"
            >
              Saber mais
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
