/**
 * ShareCard — generates a beautiful shareable image card and shares it via
 * Web Share API (native on mobile → Instagram, WhatsApp, etc.) or downloads
 * on desktop.
 *
 * Uses a hidden off-screen rendered div captured by html2canvas so the design
 * is fully controlled and html2canvas-compatible (hex colors, no oklch).
 */
import { useRef, useState, type ReactNode } from "react";
import { Share2, Download, Loader2, Check } from "lucide-react";
import { createPortal } from "react-dom";

/* ─── Generic share trigger button ─────────────────────────── */

interface ShareButtonProps {
  /** Call this to trigger the actual html2canvas capture */
  onShare: () => Promise<void>;
  label?: string;
  className?: string;
}

export function ShareButton({ onShare, label = "Partilhar", className = "" }: ShareButtonProps) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  async function handleClick() {
    if (state === "loading") return;
    setState("loading");
    try {
      await onShare();
      setState("done");
      setTimeout(() => setState("idle"), 2500);
    } catch {
      setState("idle");
    }
  }

  const Icon = state === "loading" ? Loader2 : state === "done" ? Check : Share2;

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading"}
      className={`inline-flex items-center gap-1.5 rounded-full border border-[#c8960c]/50 bg-[#c8960c]/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#c8960c] transition-all hover:bg-[#c8960c]/20 active:scale-95 disabled:opacity-60 ${className}`}
    >
      <Icon className={`h-3.5 w-3.5 ${state === "loading" ? "animate-spin" : ""}`} />
      {state === "done" ? "Partilhado! ✓" : label}
    </button>
  );
}

/* ─── Core capture helper ───────────────────────────────────── */

async function captureAndShare(el: HTMLElement, shareText: string, filename: string) {
  const { default: html2canvas } = await import("html2canvas");

  const canvas = await html2canvas(el, {
    scale: 3,
    useCORS: true,
    backgroundColor: "#0d1a0f",
    logging: false,
    allowTaint: true,
    onclone(doc, clone) {
      // make the off-screen element visible inside the clone
      clone.style.opacity = "1";
      clone.style.position = "static";
    },
  });

  const blob = await new Promise<Blob>((res, rej) =>
    canvas.toBlob(b => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png", 1)
  );

  const file = new File([blob], filename, { type: "image/png" });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], text: shareText });
  } else if (navigator.share) {
    await navigator.share({ text: shareText });
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

/* ─── Podium share card ─────────────────────────────────────── */

interface PodiumEntry {
  display_name: string | null;
  avatar_url?: string | null;
  total_points: number;
}

interface PodiumShareProps {
  first: PodiumEntry;
  second: PodiumEntry | null;
  third: PodiumEntry | null;
  phase?: string;
}

export function usePodiumShare({ first, second, third, phase = "Fase de Grupos" }: PodiumShareProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  async function share() {
    if (!cardRef.current) return;
    await captureAndShare(
      cardRef.current,
      `🏆 Pódio ${phase} — Uma Geração · Mundial 2026\nJunta-te em https://umageracao.pt`,
      "podio-umageracao.png"
    );
  }

  const medals = ["🥇", "🥈", "🥉"];
  const cols = [
    { entry: first, rank: 1, h: 100, medal: medals[0], bg: "linear-gradient(180deg,#FFD700,#B8860B)", border: "#FFD700" },
    { entry: second, rank: 2, h: 72, medal: medals[1], bg: "linear-gradient(180deg,#C0C0C0,#8a8a8a)", border: "#C0C0C0" },
    { entry: third, rank: 3, h: 52, medal: medals[2], bg: "linear-gradient(180deg,#CD7F32,#7a4a1e)", border: "#CD7F32" },
  ];
  // visual order: 2nd · 1st · 3rd
  const visual = [cols[1], cols[0], cols[2]];

  const Card = (
    <div
      ref={cardRef}
      style={{
        position: "fixed",
        top: "-9999px",
        left: "-9999px",
        width: 400,
        background: "linear-gradient(160deg,#0d2e10 0%,#0a1f2e 50%,#1a1200 100%)",
        borderRadius: 24,
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "0 0 28px 0",
      }}
    >
      {/* top bar */}
      <div style={{ height: 5, background: "linear-gradient(90deg,#3a7d44,#1a3580,#c8960c)" }} />

      {/* header */}
      <div style={{ textAlign: "center", padding: "22px 20px 16px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#4caf72", marginBottom: 6 }}>
          {phase} · Uma Geração
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>
          Pódio Final 🏆
        </div>
        {first?.display_name && (
          <div style={{ fontSize: 13, color: "#c8960c", fontWeight: 600, marginTop: 6 }}>
            Parabéns, {first.display_name}! 🎉
          </div>
        )}
      </div>

      {/* columns */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 8, padding: "0 20px" }}>
        {visual.map(({ entry, rank, h, medal, bg, border }, vi) => {
          if (!entry) return <div key={vi} style={{ flex: 1 }} />;
          const isWinner = rank === 1;
          const avatarSize = isWinner ? 60 : 46;
          return (
            <div key={vi} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              {/* avatar */}
              <div style={{ position: "relative", marginBottom: 6 }}>
                {entry.avatar_url ? (
                  <img
                    src={entry.avatar_url}
                    width={avatarSize}
                    height={avatarSize}
                    style={{ borderRadius: "50%", border: `2.5px solid ${border}`, objectFit: "cover" }}
                  />
                ) : (
                  <div style={{
                    width: avatarSize, height: avatarSize, borderRadius: "50%",
                    border: `2.5px solid ${border}`,
                    background: isWinner ? "linear-gradient(135deg,#3a7d44,#1a3580)" : "linear-gradient(135deg,#444,#222)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: avatarSize * 0.42, fontWeight: 800, color: "#fff",
                  }}>
                    {entry.display_name?.[0] ?? "?"}
                  </div>
                )}
                <span style={{ position: "absolute", bottom: -3, right: -3, fontSize: 18, lineHeight: 1 }}>{medal}</span>
              </div>

              {/* name */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", textAlign: "center", marginBottom: 2, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {entry.display_name ?? "—"}
              </div>

              {/* pts */}
              <div style={{ fontSize: 10, color: "#aaa", marginBottom: 6 }}>
                <span style={{ fontWeight: 800, color: border, fontSize: 12 }}>{entry.total_points}</span> pts
              </div>

              {/* platform */}
              <div style={{ width: "100%", height: h, background: bg, borderRadius: "10px 10px 0 0", border: `2px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontWeight: 800, color: "#fff", fontSize: 22, textShadow: "0 2px 6px rgba(0,0,0,0.5)" }}>{rank}º</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* footer brand */}
      <div style={{ textAlign: "center", marginTop: 18, fontSize: 10, color: "#4a6a50", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
        umageracao.pt · Mundial 2026
      </div>
    </div>
  );

  // Render into portal so it's in the DOM but off-screen
  const Portal = typeof document !== "undefined"
    ? createPortal(Card, document.body)
    : null;

  return { share, Portal };
}

/* ─── Rank share card ───────────────────────────────────────── */

interface RankShareProps {
  displayName: string;
  rank: number;
  totalPoints: number;
  totalUsers: number;
  division?: string;
  phase?: string;
}

export function useRankShare({ displayName, rank, totalPoints, totalUsers, division = "1ª Liga", phase = "Mata-Mata" }: RankShareProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  async function share() {
    if (!cardRef.current) return;
    await captureAndShare(
      cardRef.current,
      `🏆 Estou em ${rank}º lugar no Mundial 2026 — Uma Geração!\nJunta-te em https://umageracao.pt`,
      "rank-umageracao.png"
    );
  }

  const Card = (
    <div
      ref={cardRef}
      style={{
        position: "fixed",
        top: "-9999px",
        left: "-9999px",
        width: 380,
        background: "linear-gradient(135deg,#0d2e10 0%,#0a1a30 100%)",
        borderRadius: 24,
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "0 0 24px 0",
      }}
    >
      <div style={{ height: 4, background: "linear-gradient(90deg,#3a7d44,#1a3580,#c8960c)" }} />
      <div style={{ padding: "24px 28px 0" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: "#4caf72", textTransform: "uppercase", marginBottom: 4 }}>
          Uma Geração · {phase}
        </div>
        <div style={{ fontSize: 14, color: "#fff", fontWeight: 600, marginBottom: 20, opacity: 0.7 }}>
          A minha classificação
        </div>

        {/* big rank */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 64, fontWeight: 900, color: "#c8960c", lineHeight: 1 }}>#{rank}</div>
          <div style={{ fontSize: 14, color: "#fff", fontWeight: 700, marginTop: 4 }}>{displayName}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>de {totalUsers} participantes</div>
        </div>

        {/* stats row */}
        <div style={{ display: "flex", gap: 10, marginBottom: 0 }}>
          <div style={{ flex: 1, background: "rgba(200,150,12,0.12)", border: "1px solid rgba(200,150,12,0.3)", borderRadius: 12, padding: "10px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#c8960c" }}>{totalPoints}</div>
            <div style={{ fontSize: 9, color: "#888", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>Pontos</div>
          </div>
          <div style={{ flex: 1, background: "rgba(58,125,68,0.12)", border: "1px solid rgba(58,125,68,0.3)", borderRadius: 12, padding: "10px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#4caf72" }}>{division}</div>
            <div style={{ fontSize: 9, color: "#888", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>Divisão</div>
          </div>
        </div>
      </div>
      <div style={{ textAlign: "center", marginTop: 18, fontSize: 10, color: "#4a6a50", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
        umageracao.pt · Mundial 2026
      </div>
    </div>
  );

  const Portal = typeof document !== "undefined"
    ? createPortal(Card, document.body)
    : null;

  return { share, Portal };
}
