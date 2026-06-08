import { useState } from "react";
import { Shuffle, Check, X } from "lucide-react";

const STYLES = [
  { id: "adventurer",     label: "Aventureiro" },
  { id: "avataaars",      label: "Cartoon" },
  { id: "big-smile",      label: "Sorriso" },
  { id: "bottts",         label: "Robô" },
  { id: "fun-emoji",      label: "Emoji" },
  { id: "pixel-art",      label: "Pixel" },
  { id: "lorelei",        label: "Lorelei" },
  { id: "notionists",     label: "Notion" },
];

function dicebearUrl(style: string, seed: string) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`;
}

function randomSeed() {
  return Math.random().toString(36).slice(2, 10);
}

export function avatarUrl(style: string, seed: string) {
  return dicebearUrl(style, seed);
}

export function parseAvatarConfig(url: string | null | undefined): { style: string; seed: string } {
  if (!url) return { style: "adventurer", seed: "default" };
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/");
    const styleIdx = parts.indexOf("9.x");
    const style = styleIdx >= 0 ? parts[styleIdx + 1] : "adventurer";
    const seed = u.searchParams.get("seed") ?? "default";
    return { style, seed };
  } catch {
    return { style: "adventurer", seed: "default" };
  }
}

interface AvatarPickerProps {
  current: string | null | undefined;
  onSave: (url: string) => Promise<void>;
  onClose: () => void;
}

export function AvatarPicker({ current, onSave, onClose }: AvatarPickerProps) {
  const parsed = parseAvatarConfig(current);
  const [style, setStyle] = useState(parsed.style);
  const [seed, setSeed]   = useState(parsed.seed);
  const [saving, setSaving] = useState(false);

  const preview = dicebearUrl(style, seed);

  async function save() {
    setSaving(true);
    await onSave(preview);
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-3xl border border-border bg-card shadow-2xl p-5 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg">Escolher avatar</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-smooth">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Preview */}
        <div className="flex flex-col items-center gap-3">
          <div className="h-28 w-28 rounded-2xl border-2 border-gold/40 bg-card/60 p-1 shadow-gold overflow-hidden">
            <img src={preview} alt="avatar preview" className="h-full w-full" />
          </div>
          <button
            onClick={() => setSeed(randomSeed())}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-4 py-1.5 text-xs font-semibold hover:border-gold/40 transition-smooth"
          >
            <Shuffle className="h-3.5 w-3.5" /> Randomizar
          </button>
        </div>

        {/* Style picker */}
        <div>
          <p className="mb-2 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Estilo</p>
          <div className="grid grid-cols-4 gap-2">
            {STYLES.map(s => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={`flex flex-col items-center gap-1 rounded-xl border p-1.5 transition-smooth ${
                  style === s.id
                    ? "border-gold/60 bg-gold/10"
                    : "border-border bg-secondary/60 hover:border-gold/30"
                }`}
              >
                <img
                  src={dicebearUrl(s.id, seed)}
                  alt={s.label}
                  className="h-10 w-10"
                />
                <span className="text-[9px] font-semibold text-muted-foreground leading-none">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={save}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gold py-3 text-sm font-bold text-background disabled:opacity-60 transition-smooth hover:scale-[1.01]"
        >
          {saving ? "A guardar…" : <><Check className="h-4 w-4" /> Guardar avatar</>}
        </button>
      </div>
    </div>
  );
}

// Renders an avatar — falls back to initial letter if no avatar_url
export function UserAvatar({
  avatarUrl: url,
  name,
  size = 16,
  className = "",
}: {
  avatarUrl?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const initial = (name ?? "?").charAt(0).toUpperCase();
  const colors = ["#E61D25", "#3CAC3B", "#2A398D", "#D4A843", "#9333ea", "#06b6d4"];
  const bg = colors[(initial.charCodeAt(0) ?? 0) % colors.length];

  const sizeClass = `h-${size} w-${size}`;

  if (url) {
    return (
      <div className={`${sizeClass} shrink-0 overflow-hidden rounded-2xl ${className}`}>
        <img src={url} alt={name ?? "avatar"} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} shrink-0 grid place-items-center rounded-2xl font-display text-white ${className}`}
      style={{ background: bg, fontSize: size * 2.5 }}
    >
      {initial}
    </div>
  );
}
