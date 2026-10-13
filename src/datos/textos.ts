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

export const CONTACTO_SECCION = {
  numero: "05",
  etiqueta: "Contacto",
  titulo: "Contanos qué necesitás.",
  bajada:
    "Completá estos datos y el mensaje te queda armado: lo mandás por WhatsApp o por email, como prefieras.",
  campos: {
    nombre: { etiqueta: "Nombre", marcador: "¿Cómo te llamás?" },
    empresa: { etiqueta: "Empresa (opcional)", marcador: "El nombre de tu empresa" },
    rubro: { etiqueta: "Rubro", marcador: "Ferretería, gimnasio, inmobiliaria…" },
    necesidad: {
      etiqueta: "Qué necesitás",
      opciones: [
        { id: "sistema", texto: "Un sistema listo para mi rubro" },
        { id: "app", texto: "Una app a medida" },
        { id: "web", texto: "Una web nueva o renovada" },
      ],
    },
    mensaje: { etiqueta: "Mensaje", marcador: "Contanos tu situación en dos líneas." },
  },
  botones: { whatsapp: "Enviar por WhatsApp", email: "Prefiero por email" },
  nota: "El mensaje se abre en tu WhatsApp o tu email, listo para mandar. No guardamos nada en ningún servidor.",
  directo: {
    etiqueta: "Directo",
    titulo: "¿Ya sabés lo que querés?",
    filas: { whatsapp: "WhatsApp", email: "Email", instagram: "Instagram" },
  },
  asuntoEmail: "Consulta desde la web de Quvant",
} as const;

export const WEBS = {
  numero: "04",
  etiqueta: "Webs",
  titulo: "Páginas web para nuestros clientes.",
  bajada:
    "Desde cero o renovando la que quedó vieja, con migración segura de los datos sensibles. Así se trabaja: con una propuesta concreta sobre la mesa.",
  etiquetaAntes: "Antes",
  etiquetaDespues: "Después",
  ayudaDeslizador: "Comparar la web actual con la propuesta (arrastrá o usá las flechas)",
  etiquetaCelular: "La propuesta en el celular",
  notaCelular: "Con el scroll, el teléfono gira: de la web actual a la propuesta.",
  etiquetaDemo: "La demo, paso a paso",
  etiquetaQueCambio: "Qué cambió",
} as const;

export const PLATAFORMAS = {
  numero: "03",
  etiqueta: "Plataformas",
  titulo: "El mismo núcleo, un sistema para cada rubro.",
  bajada:
    "Quvant es el sistema de gestión: un núcleo común que ya funciona y, arriba, una plantilla pensada para cada rubro. Cada producto lleva su nombre y la firma de la casa.",
  nucleo: {
    etiqueta: "El núcleo común",
    modulos: ["Usuarios y roles", "Sucursales", "Caja", "Ventas", "Stock", "Reportes"],
  },
  hoy: {
    etiqueta: "Lo que hace hoy",
    etiquetaResto: "Y además",
    destacadas: [
      {
        id: "margen",
        titulo: "El margen, antes de tocar un precio",
        texto: "Ves el margen antes de aplicar un aumento masivo de precios.",
      },
      {
        id: "offline",
        titulo: "Sin internet, se sigue vendiendo",
        texto: "Se sigue vendiendo sin internet en el mostrador.",
      },
      {
        id: "tablero",
        titulo: "Cada rol ve lo suyo",
        texto: "Tablero por rol con «Para atender hoy»; el dueño ve todo desde el celular.",
      },
      {
        id: "stock",
        titulo: "El stock, sucursal por sucursal",
        texto: "Stock por sucursal y conteo con la cámara del teléfono.",
      },
      {
        id: "compras",
        titulo: "Compras que se sugieren solas",
        texto: "Compras sugeridas según el stock mínimo.",
      },
    ],
    resto: [
      "Presupuestos que pasan a venta en un clic",
      "Cuentas corrientes con límite",
      "Taller de servicio técnico",
      "Hoja de ruta de reparto",
      "Reportes exportables",
      "Importación desde Excel",
      "Permisos por rol y doble factor para el dueño",
    ],
  },
  rubros: {
    etiqueta: "Rubros",
    notaVacio: "Estamos entrando en este rubro. Si es el tuyo, hablemos.",
    items: [
      {
        id: "industria",
        nombre: "Industria",
        estado: "disponible",
        descripcion: "Fábricas, ferreterías industriales y empresas con depósito.",
        productos: [
          {
            nombre: "Yunque",
            firma: "by Quvant",
            rol: "El sistema de gestión e inventario para empresas industriales: stock por sucursal, compras y ventas en un solo lugar.",
          },
          {
            nombre: "Forja",
            firma: "by Quvant",
            rol: "El complemento de Yunque que muestra el inventario y las sucursales en 3D.",
          },
        ],
      },
      {
        id: "gimnasios",
        nombre: "Gimnasios y fitness",
        estado: "disponible",
        descripcion: "Gimnasios, boxes y estudios de entrenamiento.",
        productos: [
          {
            nombre: "Quvant Gimnasios",
            firma: "",
            rol: "La administración del gimnasio, armada sobre el núcleo Quvant.",
          },
          {
            nombre: "HackFit",
            firma: "by Quvant",
            rol: "La app para los socios: rutinas basadas en evidencia y dietas personalizadas. Gratis para los socios del gimnasio.",
          },
        ],
      },
      {
        id: "holistica",
        nombre: "Holística",
        estado: "proximamente",
        descripcion: "Centros y profesionales del bienestar.",
        productos: [],
      },
      {
        id: "pymes",
        nombre: "Pymes",
        estado: "en-diseno",
        descripcion: "Comercios y empresas chicas de cualquier rubro.",
        productos: [
          {
            nombre: "Crisol",
            firma: "by Quvant",
            rol: "La gestión completa para pymes, del presupuesto al reporte.",
          },
        ],
      },
      {
        id: "inmobiliarias",
        nombre: "Inmobiliarias",
        estado: "en-diseno",
        descripcion: "Venta, alquileres y administración de propiedades.",
        productos: [
          {
            nombre: "Cimiento",
            firma: "by Quvant",
            rol: "Cartera de propiedades, contratos y cobranzas para inmobiliarias.",
          },
        ],
      },
      {
        id: "supermercados",
        nombre: "Supermercados",
        estado: "en-diseno",
        descripcion: "Cadenas con muchas cajas y mucho movimiento.",
        productos: [
          {
            nombre: "Góndola",
            firma: "by Quvant",
            rol: "Para cadenas con muchas cajas: venta rápida, stock y sucursales.",
          },
        ],
      },
    ],
  },
  estados: {
    disponible: "Disponible hoy",
    proximamente: "Próximamente",
    "en-diseno": "En diseño",
  },
  ilustracionEjemplo: "Ilustración de ejemplo",
  forjaVentana: "Forja · El depósito en 3D",
  integraciones: {
    etiqueta: "Integraciones en camino",
    items: ["Facturación con ARCA", "Cobros con Mercado Pago", "Avisos por WhatsApp"],
    nota: "Están en desarrollo: las anunciamos cuando funcionen, no antes.",
  },
} as const;

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
