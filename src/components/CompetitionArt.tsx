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

export function CompetitionArt({ slug }: { slug: string }) {
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
        style={{ objectPosition: "center 26%" }}
      />
      {/* Véu à esquerda — garante leitura do texto sobre a arte */}
      <div className="absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, rgba(4,10,24,0.92) 0%, rgba(4,10,24,0.66) 30%, rgba(4,10,24,0.18) 52%, rgba(4,10,24,0.10) 75%, rgba(4,10,24,0.34) 100%)",
        }} />
      {/* Escurecimento do rodapé, para as estatísticas */}
      <div className="absolute inset-x-0 bottom-0 h-24"
        style={{ background: "linear-gradient(0deg, rgba(4,10,24,0.75), transparent)" }} />
    </div>
  );
}
