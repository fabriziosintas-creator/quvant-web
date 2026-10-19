/**
 * La cara visual de cada servicio: un acento y una imagen que muestra de
 * verdad lo que se ofrece. Los textos siguen en textos.ts (NOSOTROS.servicios).
 *
 * - "sistemas": la pantalla real del tablero de Quvant (empresa demo).
 * - "app": una foto de ambiente, libre (Unsplash).
 * - "web": la propuesta real de rediseño para Ferremix.
 *
 * Todas van con su color original (decisión del 19-oct-2026: ni tinte del
 * acento ni blanco y negro en estas tres).
 */

export const SERVICIOS_VISUAL = {
  sistemas: {
    color: "#4FD1C5",
    imagen: {
      src: "/sistema/tablero.webp",
      alt: "El tablero del dueño en Quvant, con las ventas del día y del mes (empresa demo)",
    },
  },
  app: {
    color: "#B388FF",
    imagen: {
      src: "/servicios/app.webp",
      alt: "Un desarrollador trabajando con varias pantallas en una oficina a oscuras",
    },
  },
  web: {
    color: "#6C8CFF",
    imagen: {
      src: "/casos/ferremix/escritorio-despues.jpg",
      alt: "La propuesta de rediseño de la web de Ferremix, en escritorio",
    },
  },
} as const;

export type IdServicio = keyof typeof SERVICIOS_VISUAL;
