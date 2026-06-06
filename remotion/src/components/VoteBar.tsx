import React from "react";
import { interpolate, spring } from "remotion";

interface VoteBarProps {
  label: string;
  percentage: number;
  color: string;
  frame: number;
  startFrame: number;
  fps: number;
}

export const VoteBar: React.FC<VoteBarProps> = ({
  label,
  percentage,
  color,
  frame,
  startFrame,
  fps,
}) => {
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 20, stiffness: 80, mass: 1 },
    from: 0,
    to: percentage,
  });

  const clampedProgress = Math.max(0, Math.min(1, progress));
  const pctLabel = Math.round(clampedProgress * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ color: "#ffffff", fontSize: 34, fontWeight: 700 }}>
          {label}
        </span>
        <span style={{ color, fontSize: 34, fontWeight: 800 }}>
          {pctLabel}%
        </span>
      </div>
      <div
        style={{
          height: 24,
          backgroundColor: "rgba(255,255,255,0.1)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${clampedProgress * 100}%`,
            backgroundColor: color,
            borderRadius: 12,
            boxShadow: `0 0 12px ${color}88`,
          }}
        />
      </div>
    </div>
  );
};
