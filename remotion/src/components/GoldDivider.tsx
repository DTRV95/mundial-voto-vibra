import React from "react";

interface GoldDividerProps {
  opacity?: number;
  width?: string;
}

export const GoldDivider: React.FC<GoldDividerProps> = ({
  opacity = 1,
  width = "60%",
}) => (
  <div
    style={{
      width,
      height: 1,
      background:
        "linear-gradient(90deg, transparent, #b8972a 20%, #f0c040 50%, #b8972a 80%, transparent)",
      opacity,
      margin: "0 auto",
    }}
  />
);
