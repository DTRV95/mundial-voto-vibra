import { useState } from "react";
import { Bell, BellOff, X } from "lucide-react";
import { usePushNotifications } from "@/lib/usePushNotifications";
import { useAuth } from "@/lib/useAuth";

const DISMISSED_KEY = "push_prompt_dismissed";

export function PushNotificationPrompt() {
  const { user } = useAuth();
  const { supported, permission, subscribed, loading, subscribe } = usePushNotifications(user?.id);
  const [dismissed, setDismissed] = useState(() => !!localStorage.getItem(DISMISSED_KEY));

  // Don't show if: not supported, already granted/denied, subscribed, or dismissed
  if (!supported || !user || permission === "denied" || subscribed || dismissed) return null;
  if (permission === "granted" && subscribed) return null;

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="mx-5 mt-4 md:mx-8">
      <div className="relative overflow-hidden rounded-2xl border border-wc-green/30 bg-wc-green/10 px-5 py-4">
        <button onClick={dismiss}
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:text-foreground transition-smooth">
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-center gap-4 pr-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-wc-green/20">
            <Bell className="h-5 w-5 text-wc-green" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">Nunca percas pontos</p>
            <p className="text-xs text-muted-foreground mt-0.5">Ativa as notificações e avisa-mos antes dos jogos começarem.</p>
          </div>
          <button
            onClick={subscribe}
            disabled={loading}
            className="shrink-0 rounded-xl bg-wc-green px-4 py-2 text-xs font-bold text-white transition-smooth hover:bg-wc-green/80 disabled:opacity-60"
          >
            {loading ? "..." : "Ativar"}
          </button>
        </div>
      </div>
    </div>
  );
}
