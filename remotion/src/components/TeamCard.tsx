import React from "react";

interface TeamCardProps {
  name: string;
  emoji: string;
  votes: number;
  color: string;
}

export const TeamCard: React.FC<TeamCardProps> = ({
  name,
  emoji,
  votes,
  color,
}) => {
  return (
    <div
      style={{
        backgroundColor: "rgba(255,255,255,0.06)",
        border: `2px solid ${color}`,
        borderRadius: 24,
        padding: "40px 32px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        flex: 1,
        maxWidth: 380,
        boxShadow: `0 0 40px ${color}44`,
      }}
    >
      <span style={{ fontSize: 96, lineHeight: 1 }}>{emoji}</span>
      <span
        style={{
          color: "#ffffff",
          fontSize: 40,
          fontWeight: 800,
          textAlign: "center",
        }}
      >
        {name}
      </span>
      <span
        style={{
          color: color,
          fontSize: 32,
          fontWeight: 700,
        }}
      >
        {votes.toLocaleString("pt-PT")}
      </span>
    </div>
  );
};
