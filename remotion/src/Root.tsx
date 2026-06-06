import React from "react";
import { Composition } from "remotion";
import { VozDoMundialReel } from "./compositions/VozDoMundialReel";

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;
const DURATION_SECONDS = 15;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VozDoMundialReel"
        component={VozDoMundialReel}
        durationInFrames={FPS * DURATION_SECONDS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          teamA: "Portugal",
          teamB: "Espanha",
          competition: "Mundial 2026 · Fase de Grupos",
          question: "Quem vence em tempo regulamentar?",
          voteCountA: 5841,
          voteCountB: 3967,
        }}
      />
    </>
  );
};
