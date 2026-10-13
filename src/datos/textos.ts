/**
 * Todos los textos del sitio viven en este archivo.
 * Para cambiar un texto no hace falta tocar ningún componente.
 *
 * Tono (manual de identidad, sección 08): claro, concreto, cercano (voseo), seguro.
 * La bajada oficial va siempre completa, con mayúscula inicial y punto final.
 */

export const MARCA = {
  nombre: "Quvant",
  logotipo: "QUVANT",
  bajada: "Software a la vanguardia de cada nicho.",
  pronunciacion: "«kúvant»",
} as const;

/** Secciones ancladas. El número es el contador que acompaña toda la página (la portada es 01). */
export const NAV = [
  { id: "nosotros", numero: "02", etiqueta: "Nosotros" },
  { id: "plataformas", numero: "03", etiqueta: "Plataformas" },
  { id: "webs", numero: "04", etiqueta: "Webs" },
  { id: "contacto", numero: "05", etiqueta: "Contacto" },
] as const;

export const ACCESIBILIDAD = {
  saltarAlContenido: "Saltar al contenido",
  irAlInicio: "Quvant — ir al inicio",
  abrirMenu: "Abrir menú",
  cerrarMenu: "Cerrar menú",
  navPrincipal: "Secciones del sitio",
} as const;

export const HERO = {
  titulo: "QUVANT",
  bajada: MARCA.bajada,
  botonPrimario: { texto: "Ver lo que hacemos", destino: "#plataformas" },
  botonSecundario: { texto: "Hablemos", destino: "#contacto" },
} as const;

/**
 * Marcadores de las secciones que todavía no se construyeron.
 * Se reemplazan por las secciones reales en las fases 4 a 7.
 */
export const EN_CONSTRUCCION = [
  { id: "nosotros", numero: "02", titulo: "Nosotros" },
  { id: "plataformas", numero: "03", titulo: "Plataformas" },
  { id: "webs", numero: "04", titulo: "Webs" },
  { id: "contacto", numero: "05", titulo: "Contacto" },
] as const;

export const PIE = {
  etiquetaSecciones: "Secciones",
  etiquetaSeguinos: "Seguinos",
  derechos: "© 2026 Quvant",
} as const;
