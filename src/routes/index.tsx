import { createFileRoute } from "@tanstack/react-router";
import { PaginaLancamento } from "@/components/PaginaLancamento";

/**
 * A homepage de geracao2026.com.
 *
 * O Mundial acabou. Até 1 de outubro, quem chega aqui vê a página de
 * lançamento da época nova — a data, o tempo que falta e o que vem aí.
 *
 * A homepage do Mundial está no histórico do git (commit c48db9d), e o
 * site da época 2026/27 vive todo no ramo `epoca-2027`. No dia do
 * lançamento este ficheiro volta a apontar para a homepage a sério.
 *
 * As restantes páginas do Mundial continuam a funcionar: quem tiver
 * links antigos guardados não fica sem nada.
 */

const SITE = "https://geracao2026.com";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Uma Geração — a nova época chega a 1 de outubro" },
      {
        name: "description",
        content:
          "Liga Portugal e Champions, cinco jogos por jornada, divisões, duelos e torneios entre amigos. A nova versão do Uma Geração chega a 1 de outubro de 2026.",
      },
      { property: "og:title", content: "Uma Geração — 1 de outubro" },
      {
        property: "og:description",
        content: "A nova época está a chegar. Liga Portugal e Champions, todas as jornadas, todo o ano.",
      },
      { property: "og:url", content: `${SITE}/` },
      { property: "og:image", content: `${SITE}/og-image.png` },
    ],
    links: [{ rel: "canonical", href: `${SITE}/` }],
  }),
  component: PaginaLancamento,
});
