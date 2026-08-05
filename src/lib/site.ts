/**
 * Constantes do site.
 *
 * O domínio estava escrito à mão em 30 sítios — partilhas, metadados,
 * links de convite. Mudá-lo obrigava a caçá-los todos.
 */
export const SITE_URL = "https://geracao2026.com";

/** Link absoluto para uma rota interna. */
export const url = (caminho: string) =>
  `${SITE_URL}${caminho.startsWith("/") ? caminho : `/${caminho}`}`;
