import React, { useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

function sr(seed: number): number {
  const x = Math.sin(seed + 1) * 73856;
  return x - Math.floor(x);
}

// ── Camera ────────────────────────────────────────────────────────────────────

const CameraController: React.FC<{ frame: number }> = ({ frame }) => {
  const { camera } = useThree();

  const z = interpolate(frame, [0, 119], [8.5, 5.2], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [0, 119], [0.4, -0.2], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  camera.position.set(0, y, z);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  return null;
};

// ── Esfera com vertex colors ──────────────────────────────────────────────────

const ColoredSphere: React.FC<{ frame: number }> = ({ frame }) => {
  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(2, 80, 80);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const cols: number[] = [];

    for (let i = 0; i < pos.count; i++) {
      const nx = (pos.getX(i) + 2) / 4; // 0→1

      if (nx < 0.38) {
        cols.push(0.235, 0.675, 0.231); // #3CAC3B
      } else if (nx < 0.74) {
        cols.push(0.902, 0.114, 0.145); // #E61D25
      } else {
        cols.push(0.165, 0.224, 0.553); // #2A398D
      }
    }

    geo.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    return geo;
  }, []);

  const opacity = interpolate(frame, [0, 28], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Exit: esfera escala para 0 à medida que explode (frames 102-119)
  const exitScale = interpolate(frame, [102, 119], [1, 0], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = frame >= 102 ? exitScale : 1;

  return (
    <mesh
      rotation={[frame * 0.007, frame * 0.016, frame * 0.003]}
      geometry={geometry}
      scale={[scale, scale, scale]}
    >
      <meshPhongMaterial
        vertexColors
        shininess={90}
        specular={new THREE.Color(0.5, 0.5, 0.5)}
        transparent
        opacity={opacity}
      />
    </mesh>
  );
};

// ── Nuvem de partículas ───────────────────────────────────────────────────────

const Particles: React.FC<{ frame: number }> = ({ frame }) => {
  const geo = useMemo(() => {
    const count = 140;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette: [number, number, number][] = [
      [0.235, 0.675, 0.231],
      [0.902, 0.114, 0.145],
      [0.165, 0.224, 0.553],
      [1, 1, 1],
    ];

    for (let i = 0; i < count; i++) {
      const r = 2.8 + sr(i * 6) * 2.4;
      const theta = sr(i * 6 + 1) * Math.PI * 2;
      const phi = Math.acos(2 * sr(i * 6 + 2) - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const c = palette[Math.floor(sr(i * 6 + 3) * palette.length)];
      colors[i * 3] = c[0];
      colors[i * 3 + 1] = c[1];
      colors[i * 3 + 2] = c[2];
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, []);

  const opacity = interpolate(frame, [12, 45], [0, 0.85], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const exitOpacity = interpolate(frame, [100, 120], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <points geometry={geo} rotation={[frame * 0.003, frame * 0.005, 0]}>
      <pointsMaterial
        size={0.07}
        vertexColors
        transparent
        opacity={opacity * (frame >= 100 ? exitOpacity : 1)}
        sizeAttenuation
      />
    </points>
  );
};

// ── Flash de explosão ─────────────────────────────────────────────────────────

const ExplosionFlash: React.FC<{ frame: number }> = ({ frame }) => {
  const scale = interpolate(frame, [108, 122], [0, 18], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(frame, [108, 126], [0.9, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (frame < 108) return null;

  return (
    <mesh scale={[scale, scale, scale]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={opacity} />
    </mesh>
  );
};

// ── Conteúdo da cena (dentro do contexto R3F) ─────────────────────────────────

const Scene1Content: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    <CameraController frame={frame} />
    <ambientLight intensity={0.45} />
    <pointLight position={[5, 5, 5]} intensity={1.8} />
    <pointLight position={[-4, -3, 4]} color="#E61D25" intensity={0.9} />
    <pointLight position={[3, -5, 2]} color="#3CAC3B" intensity={0.7} />
    <ColoredSphere frame={frame} />
    <Particles frame={frame} />
    <ExplosionFlash frame={frame} />
  </>
);

// ── Export ────────────────────────────────────────────────────────────────────

export const SphereScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <ThreeCanvas width={1080} height={1920}>
        <Scene1Content frame={frame} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
