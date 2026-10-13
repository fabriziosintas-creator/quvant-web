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
 * Se reemplazan por las secciones reales en las fases 5 a 7.
 */
export const EN_CONSTRUCCION = [
  { id: "plataformas", numero: "03", titulo: "Plataformas" },
  { id: "webs", numero: "04", titulo: "Webs" },
  { id: "contacto", numero: "05", titulo: "Contacto" },
] as const;

export const NOSOTROS = {
  numero: "02",
  etiqueta: "Nosotros",
  titulo: "Dos amigos, dos fuerzas, una sola marca.",
  origen:
    "Quvant nace del sueño de dos amigos apasionados por el desarrollo de aplicaciones, con más de siete años de experiencia.",
  fuerzas: {
    desarrollo: {
      etiqueta: "Fuerza de desarrollo",
      texto:
        "Muchos años programando. Construimos sistemas que funcionan todos los días, para empresas de primer nivel.",
    },
    comercial: {
      etiqueta: "Fuerza comercial",
      texto:
        "Entender al cliente. Conocer el negocio, el rubro y a la gente que lo mueve antes de escribir una línea de código.",
    },
    resultado: "QUVANT",
  },
  equipo: [
    {
      nombre: "Michel",
      iniciales: "M",
      rol: "Fuerza de desarrollo",
      cargo: "Developer principal",
      bajada: "El encargado de darle vida y forma a todas las ideas.",
      titulo: "", // TODO: título o formación de Michel.
      linkedin: "", // TODO: URL del perfil de LinkedIn de Michel.
      foto: "", // TODO: guardar la foto en public/equipo/michel.jpg y poner acá "/equipo/michel.jpg".
      habilidades: [
        // TODO: confirmar los niveles de Michel con fabrizio (solo Desarrollo 5 es seguro).
        { nombre: "Desarrollo", nivel: 5 },
        { nombre: "Creatividad", nivel: 4 },
        { nombre: "Comercialización", nivel: 2 },
      ],
    },
    {
      nombre: "Fabrizio",
      iniciales: "F",
      rol: "Fuerza comercial",
      cargo: "Área comercial",
      bajada:
        "Entiende el negocio de cada cliente y busca soluciones que simplifiquen el trabajo adentro de las empresas.",
      titulo: "", // TODO: título o formación de Fabrizio.
      linkedin: "", // TODO: URL del perfil de LinkedIn de Fabrizio.
      foto: "", // TODO: guardar la foto en public/equipo/fabrizio.jpg y poner acá "/equipo/fabrizio.jpg".
      habilidades: [
        { nombre: "Desarrollo", nivel: 2 },
        { nombre: "Creatividad", nivel: 4 },
        { nombre: "Comercialización", nivel: 5 },
      ],
    },
  ],
  mision: {
    etiqueta: "Misión",
    texto: "Entrar en cada rubro, entender cómo trabaja y construir el sistema que todavía no tiene.",
  },
  comoTrabajamos: {
    etiqueta: "Cómo trabajamos",
    servicios: [
      {
        nombre: "Sistemas listos para tu nicho",
        texto:
          "Gestión y administración ya armadas para rubros específicos. Se contratan por mes y se usan desde el primer día.",
      },
      {
        nombre: "Tu aplicación, de punta a punta",
        texto:
          "La app de tu empresa desde cero: stock, gestión, administración, seguimiento de ventas. Por fases, y cada fase se prueba antes de seguir.",
      },
      {
        nombre: "Tu web, nueva o renovada",
        texto:
          "Desde cero o renovando la que quedó vieja, con migración segura de los datos sensibles.",
      },
    ],
  },
} as const;

export const PIE = {
  etiquetaSecciones: "Secciones",
  etiquetaSeguinos: "Seguinos",
  derechos: "© 2026 Quvant",
} as const;
