import { Composition } from "remotion";
import { VozDoMundialReel } from "./compositions/VozDoMundialReel";

// 1080x1920 @ 30fps — formato Reels/Shorts
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
          title: "Quem vais tu votar?",
          subtitle: "Mundial 2026 · Fase de Grupos",
          teamA: "Portugal",
          teamB: "Brasil",
          voteCountA: 4823,
          voteCountB: 3201,
        }}
      />
    </>
  );
};
