import { useState } from "react";

/**
 * Arte oficial da competição como fundo do painel.
 *
 * Coloca a imagem em `src/assets/comp-<slug>.png` (ex: comp-champions.png)
 * que ela é usada automaticamente. Sem imagem, o painel usa a atmosfera desenhada.
 */

const artFiles = import.meta.glob("../assets/comp-*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

export function findCompetitionArt(slug: string): string | null {
  const match = Object.entries(artFiles).find(([path]) =>
    path.toLowerCase().includes(`comp-${slug.toLowerCase()}.`)
  );
  return match ? match[1] : null;
}

export function CompetitionArt({ slug, position = "center 50%" }: { slug: string; position?: string }) {
  const src = findCompetitionArt(slug);
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none" aria-hidden>
      <img
        src={src}
        alt=""
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
        style={{ objectPosition: position }}
      />
      {/* Véu à esquerda — garante leitura do texto sobre a arte */}
      <div className="absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, rgba(4,10,24,0.62) 0%, rgba(4,10,24,0.42) 26%, rgba(4,10,24,0.14) 50%, rgba(4,10,24,0.06) 74%, rgba(4,10,24,0.18) 100%)",
        }} />
      {/* Escurecimento do rodapé, para as estatísticas */}
      <div className="absolute inset-x-0 bottom-0 h-24"
        style={{ background: "linear-gradient(0deg, rgba(4,10,24,0.82), rgba(4,10,24,0.30) 55%, transparent)" }} />
    </div>
  );
}
