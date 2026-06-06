import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { VoteBar } from "../components/VoteBar";
import { TeamCard } from "../components/TeamCard";

export interface VozDoMundialReelProps {
  title: string;
  subtitle: string;
  teamA: string;
  teamB: string;
  voteCountA: number;
  voteCountB: number;
}

export const VozDoMundialReel: React.FC<VozDoMundialReelProps> = ({
  title,
  subtitle,
  teamA,
  teamB,
  voteCountA,
  voteCountB,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const totalVotes = voteCountA + voteCountB;
  const pctA = totalVotes > 0 ? voteCountA / totalVotes : 0.5;
  const pctB = 1 - pctA;

  // Entrance animations
  const headerOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const headerY = interpolate(frame, [0, 20], [-40, 0], {
    extrapolateRight: "clamp",
  });

  const cardsScale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.8 },
  });

  const barsOpacity = interpolate(frame, [25, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const footerOpacity = interpolate(frame, [35, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={styles.background}>
      {/* Gradient overlay */}
      <AbsoluteFill style={styles.gradientOverlay} />

      {/* Header */}
      <div
        style={{
          ...styles.header,
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
        }}
      >
        <div style={styles.brandBadge}>VOZ DO MUNDIAL</div>
        <h1 style={styles.title}>{title}</h1>
        <p style={styles.subtitle}>{subtitle}</p>
      </div>

      {/* Team cards */}
      <div
        style={{
          ...styles.teamsRow,
          transform: `scale(${cardsScale})`,
          opacity: cardsScale,
        }}
      >
        <TeamCard name={teamA} emoji="🇵🇹" votes={voteCountA} color="#006600" />
        <div style={styles.vsLabel}>VS</div>
        <TeamCard name={teamB} emoji="🇧🇷" votes={voteCountB} color="#009c3b" />
      </div>

      {/* Vote bars */}
      <div style={{ ...styles.barsSection, opacity: barsOpacity }}>
        <VoteBar
          label={teamA}
          percentage={pctA}
          color="#d52b1e"
          frame={frame}
          startFrame={25}
          fps={fps}
        />
        <VoteBar
          label={teamB}
          percentage={pctB}
          color="#009c3b"
          frame={frame}
          startFrame={30}
          fps={fps}
        />
        <p style={styles.totalVotes}>
          {totalVotes.toLocaleString("pt-PT")} votos
        </p>
      </div>

      {/* Footer CTA */}
      <div style={{ ...styles.footer, opacity: footerOpacity }}>
        <p style={styles.ctaText}>Vota agora em</p>
        <p style={styles.ctaUrl}>vozdomundial.pt</p>
      </div>
    </AbsoluteFill>
  );
};

const styles: Record<string, React.CSSProperties> = {
  background: {
    backgroundColor: "#0a0a1a",
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  },
  gradientOverlay: {
    background:
      "radial-gradient(ellipse at 50% 0%, rgba(0,102,204,0.25) 0%, transparent 70%)",
  },
  header: {
    position: "absolute",
    top: 120,
    left: 0,
    right: 0,
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    padding: "0 60px",
  },
  brandBadge: {
    backgroundColor: "#0066cc",
    color: "#fff",
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: 4,
    padding: "10px 32px",
    borderRadius: 40,
    textTransform: "uppercase",
  },
  title: {
    color: "#ffffff",
    fontSize: 72,
    fontWeight: 900,
    textAlign: "center",
    margin: 0,
    lineHeight: 1.1,
    textShadow: "0 4px 20px rgba(0,0,0,0.5)",
  },
  subtitle: {
    color: "#aab4c8",
    fontSize: 36,
    margin: 0,
    textAlign: "center",
    letterSpacing: 1,
  },
  teamsRow: {
    position: "absolute",
    top: 560,
    left: 0,
    right: 0,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 32,
    padding: "0 40px",
  },
  vsLabel: {
    color: "#ffffff",
    fontSize: 56,
    fontWeight: 900,
    textShadow: "0 0 30px rgba(255,255,255,0.3)",
  },
  barsSection: {
    position: "absolute",
    top: 1080,
    left: 0,
    right: 0,
    padding: "0 80px",
    display: "flex",
    flexDirection: "column",
    gap: 32,
  },
  totalVotes: {
    color: "#7a8899",
    fontSize: 30,
    textAlign: "center",
    margin: "8px 0 0",
  },
  footer: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  ctaText: {
    color: "#aab4c8",
    fontSize: 32,
    margin: 0,
  },
  ctaUrl: {
    color: "#0066cc",
    fontSize: 44,
    fontWeight: 800,
    margin: 0,
    letterSpacing: 1,
  },
};
