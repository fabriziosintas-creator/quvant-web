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
  { id: "objetivo", numero: "02", etiqueta: "Objetivo" },
  { id: "nosotros", numero: "03", etiqueta: "Nosotros" },
  { id: "plataformas", numero: "04", etiqueta: "Plataformas" },
  { id: "webs", numero: "05", etiqueta: "Webs" },
  { id: "contacto", numero: "06", etiqueta: "Contacto" },
] as const;

/** Interruptor fijo abajo al centro: apaga o prende el 3D de todo el sitio. */
export const INTERRUPTOR_VISTA = {
  etiqueta: "Elegir cómo ver el sitio",
  opcion3d: "Vista 3D",
  opcionTexto: "Vista texto",
} as const;

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
  botonPrimario: { texto: "Nuestros servicios", destino: "#servicios" },
  botonSecundario: { texto: "Hablemos", destino: "#contacto" },
} as const;

export const CONTACTO_SECCION = {
  numero: "06",
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
  numero: "05",
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
  numero: "04",
  etiqueta: "Plataformas",
  titulo: "El mismo núcleo, un sistema para cada rubro.",
  bajada:
    "Quvant es el sistema de gestión: un núcleo común que ya funciona y, arriba, una plantilla pensada para cada rubro. Cada producto lleva su nombre y la firma de la casa.",
  nucleo: {
    etiqueta: "El núcleo común",
    modulos: ["Usuarios y roles", "Sucursales", "Caja", "Ventas", "Stock", "Reportes"],
    titulo: "Un núcleo que ya funciona. Una plantilla por nicho.",
    texto:
      "Quvant es el núcleo: usuarios y roles, sucursales, caja, ventas, stock y reportes, hechos y probados. De ahí salen las ramas: cada nicho tiene su plantilla, con los widgets y las funciones que ese rubro necesita.",
    personalizable:
      "La plantilla se ajusta para cada cliente: se suman o se sacan widgets según cómo trabaja.",
    ventana: "Quvant · El núcleo y sus plantillas",
    ayuda: "Tocá un nicho y mirá qué le suma su plantilla.",
    etiquetaNucleo: "Núcleo",
    etiquetaModulos: "Módulos del núcleo",
    etiquetaWidgets: "Widgets de la plantilla · ejemplos",
    estadoNucleo: "Funcionando hoy",
    nota: "Ilustración de ejemplo: los widgets son ejemplos de lo que lleva cada plantilla.",
    apagado: "La escena 3D está apagada en la vista texto.",
  },
  hoy: {
    etiqueta: "Lo que hace hoy",
    etiquetaResto: "Y además",
    recorrido: {
      ventana: "Quvant · Tablero del dueño · Empresa demo",
      ayuda: "Tocá una función y la pantalla te lleva a donde pasa.",
      nota: "Pantallas reales del sistema, con los datos de la empresa demo.",
      inicio: {
        titulo: "Todos tus negocios en una pantalla",
        texto: "El tablero del dueño: lo que se vendió hoy, el mes, el margen y lo que hay que atender.",
      },
      reproduciendo: "Recorrido automático",
      pausado: "Recorrido en pausa",
    },
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
  forja: {
    ventana: "Forja · Recorrido real",
    nota: "Grabado en la demo · datos de ejemplo",
    descripcion:
      "Recorrido por Forja: la red con todas las sucursales, la entrada a Casa Central en 3D, los racks con lo que falta, la lista de productos críticos y la sala de control.",
    pausar: "Pausar el video",
    reproducir: "Reproducir el video",
  },
  integraciones: {
    etiqueta: "Integraciones en camino",
    items: ["Facturación con ARCA", "Cobros con Mercado Pago", "Avisos por WhatsApp"],
    nota: "Están en desarrollo: las anunciamos cuando funcionen, no antes.",
  },
} as const;

/**
 * Sección 02 · Objetivo: el manifiesto. Primero escuchar, después construir.
 * Cuatro etapas que se recorren con el scroll; cada una con su comentario.
 */
export const OBJETIVO = {
  numero: "02",
  etiqueta: "Nuestro objetivo",
  titulo: "Vos soñás en grande. Nosotros lo bajamos a tierra.",
  bajada:
    "Nuestro objetivo no es venderte un sistema: es entender tu negocio y construir lo que de verdad te hace falta. En ese orden.",
  ayuda: "Bajá despacio: el recorrido avanza con el scroll.",
  etapas: [
    {
      id: "escuchar",
      nombre: "Escuchar",
      titular: "Primero escuchamos.",
      texto:
        "Antes de proponer nada, entendemos cómo trabajás hoy: qué te traba, qué hacés a mano, qué te gustaría que pase solo. No llegamos con una solución armada; llegamos con preguntas.",
      marca: "Nada de soluciones enlatadas.",
    },
    {
      id: "sonar",
      nombre: "Soñar en grande",
      titular: "Queremos que sueñes en grande.",
      texto:
        "Contanos la idea completa, sin recortarla por miedo a que sea mucho. La versión ambiciosa es la que nos interesa: ahí está lo que tu negocio podría ser.",
      marca: "La idea entera, sin recortes.",
    },
    {
      id: "bajar",
      nombre: "Bajar a tierra",
      titular: "Nosotros la bajamos a tierra.",
      texto:
        "Convertimos esa idea en pasos concretos: qué va primero, qué puede esperar, cuánto lleva cada parte. Lo ambicioso se vuelve un plan que se puede empezar el lunes.",
      marca: "Un plan que se empieza el lunes.",
    },
    {
      id: "construir",
      nombre: "Construir y acompañar",
      titular: "Lo construimos por fases.",
      texto:
        "Cada fase se prueba antes de seguir, con vos adentro. Y cuando el sistema está andando no nos vamos: seguimos cerca, porque tu negocio cambia y el sistema tiene que cambiar con él.",
      marca: "Cada fase se prueba antes de seguir.",
    },
  ],
} as const;

export const NOSOTROS = {
  numero: "03",
  etiqueta: "Nosotros",
  titulo: "Dos amigos, dos fuerzas, una sola marca.",
  origen:
    "Quvant nace del sueño de dos amigos apasionados por el desarrollo de aplicaciones, con más de diez años de experiencia.",
  fuerzas: {
    desarrollo: {
      etiqueta: "Fuerza de desarrollo",
      titular: "Más de 10 años construyendo software.",
      parrafos: [
        "Desarrollamos sistemas y sitios web para startups y empresas de primer nivel. Lo que mejor hacemos es escuchar: entendemos cómo trabaja tu empresa, tomamos tus ideas y las convertimos en un sistema que tu equipo usa desde el primer día. Es simple, completo y no hace falta un manual.",
        "Trabajamos con las tecnologías más nuevas y usamos inteligencia artificial para construir más rápido y con más precisión. Así ponemos tu empresa a la vanguardia de su nicho.",
      ],
      puntos: ["Sistemas y sitios web", "Tecnologías nuevas", "IA para construir mejor"],
      dato: { numero: 10, prefijo: "+", etiqueta: "años construyendo software" },
      ventana: "quvant · construir.ts",
    },
    comercial: {
      etiqueta: "Fuerza comercial",
      titular: "Entendemos tu negocio antes de escribir una línea de código.",
      parrafos: [
        "Conocemos el negocio, el rubro y a la gente que lo mueve. Escuchamos cómo vendés, cómo cobrás y qué te frena hoy, y lo traducimos en un pedido claro para el equipo de desarrollo: nada se pierde entre lo que necesitás y lo que se construye.",
        "Te acompañamos desde la primera charla hasta que el sistema está andando en tu empresa. Y después también: si tu negocio cambia, el sistema cambia con él.",
      ],
      puntos: ["Escuchar primero", "Propuestas concretas", "Acompañamiento después"],
      dato: { numero: 4, prefijo: "", etiqueta: "etapas, de la idea al sistema andando" },
      ventana: "Así arranca una charla",
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
    },
  ],
  mision: {
    etiqueta: "Misión",
    texto: "Entrar en cada rubro, entender cómo trabaja y construir el sistema que todavía no tiene.",
  },
  servicios: {
    etiqueta: "Nuestros servicios",
    ayuda: "Elegí uno y mirá cómo lo armamos.",
    items: [
      {
        id: "sistemas",
        nombre: "Sistemas listos para tu nicho",
        texto:
          "Gestión y administración ya armadas para rubros específicos. Se contratan por mes y se usan desde el primer día.",
        ventana: "Núcleos Quvant · Multi núcleo",
        pie: "Construí tu propio núcleo: cada empresa con su sistema y un panel para seguirlas a todas.",
      },
      {
        id: "app",
        nombre: "Tu aplicación, de punta a punta",
        texto:
          "La app de tu empresa desde cero: stock, gestión, administración, seguimiento de ventas. Por fases, y cada fase se prueba antes de seguir.",
        ventana: "Fase por fase",
        pie: "Cada fase suma una parte usable y se prueba antes de arrancar la siguiente.",
      },
      {
        id: "web",
        nombre: "Tu web, nueva o renovada",
        texto:
          "Desde cero o renovando la que quedó vieja, con migración segura de los datos sensibles.",
        ventana: "De la web vieja a una con jerarquía",
        pie: "Lo que estaba amontonado se ordena: primero lo importante, después el resto.",
      },
    ],
    nota: "Ilustraciones de cómo trabajamos, no capturas de un sistema.",
    /** La escena de Núcleos Quvant (servicio 01). Empresas y cifras: src/datos/multinucleo.ts. */
    multinucleo: {
      panel: "Panel multi núcleo",
      datosEjemplo: "Datos de ejemplo",
      resumen: "4 empresas · 4 núcleos · 1 panel",
      capitulos: [
        {
          titulo: "Cada empresa, su núcleo",
          texto: "Cada una tiene su propio sistema y su administración, independientes.",
        },
        {
          titulo: "Todas, en un panel",
          texto: "El Multi núcleo conecta todas tus empresas en un solo panel.",
        },
        {
          titulo: "Seguimiento en vivo",
          texto: "Ventas, stock y estadísticas de todas, en el mismo lugar.",
        },
        {
          titulo: "Cada una, por su lado",
          texto: "Entrás a cualquiera y ves cómo está corriendo, sola.",
        },
      ],
      capitulo: "Capítulo",
      reproducir: "Reproducir el recorrido",
      pausar: "Pausar el recorrido",
      verTodas: "Todas las empresas",
      ayuda: "Tocá una empresa para entrar a su núcleo.",
      suAdministracion: "Su núcleo y su administración, por separado.",
      ultimos12: "Ventas, últimos 12 días",
      escena:
        "Escena 3D: cuatro empresas, cada una con su núcleo de color, conectadas por haces de datos a un panel central con sus estadísticas.",
    },
  },
} as const;

export const PIE = {
  etiquetaSecciones: "Secciones",
  etiquetaSeguinos: "Seguinos",
  derechos: "© 2026 Quvant",
} as const;
