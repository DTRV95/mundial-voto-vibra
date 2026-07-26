import { useEffect, useState, useCallback } from "react";
import { useCompetitions, type Competition } from "@/lib/useCompetitions";
import { useMyCompetitions } from "@/lib/useMyCompetitions";

const KEY = "active_competition_slug";
const EVENT = "active-competition-change";

/**
 * Competição ativa — partilhada por toda a app (homepage, sidebar, etc.)
 * e guardada entre visitas.
 */
export function useActiveCompetition() {
  const { data: allCompetitions = [] } = useCompetitions();
  const { data: myCompIds } = useMyCompetitions();

  // Só as competições seguidas; sem inscrições mostra todas
  const competitions =
    myCompIds && myCompIds.length > 0
      ? allCompetitions.filter((c) => myCompIds.includes(c.id))
      : allCompetitions;

  const [slug, setSlugState] = useState<string | null>(null);

  // Lê a escolha guardada depois de montar (evita divergência servidor/cliente)
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY);
      if (saved) setSlugState(saved);
    } catch { /* noop */ }
  }, []);

  // Mantém-se sincronizado entre componentes na mesma página
  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === "string") setSlugState(detail);
    };
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  const setSlug = useCallback((next: string) => {
    setSlugState(next);
    try { window.localStorage.setItem(KEY, next); } catch { /* noop */ }
    window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
  }, []);

  const active: Competition | null =
    competitions.find((c) => c.slug === slug) ?? competitions[0] ?? null;

  return { competitions, active, setSlug };
}
