interface TeamBadgeProps {
  code: string | null;
  flag: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}

export function TeamBadge({ flag, name, size = "md" }: TeamBadgeProps) {
  const sizeCls =
    size === "lg" ? "h-16 w-16 text-4xl rounded-2xl" :
    size === "sm" ? "h-9 w-9 text-xl rounded-xl" :
                   "h-14 w-14 text-3xl rounded-2xl";

  return (
    <div
      className={`${sizeCls} grid place-items-center bg-secondary border border-border`}
      style={{ boxShadow: "0 2px 8px oklch(0 0 0 / 0.10)" }}
    >
      {flag ?? "⚽"}
    </div>
  );
}
