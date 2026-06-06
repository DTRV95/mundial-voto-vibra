import { continueRender, delayRender } from "remotion";

export const BEBAS = "'Bebas Neue', 'Arial Black', sans-serif";
export const INTER = "'Inter', 'Helvetica Neue', Arial, sans-serif";

// Carrega as fontes do Google via delayRender para garantir que estão
// disponíveis antes do primeiro frame renderizado.
const handle = delayRender("A carregar fontes Google");

const link = document.createElement("link");
link.rel = "stylesheet";
link.href =
  "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;600;700;800;900&display=swap";
link.onload = () => continueRender(handle);
link.onerror = () => continueRender(handle); // fallback gracioso
document.head.appendChild(link);
