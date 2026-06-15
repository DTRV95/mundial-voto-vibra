import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Trophy, CalendarClock, Users, ChevronRight, X } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "onboarding_done";

const STEPS = [
  {
    icon: "⚽",
    title: "Bem-vindo ao Uma Geração!",
    description: "A tua comunidade de previsões para o Mundial 2026. Vota nos jogos, acumula pontos e compete com os teus amigos.",
    cta: null,
  },
  {
    icon: <CalendarClock className="h-10 w-10 text-wc-red" />,
    title: "Vota nos jogos",
    description: "Antes do apito inicial, escolhe o resultado, se há golos de ambas as equipas e o marcador exato. Quanto mais certeiro, mais pontos!",
    cta: null,
  },
  {
    icon: <Trophy className="h-10 w-10 text-gold" />,
    title: "Sobe no ranking",
    description: "Os teus pontos acumulam por fase — Grupos, Oitavos, Quartos, Meias-finais e Final. Quem tiver mais pontos no final ganha!",
    cta: null,
  },
  {
    icon: <Users className="h-10 w-10 text-wc-green" />,
    title: "Cria ou entra num torneio",
    description: "Convida os teus amigos, cria um torneio privado e compite entre si. Cada liga tem o seu próprio ranking.",
    cta: { label: "Ver jogos", to: "/jogos" },
  },
];

export function OnboardingModal() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile-onboarding", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("predictions_made")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (!user) return;
    const done = localStorage.getItem(STORAGE_KEY);
    if (done) return;
    // Só mostra se nunca fez previsões (utilizador novo)
    if (profile !== undefined && (profile?.predictions_made ?? 0) === 0) {
      setVisible(true);
    }
  }, [user, profile]);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center px-4 pb-4 sm:pb-0">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismiss} />

      {/* Modal */}
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
        {/* Progress bar */}
        <div className="h-1 bg-secondary">
          <div
            className="h-full bg-wc-red transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Close */}
        <button onClick={dismiss} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-smooth">
          <X className="h-5 w-5" />
        </button>

        <div className="px-6 py-8 text-center">
          {/* Icon */}
          <div className="mb-5 flex justify-center">
            {typeof current.icon === "string" ? (
              <span className="text-6xl">{current.icon}</span>
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-full bg-secondary">
                {current.icon}
              </div>
            )}
          </div>

          {/* Title */}
          <h2 className="font-display text-2xl mb-3">{current.title}</h2>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">
            {current.description}
          </p>

          {/* Step dots */}
          <div className="flex justify-center gap-2 mb-6">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step ? "w-6 bg-wc-red" : "w-2 bg-secondary"
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold text-muted-foreground hover:bg-secondary transition-smooth"
              >
                Anterior
              </button>
            )}
            {!isLast ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-wc-red py-3 text-sm font-bold text-white shadow-gold hover:bg-wc-red/80 transition-smooth"
              >
                Seguinte <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <Link
                to={current.cta?.to as any ?? "/jogos"}
                onClick={dismiss}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-wc-red py-3 text-sm font-bold text-white shadow-gold hover:bg-wc-red/80 transition-smooth"
              >
                {current.cta?.label ?? "Começar"} <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {step === 0 && (
            <button onClick={dismiss} className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-smooth">
              Já sei como funciona
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
