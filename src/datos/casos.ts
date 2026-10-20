/**
 * Casos de la sección "Webs". Para sumar un caso nuevo alcanza con
 * agregar un objeto a CASOS: la sección se arma sola.
 *
 * Regla dura: Ferremix es una PROPUESTA de rediseño, no el sitio oficial.
 * Los links dicen "Ver propuesta" / "Pasar la demo", nunca "sitio en vivo".
 */

export type ImagenCaso = {
  src: string;
  ancho: number;
  alto: number;
  alt: string;
};

export type CasoWeb = {
  id: string;
  cliente: string;
  etiqueta: string;
  titulo: string;
  descripcionCliente: string;
  puntos: readonly string[];
  escritorio: { antes: ImagenCaso; despues: ImagenCaso };
  celular: { antes: ImagenCaso; despues: ImagenCaso };
  demo: {
    titulo: string;
    nota: string;
    /**
     * La demo de yunque-rust.vercel.app hoy manda X-Frame-Options: DENY y
     * frame-ancestors 'none', así que el iframe está apagado. Cuando ese
     * deploy permita embeberse (ver README del caso en el reporte de la
     * fase 6), pasar a true y aparece incrustada.
     */
    embebible: boolean;
  };
  enlaces: {
    demo: { url: string; texto: string };
    propuesta: { url: string; texto: string };
  };
};

export const CASOS: readonly CasoWeb[] = [
  {
    id: "ferremix",
    cliente: "Ferremix",
    etiqueta: "Propuesta de rediseño",
    titulo: "Propuesta de rediseño para Ferremix: catálogo con precio y stock desde el celular.",
    descripcionCliente:
      "Ferretería industrial de Moreno, mayorista y minorista: STIHL, Husqvarna, Niwa, Milwaukee y servicio técnico.",
    puntos: [
      "Pensada para el celular.",
      "Catálogo por categoría con precio y stock.",
      "Botón de presupuesto directo.",
    ],
    escritorio: {
      antes: {
        src: "/casos/ferremix/escritorio-antes.jpg",
        ancho: 1440,
        alto: 900,
        alt: "La web actual de Ferremix en una pantalla de escritorio",
      },
      despues: {
        src: "/casos/ferremix/escritorio-despues.jpg",
        ancho: 1440,
        alto: 900,
        alt: "La propuesta de rediseño para Ferremix en una pantalla de escritorio",
      },
    },
    celular: {
      antes: {
        src: "/casos/ferremix/celular-antes.jpg",
        ancho: 390,
        alto: 844,
        alt: "La web actual de Ferremix en un celular",
      },
      despues: {
        src: "/casos/ferremix/celular-despues.jpg",
        ancho: 390,
        alto: 844,
        alt: "La propuesta de rediseño para Ferremix en un celular",
      },
    },
    demo: {
      titulo: "Así se vería Yunque en Ferremix",
      nota: "Una recorrida guiada, paso a paso y con sus propios controles, por el sistema aplicado al caso.",
      embebible: false,
    },
    enlaces: {
      demo: { url: "https://yunque-rust.vercel.app/demo/ferremix#1", texto: "Pasar la demo" },
      propuesta: { url: "https://ferremix-propuesta.vercel.app/", texto: "Ver la propuesta para Ferremix" },
    },
  },
];

export const CASO_PROXIMO = {
  titulo: "Tu empresa puede ser la próxima",
  texto: "Contanos qué tenés hoy y te mostramos qué puede ser.",
  accion: { texto: "Hablemos", destino: "/contacto" },
} as const;
