/**
 * La cara visual de cada etapa de "Nuestro objetivo": un color propio (la
 * línea del recorrido cambia de color al avanzar) y una foto de ambiente
 * (Unsplash, licencia libre para uso comercial). Los textos están en
 * textos.ts (OBJETIVO.etapas).
 */

export const OBJETIVO_VISUAL = {
  escuchar: {
    color: "#4FD1C5",
    foto: { src: "/objetivo/escuchar.webp", alt: "Dos personas conversando en una mesa de trabajo" },
  },
  sonar: {
    color: "#B388FF",
    foto: { src: "/objetivo/sonar.webp", alt: "Una persona mirando la ciudad de noche" },
  },
  bajar: {
    color: "#F0A33A",
    foto: { src: "/objetivo/bajar.webp", alt: "Alguien ordenando ideas en una pizarra llena de notas" },
  },
  construir: {
    color: "#7BD389",
    foto: { src: "/objetivo/construir.webp", alt: "Un equipo trabajando junto frente a una computadora" },
  },
} as const;

export type IdEtapa = keyof typeof OBJETIVO_VISUAL;
