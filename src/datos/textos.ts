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
} as const;

/**
 * Los canales: el sitio dividido en segmentos, cada uno con su página.
 * La portada los conecta (src/componentes/canales) y cada página termina
 * con la línea que lleva al siguiente. El orden de esta lista es el orden
 * del recorrido. Los capítulos son los bloques de cada página (el riel
 * lateral y la barra de capítulos los listan). `corto` es el nombre que
 * entra en la barra de canales del celular.
 */
export const CANALES = [
  {
    id: "trabajos",
    ruta: "/trabajos",
    nombre: "Trabajos",
    corto: "Trabajos",
    frase: "Webs, sistemas y apps que ya están andando. Entrá y recorrelos.",
    titulo: "Webs y sistemas que ya hicimos.",
    bajada: "Entrá a cualquiera y recorrela acá mismo, sin salir de la página.",
    metaTitulo: "Trabajos: webs, sistemas y apps que ya hicimos",
    capitulos: [
      { id: "portfolio", nombre: "Portfolio" },
      { id: "caso", nombre: "Un caso de cerca" },
    ],
  },
  {
    id: "servicios",
    ruta: "/servicios",
    nombre: "Servicios",
    corto: "Servicios",
    frase: "Sistemas para tu rubro, apps a medida y webs. Y cómo los hacemos.",
    titulo: "Qué hacemos y cómo lo hacemos.",
    bajada: "Tres formas de trabajar con nosotros y un solo método: primero entender, después construir.",
    metaTitulo: "Servicios: software de gestión, apps a medida y páginas web",
    capitulos: [
      { id: "que-hacemos", nombre: "Qué hacemos" },
      { id: "como-trabajamos", nombre: "Cómo trabajamos" },
    ],
  },
  {
    id: "plataformas",
    ruta: "/plataformas",
    nombre: "Sistemas",
    corto: "Sistemas",
    frase: "Un mismo sistema que se acomoda a cómo trabaja tu rubro.",
    titulo: "Un sistema que ya funciona, pensado para tu rubro.",
    bajada:
      "Quvant es el sistema de gestión de tu negocio: lo que ya anda en otros rubros, ajustado a cómo trabaja el tuyo. Cada versión lleva su nombre y la firma de la casa.",
    metaTitulo: "Sistemas de gestión por rubro: industria, gimnasios y más",
    capitulos: [
      { id: "hoy", nombre: "Lo que hace hoy" },
      { id: "rubros", nombre: "Rubros" },
    ],
  },
  {
    id: "nosotros",
    ruta: "/nosotros",
    nombre: "Nosotros",
    corto: "Nosotros",
    frase: "Dos amigos, dos fuerzas, una sola marca.",
    titulo: "Dos amigos, dos fuerzas, una sola marca.",
    bajada:
      "Quvant nace del sueño de dos amigos apasionados por el desarrollo de aplicaciones, con más de diez años de experiencia.",
    metaTitulo: "Nosotros: el equipo detrás de Quvant",
    capitulos: [
      { id: "fuerzas", nombre: "Las dos fuerzas" },
      { id: "video", nombre: "En 42 segundos" },
    ],
  },
  {
    id: "contacto",
    ruta: "/contacto",
    nombre: "Contacto",
    corto: "Contacto",
    frase: "Contanos qué necesitás y te respondemos con una propuesta.",
    titulo: "Contanos qué necesitás.",
    bajada: "Completá estos datos y el mensaje te queda armado: lo mandás por WhatsApp o por email.",
    metaTitulo: "Contacto: contanos qué necesitás",
    capitulos: [],
  },
] as const;

export type Canal = (typeof CANALES)[number];

/** Lo que acompaña a los canales en todas las páginas. */
export const NAVEGACION = {
  canal: "Canal",
  inicio: "Inicio",
  hablemos: "Hablemos",
  /** El chat, en la barra de abajo del celular. */
  chat: "Chat",
  siguiente: "Seguí por",
  anterior: "Volver a",
  capitulos: "En esta página",
  navPrincipal: "Canales del sitio",
  navCelular: "Barra de canales",
  /** La cuenta, en el encabezado: "Ingresar" sin sesión, "Mi cuenta" con sesión y "Panel" solo para admin. */
  ingresar: "Ingresar",
  miCuenta: "Mi cuenta",
  cuentaCorto: "Cuenta",
  panel: "Panel",
} as const;

export const ACCESIBILIDAD = {
  saltarAlContenido: "Saltar al contenido",
  irAlInicio: "Quvant — ir al inicio",
} as const;

export const HERO = {
  titulo: "QUVANT",
  /** La frase oficial va entera arriba (MARCA.bajada); esta es la línea humana de abajo. */
  propuesta: "Hacemos los sistemas y las webs de negocios que atienden, venden y cobran todos los días.",
  botonPrimario: { texto: "Ver trabajos", destino: "/trabajos" },
  botonSecundario: { texto: "Contanos qué necesitás", destino: "/contacto" },
} as const;

/** La portada, después del video: los canales, los trabajos destacados y el cierre. */
export const INICIO = {
  canales: {
    titulo: "Elegí por dónde seguir.",
    entrar: "Entrar",
    enVivo: "En vivo",
    pausar: "Pausar el recorrido de canales",
    seguir: "Seguir con el recorrido de canales",
  },
  destacados: {
    titulo: "Algunos que ya están andando.",
    verTodos: "Ver todos los trabajos",
  },
  cierre: {
    titulo: "¿Tenés un proyecto en mente?",
    texto: "Contanos qué necesitás y te respondemos con una propuesta concreta.",
    boton: "Escribinos",
  },
} as const;

export const CONTACTO_SECCION = {
  /** Arriba del formulario: quiénes responden (las caras salen de src/datos/fotos.ts, solo con permiso). */
  presentacion: {
    frase: "Te respondemos nosotros, no un bot.",
    detalle: "Michel y Fabrizio leen cada mensaje.",
    // TODO: fabrizio: si hay un tiempo de respuesta real ("en el día", "antes de 24 horas"), va acá. Vacío, no se muestra.
    tiempo: "",
  },
  campos: {
    nombre: { etiqueta: "Tu nombre", marcador: "¿Cómo te llamás?" },
    necesidad: {
      etiqueta: "Qué necesitás",
      /** enMensaje: cómo sigue "Les escribo porque…" en el mensaje que se arma. */
      opciones: [
        { id: "sistema", texto: "Un sistema para mi negocio", enMensaje: "busco un sistema para mi negocio" },
        { id: "app", texto: "Una app a medida", enMensaje: "quiero una app a medida" },
        { id: "web", texto: "Una web", enMensaje: "necesito una web nueva o renovada" },
      ],
    },
    mensaje: { etiqueta: "Contanos un poco", marcador: "Qué hacés, qué te está trabando, qué te gustaría resolver." },
    empresa: { etiqueta: "Empresa (opcional)", marcador: "El nombre de tu negocio" },
    rubro: { etiqueta: "Rubro (opcional)", marcador: "Ferretería, gimnasio, inmobiliaria…" },
  },
  botones: { whatsapp: "Enviar por WhatsApp", email: "Prefiero por email" },
  nota: "Se abre en tu WhatsApp o en tu email con el mensaje ya escrito; lo podés retocar antes de mandarlo. No guardamos nada.",
  directo: {
    titulo: "¿Ya sabés lo que querés?",
    filas: { whatsapp: "WhatsApp", email: "Email", instagram: "Instagram" },
  },
  asuntoEmail: "Consulta desde la web de Quvant",
} as const;

/** El canal Trabajos: la vitrina, el visor y el caso Ferremix. */
export const WEBS = {
  /** La vitrina del portfolio (datos en src/datos/portfolio.ts). */
  vitrina: {
    filtros: "Filtrar por tipo",
    todo: "Todo",
    proyectos: "proyectos",
    enVivo: "para probar en vivo",
    ayudaTactil: "Deslizá para ver más. Tocá una para entrar.",
    entrar: "Entrar",
    posicion: "Proyecto",
    de: "de",
  },
  visor: {
    etiqueta: "Visor de proyectos",
    cerrar: "Cerrar el visor",
    anterior: "Proyecto anterior",
    siguiente: "Proyecto siguiente",
    dispositivo: "Ver como",
    escritorio: "Escritorio",
    celular: "Celular",
    modo: "Mostrar",
    captura: "Captura",
    enVivo: "En vivo",
    abrir: "Abrir el sitio",
    recorrer: "Recorrer sola",
    detener: "Detener",
    paginas: "Páginas del proyecto",
    queTiene: "Qué tiene",
    sobre: "Sobre el proyecto",
    cargando: "Cargando el sitio en vivo…",
    notaCaptura: "Captura de la página completa: bajá para recorrerla. Para usarla, abrila en una pestaña nueva.",
    notaEnVivo: "Es el sitio de verdad, funcionando acá adentro.",
    teclas: "Flechas ← → para cambiar · Esc para cerrar",
  },
  etiquetaCaso: "Un caso de cerca",
  etiquetaAntes: "Antes",
  etiquetaDespues: "Después",
  ayudaDeslizador: "Comparar la web actual con la propuesta (arrastrá o usá las flechas)",
  etiquetaCelular: "La propuesta en el celular",
  notaCelular: "Con el scroll, el teléfono gira: de la web actual a la propuesta.",
  etiquetaDemo: "La demo, paso a paso",
  etiquetaQueCambio: "Qué cambió",
  /** El caso como historia (web más humana, paso 7). */
  historia: { quienes: "Quiénes son", vimos: "Lo que vimos", propusimos: "Lo que propusimos" },
  testimonios: "Lo que dicen de trabajar con nosotros",
} as const;

/** El canal Plataformas (título y bajada en CANALES). */
export const PLATAFORMAS = {
  /** Para los datos estructurados: qué es Quvant como producto. */
  descripcion:
    "Quvant es el sistema de gestión de tu negocio: un mismo sistema que se acomoda a cómo trabaja tu rubro.",
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
      pausar: "Pausar el recorrido automático",
      seguir: "Seguir con el recorrido automático",
    },
    destacadas: [
      {
        id: "margen",
        titulo: "El margen, antes de tocar un precio",
        texto: "Antes de subir los precios, ves cuánto vas a ganar. Sin sorpresas a fin de mes.",
      },
      {
        id: "offline",
        titulo: "Sin internet, se sigue vendiendo",
        texto: "Si se corta internet, el mostrador sigue vendiendo.",
      },
      {
        id: "tablero",
        titulo: "Cada uno ve lo suyo",
        texto: "El cajero ve la caja; el dueño ve todo desde el celular, con lo que hay que atender hoy.",
      },
      {
        id: "stock",
        titulo: "El stock, sucursal por sucursal",
        texto: "Contás el stock con la cámara del celular y sabés qué hay en cada sucursal.",
      },
      {
        id: "compras",
        titulo: "Compras que se sugieren solas",
        texto: "Cuando algo llega al mínimo, el sistema te arma la compra. Vos la confirmás.",
      },
    ],
    resto: [
      "Presupuestos que pasan a venta en un clic",
      "Cuentas corrientes con tope para fiar",
      "Servicio técnico: cada reparación con su estado",
      "La hoja de ruta del reparto",
      "Reportes que bajás a Excel",
      "La lista del proveedor se carga desde el Excel",
      "Cada persona entra solo a lo suyo; el dueño, con una clave extra",
    ],
  },
  rubros: {
    etiqueta: "Rubros",
    notaVacio: "Estamos entrando en este rubro. Si es el tuyo, hablemos.",
    /** El botón de cada rubro que lleva al registro con ese rubro ya elegido. */
    registrarme: "Registrarme",
    registrarmeNota: "Creá tu cuenta y te mostramos cómo funciona para tu rubro.",
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
            rol: "Para empresas industriales: el stock de cada sucursal, las compras y las ventas en un solo lugar.",
          },
          {
            nombre: "Forja",
            firma: "by Quvant",
            rol: "Ves tu depósito y tus sucursales en 3D: qué falta y dónde está.",
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
            rol: "La administración del gimnasio: lo que ya anda en otros rubros, pensado para el tuyo.",
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
      "Recorrido por Forja: la fragua de la intro, la red con todas las sucursales, la entrada a Casa Central en 3D, los racks con lo que falta, la lista de productos críticos y la sala de control.",
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
  etiqueta: "Cómo trabajamos",
  titulo: "Vos soñás en grande. Nosotros lo bajamos a tierra.",
  bajada: "Primero entender tu negocio, después construir. En ese orden.",
  ayuda: "Bajá despacio: el recorrido avanza con el scroll.",
  etapas: [
    {
      id: "escuchar",
      nombre: "Escuchar",
      titular: "Primero escuchamos.",
      texto:
        "Antes de proponer nada, entendemos cómo trabajás hoy: qué te traba y qué hacés a mano. Llegamos con preguntas, no con un sistema armado de antemano.",
      marca: "Nada armado de antemano.",
    },
    {
      id: "sonar",
      nombre: "Soñar en grande",
      titular: "Queremos que sueñes en grande.",
      texto: "Contanos la idea completa, sin recortarla. La versión ambiciosa es la que nos interesa.",
      marca: "La idea entera, sin recortes.",
    },
    {
      id: "bajar",
      nombre: "Bajar a tierra",
      titular: "Nosotros la bajamos a tierra.",
      texto: "La convertimos en pasos concretos: qué va primero, qué puede esperar y cuánto lleva cada parte.",
      marca: "Un plan que se empieza el lunes.",
    },
    {
      id: "construir",
      nombre: "Construir y acompañar",
      titular: "Lo construimos por fases.",
      texto: "Cada fase se prueba con vos adentro. Y cuando el sistema está andando, seguimos cerca.",
      marca: "Cada fase se prueba antes de seguir.",
    },
  ],
} as const;

export const NOSOTROS = {
  fuerzas: {
    desarrollo: {
      etiqueta: "Fuerza de desarrollo",
      titular: "Más de 10 años construyendo software.",
      // TODO: que la revise Michel (es una propuesta con lo ya aprobado, sin inventar datos).
      parrafos: [
        "Soy Michel. Programo hace más de diez años: sistemas y sitios web para startups y empresas de primer nivel, simples de usar desde el primer día. Trabajo con las tecnologías más nuevas y con inteligencia artificial para construir más rápido y con más precisión.",
      ],
      puntos: ["Sistemas y sitios web", "Tecnologías nuevas", "IA para construir mejor"],
      dato: { numero: 10, prefijo: "+", etiqueta: "años construyendo software" },
      ventana: "quvant · construir.ts",
    },
    comercial: {
      etiqueta: "Fuerza comercial",
      titular: "Entendemos tu negocio antes de escribir una línea de código.",
      // TODO: que la revise Fabrizio (es una propuesta con lo ya aprobado, sin inventar datos).
      parrafos: [
        "Soy Fabrizio. Me ocupo de conocer tu negocio y a la gente que lo mueve: el que atiende, el que cobra, el que cuenta el stock. Lo que necesitás se vuelve un pedido claro para desarrollo, y te acompaño hasta que el sistema anda en tu empresa. Y después también.",
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
      cargo: "Co-founder · Developer principal",
      bajada: "El encargado de darle vida y forma a todas las ideas.",
      titulo: "", // TODO: título o formación de Michel.
      linkedin: "", // TODO: URL del perfil de LinkedIn de Michel.
      // La foto sale del registro src/datos/fotos.ts (id nosotros-michel).
    },
    {
      nombre: "Fabrizio",
      iniciales: "F",
      rol: "Fuerza comercial",
      cargo: "Co-founder · Área comercial",
      bajada:
        "Entiende el negocio de cada cliente y busca cómo simplificar el trabajo adentro de las empresas.",
      titulo: "", // TODO: título o formación de Fabrizio.
      linkedin: "", // TODO: URL del perfil de LinkedIn de Fabrizio.
      // La foto sale del registro src/datos/fotos.ts (id nosotros-fabrizio).
    },
  ],
  /** No se muestra en la web (repetía lo que dicen todas las páginas): la usa el chat. */
  mision: {
    etiqueta: "Misión",
    texto: "Entrar en cada rubro, entender cómo trabaja y construir el sistema que todavía no tiene.",
  },
  /** El spot de 42 s (video/ en este repo), con play a pedido y sonido. */
  spot: {
    ventana: "Quvant en 42 segundos",
    nota: "Con sonido",
    reproducir: "Ver el video",
    duracion: "0:42",
    descripcion:
      "Video de Quvant: la intro de la tele, los problemas que ordenamos, nuestros trabajos reales (Grimm Travel, Yunque, Forja, HackFit, Firmamento y Gene Keys), cómo trabajamos y la firma de la marca.",
  },
  servicios: {
    etiqueta: "Nuestros servicios",
    ayuda: "Elegí uno y mirá cómo lo armamos.",
    verComo: "Ver cómo lo armamos",
    items: [
      {
        id: "sistemas",
        nombre: "Sistemas listos para tu rubro",
        texto:
          "La gestión de tu negocio ya armada para tu rubro. Se paga por mes y se usa desde el primer día.",
        ventana: "Varias empresas, un solo panel",
        pie: "Cada empresa con su sistema, y vos con un solo panel para seguirlas a todas.",
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
      panel: "Panel de todas tus empresas",
      datosEjemplo: "Datos de ejemplo",
      resumen: "4 empresas · 4 sistemas · 1 panel",
      capitulos: [
        {
          titulo: "Cada empresa, su sistema",
          texto: "Cada una tiene su propio sistema y su administración, independientes.",
        },
        {
          titulo: "Todas, en un panel",
          texto: "Un panel junta todas tus empresas en un solo lugar.",
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
      ayuda: "Tocá una empresa para entrar a su sistema.",
      suAdministracion: "Su sistema y su administración, por separado.",
      ultimos12: "Ventas, últimos 12 días",
      escena:
        "Escena 3D: cuatro empresas, cada una con su sistema de color, conectadas por haces de datos a un panel central con sus estadísticas.",
    },
  },
} as const;

/**
 * El chat "Hablemos ahora" (abajo a la derecha en todo el sitio). Responde
 * el asistente de Quvant y, si alguien del equipo toma la charla desde el
 * panel, esa persona. Nunca dice "en vivo" si responde un bot.
 */
export const CHAT = {
  lanzador: "Hablemos ahora",
  abrir: "Abrir el chat con Quvant",
  cerrar: "Cerrar el chat",
  invitacion: {
    titulo: "¿Qué querés armar?",
    texto: "Contanos y te ayudamos ahora mismo.",
    cerrar: "Cerrar la invitación",
  },
  titulo: "Quvant",
  estados: {
    bot: "Asistente · responde al instante",
    "espera-humano": "Ya avisamos al equipo",
    humano: "Te está escribiendo {nombre}",
    cerrada: "Charla terminada",
  },
  bienvenida:
    "Hola, soy el asistente de Quvant. Te cuento lo que hacemos o te ayudo a armar tu pedido. ¿Qué te trae por acá?",
  sugerencias: [
    "Quiero un sistema para mi rubro",
    "Necesito una app a medida",
    "Quiero una web nueva o renovada",
    "¿Qué es Quvant?",
    "Hablar con una persona",
  ],
  marcador: "Escribí tu mensaje…",
  enviar: "Enviar",
  escribiendo: "El asistente está escribiendo",
  privacidad: "Guardamos esta charla para poder responderte. No la compartimos con nadie.",
  error: "No se pudo enviar. Probá de nuevo.",
  equipo: "Equipo de Quvant",
  sinLeer: "mensajes nuevos",
  pedido: {
    titulo: "Tu pedido",
    nombre: "Nombre",
    necesita: "Necesitás",
    contacto: "Te contactamos por",
  },
  necesidades: {
    sistema: "Un sistema para tu rubro",
    app: "Una app a medida",
    web: "Una web nueva o renovada",
    otro: "Otra cosa",
  },
  abrirDesdeContacto: "Hablar ahora por el chat",
} as const;

/** El panel de mensajes del equipo (/panel). */
export const PANEL = {
  titulo: "Panel de mensajes",
  bandeja: "Bandeja",
  filtros: {
    todas: "Todas",
    nuevas: "Sin leer",
    pedidos: "Con pedido",
    esperan: "Esperan persona",
    cerradas: "Cerradas",
  },
  vacio: "Todavía no hay conversaciones. Cuando alguien escriba en el chat de la web, aparece acá.",
  elegi: "Elegí una conversación de la bandeja.",
  visitante: "Visitante",
  estados: {
    bot: "Asistente",
    "espera-humano": "Espera persona",
    humano: "Atiende {nombre}",
    cerrada: "Cerrada",
  },
  acciones: {
    tomar: "Tomar la charla",
    devolver: "Devolver al asistente",
    cerrar: "Cerrar",
    reabrir: "Reabrir",
    whatsapp: "WhatsApp",
    email: "Email",
    volver: "Bandeja",
  },
  responder: "Escribile al visitante…",
  enviar: "Enviar",
  notaTomar: "Al responder, la charla pasa a ser tuya y el asistente deja de contestar.",
  desde: "Escribió desde",
  pedido: "Pedido",
  avisos: {
    memoria: "Las conversaciones se guardan en memoria y se pierden al reiniciar: conectá Upstash Redis en Vercel.",
    archivo: "Modo prueba: las conversaciones se guardan en .datos/chat.json de esta computadora.",
    sinIA: "Sin clave de Anthropic: el chat responde en modo guiado (preguntas fijas). Cargá ANTHROPIC_API_KEY para que responda Claude.",
    sinWhatsApp: "Los avisos por WhatsApp están apagados: configurá CallMeBot o WhatsApp Business (ver .env.example).",
  },
  autores: { visitante: "Visitante", bot: "Asistente", humano: "Equipo", sistema: "Aviso" },
} as const;

export const PIE = {
  etiquetaSecciones: "Canales",
  etiquetaSeguinos: "Seguinos",
  derechos: "© 2026 Quvant",
  privacidad: "Privacidad",
} as const;

/**
 * Registro, ingreso y cuenta de las personas que se registran.
 *
 * Los rubros y los objetivos tienen que coincidir con las tablas nichos y
 * objetivos de la base (supabase/migrations): si se suma uno allá, se suma
 * acá. "{x}" se reemplaza en el componente.
 */
export const CUENTA = {
  etiqueta: "Tu cuenta",
  /** Los rubros que se eligen al registrarse (tarjetas grandes, para el dedo). */
  nichos: [
    { id: "industria", nombre: "Industria", detalle: "Fábricas, depósitos y ferreterías industriales." },
    { id: "gimnasios", nombre: "Gimnasios y fitness", detalle: "Gimnasios, boxes, estudios y entrenadores." },
    { id: "holistica", nombre: "Holística", detalle: "Terapias, bienestar, yoga y meditación." },
    { id: "pymes", nombre: "Pymes", detalle: "Comercios y empresas de servicios." },
    { id: "inmobiliarias", nombre: "Inmobiliarias", detalle: "Alquileres, ventas y administración." },
    { id: "supermercados", nombre: "Supermercados", detalle: "Autoservicios, almacenes y cadenas." },
    { id: "otro", nombre: "Otro rubro", detalle: "Contanos cuál y lo vemos juntos." },
  ],
  /** Con las palabras de fabrizio. */
  objetivos: [
    { id: "mejorar_clientela", texto: "Quiero mejorar mi clientela" },
    { id: "hacer_web", texto: "Quiero hacer mi página web" },
    { id: "curiosidad", texto: "Curiosidad, pero me interesa lo que ofrecen" },
  ],
  campos: {
    nombre: { etiqueta: "Nombre", marcador: "¿Cómo te llamás?" },
    apellido: { etiqueta: "Apellido (opcional)", marcador: "Tu apellido" },
    email: { etiqueta: "Email", marcador: "tu@email.com" },
    contrasena: { etiqueta: "Contraseña", ayuda: "Al menos 8 caracteres." },
    mostrar: "Mostrar",
    ocultar: "Ocultar",
    nicho: "¿De qué rubro es tu negocio?",
    nichoOtro: { etiqueta: "¿Cuál?", marcador: "Contanos tu rubro" },
    objetivo: "¿Qué te trajo a Quvant?",
    empresa: { etiqueta: "Empresa (opcional)", marcador: "El nombre de tu negocio" },
    ciudad: { etiqueta: "Ciudad (opcional)", marcador: "CABA, Rosario, Córdoba…" },
    telefono: { etiqueta: "Teléfono (opcional)", marcador: "Por si preferís que te llamemos" },
    novedades: "Quiero recibir novedades de Quvant por email.",
    privacidad: { antes: "Leí y acepto la ", enlace: "política de privacidad", despues: "." },
  },
  registro: {
    metaTitulo: "Creá tu cuenta",
    titulo: "Creá tu cuenta.",
    bajada: "Contanos de qué es tu negocio y qué buscás, y te mostramos lo que Quvant puede hacer por tu rubro.",
    boton: "Crear mi cuenta",
    enviando: "Creando tu cuenta…",
    yaTenes: "¿Ya tenés cuenta?",
    ingresar: "Ingresá",
    listo: {
      titulo: "Revisá tu email.",
      texto: "Te mandamos un enlace a {email} para confirmar tu cuenta. Tocalo y entrás directo.",
      nota: "¿No llegó? Fijate en spam o en promociones. El enlace vence en una hora.",
      yaTenia: "¿Ya tenías cuenta con ese email? Entonces no te llega nada nuevo: ingresá o recuperá tu contraseña.",
      reenviar: "Mandármelo de nuevo",
      reenviado: "Listo, te lo mandamos de nuevo.",
    },
  },
  ingreso: {
    metaTitulo: "Ingresá a tu cuenta",
    titulo: "Ingresá a tu cuenta.",
    bajada: "Con el email y la contraseña con los que te registraste.",
    boton: "Ingresar",
    enviando: "Ingresando…",
    olvide: "Olvidé mi contraseña",
    sinCuenta: "¿Todavía no tenés cuenta?",
    registrate: "Registrate",
    reenviar: "Mandarme el enlace de confirmación",
  },
  recuperar: {
    metaTitulo: "Recuperá tu contraseña",
    titulo: "¿Olvidaste tu contraseña?",
    bajada: "Dejanos tu email y te mandamos un enlace para elegir una nueva.",
    boton: "Mandarme el enlace",
    enviando: "Mandando…",
    listo: "Si hay una cuenta con ese email, en unos minutos te llega el enlace. Fijate también en spam.",
    volver: "Volver a ingresar",
  },
  cuenta: {
    metaTitulo: "Tu cuenta",
    hola: "Hola, {nombre}.",
    bajada: "Acá ves y cambiás tus datos.",
    cargando: "Cargando tu cuenta…",
    avisos: {
      bienvenida: "Listo: tu email quedó confirmado. Te damos la bienvenida a Quvant.",
      nuevaContrasena: "Entraste con el enlace para recuperar la contraseña: elegí una nueva acá abajo.",
    },
    /** Lo útil según el objetivo que eligió al registrarse. */
    sugerencias: {
      mejorar_clientela: {
        titulo: "Mirá el sistema para tu rubro",
        texto: "El sistema de {rubro}: lo que ya hace hoy y lo que viene.",
        boton: "Ver el sistema",
      },
      hacer_web: {
        titulo: "Escribinos para tu web",
        texto: "Contanos qué tenés en mente y te respondemos con una propuesta concreta.",
        boton: "Hablemos",
      },
      curiosidad: {
        titulo: "Mirá lo que ya hicimos",
        texto: "Webs, sistemas y apps que ya están andando. Entrá a cualquiera y recorrela.",
        boton: "Ver trabajos",
      },
    },
    datos: {
      titulo: "Tus datos",
      email: "Email",
      emailNota: "Es el email con el que entrás. Para cambiarlo, escribinos.",
      guardar: "Guardar cambios",
      guardando: "Guardando…",
      guardado: "Listo, quedó guardado.",
    },
    contrasena: {
      titulo: "Contraseña",
      nueva: "Contraseña nueva",
      repetir: "Repetila",
      boton: "Cambiar la contraseña",
      cambiando: "Cambiando…",
      cambiada: "Listo, tu contraseña cambió.",
    },
    panel: "Ir al panel",
    salir: "Cerrar sesión",
  },
  errores: {
    nombre: "Contanos tu nombre.",
    email: "Revisá el email: parece que le falta algo.",
    contrasena: "La contraseña tiene que tener al menos 8 caracteres.",
    contrasenaLarga: "La contraseña es demasiado larga (como mucho 72 caracteres).",
    noCoinciden: "Las dos contraseñas no coinciden.",
    nicho: "Elegí el rubro de tu negocio.",
    nichoOtro: "Contanos de qué rubro es.",
    objetivo: "Elegí qué te trajo a Quvant.",
    privacidad: "Para crear la cuenta tenés que aceptar la política de privacidad.",
    largo: "Ese dato es demasiado largo.",
    credenciales: "El email o la contraseña no coinciden.",
    sinConfirmar: "Todavía no confirmaste tu email. Si no te llegó el enlace, te lo mandamos de nuevo.",
    contrasenaDebil: "Esa contraseña es fácil de adivinar. Probá con otra más larga o con números y símbolos.",
    contrasenaIgual: "La contraseña nueva tiene que ser distinta de la anterior.",
    demasiados: "Hubo muchos intentos seguidos. Esperá unos minutos y probá de nuevo.",
    emailNoAutorizado:
      "Todavía no podemos mandar emails a esa dirección: estamos terminando de configurar el envío. Probá en unos días o escribinos.",
    enlace: "El enlace venció o ya se usó. Pedí uno nuevo.",
    sesion: "Tu sesión venció. Ingresá de nuevo.",
    sinConfigurar: "El registro todavía no está disponible. Probá en unos días.",
    general: "Algo salió mal de nuestro lado. Probá de nuevo en un rato.",
    revisa: "Revisá los datos marcados.",
  },
} as const;

/**
 * Política de privacidad (Ley 25.326 de Protección de Datos Personales).
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  TODO: revisar con un abogado antes de difundir.        │
 * │  Es un texto base: no reemplaza asesoramiento legal.    │
 * └─────────────────────────────────────────────────────────┘
 */
export const PRIVACIDAD = {
  metaTitulo: "Política de privacidad",
  titulo: "Política de privacidad.",
  actualizada: "Última actualización: octubre de 2026.",
  borrador: "Texto base, pendiente de revisión legal.",
  secciones: [
    {
      titulo: "Quién es responsable",
      parrafos: [
        "Quvant es responsable de los datos personales que dejás en este sitio. Podés escribirnos por los medios de contacto que figuran al final de esta página.",
      ],
    },
    {
      titulo: "Qué datos guardamos",
      parrafos: [
        "Si creás una cuenta: tu nombre y apellido, tu email, el rubro de tu negocio, qué te trajo a Quvant y, si los cargás, tu empresa, tu ciudad y tu teléfono. Tu contraseña se guarda cifrada: nadie de Quvant la puede ver.",
        "Si usás el chat de la web: lo que escribís en la conversación.",
        "Para medir qué secciones interesan, la web anota visitas y clics con un identificador anónimo propio, sin cookies de terceros y sin tu nombre ni tu email. Si tu navegador pide no ser rastreado (Do Not Track o Global Privacy Control), no anotamos nada.",
      ],
    },
    {
      titulo: "Para qué los usamos",
      parrafos: [
        "Para darte acceso a tu cuenta, responderte, mostrarte lo que Quvant puede hacer por tu rubro y, solo si lo aceptaste, mandarte novedades por email. No vendemos ni cedemos tus datos a nadie.",
      ],
    },
    {
      titulo: "Dónde se guardan",
      parrafos: [
        "Usamos proveedores de infraestructura que pueden tener sus servidores fuera de la Argentina: Supabase (base de datos y cuentas), Vercel (el sitio) y Resend (el envío de emails). Al crear tu cuenta prestás tu consentimiento para que tus datos se guarden en esos servidores, con medidas de seguridad razonables.",
      ],
    },
    {
      titulo: "Tus derechos",
      parrafos: [
        "Podés pedirnos en cualquier momento ver, corregir, actualizar o borrar tus datos, y dejar de recibir novedades. Muchos datos los podés cambiar vos mismo desde tu cuenta; para lo demás, escribinos.",
        "El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley Nº 25.326.",
        "La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley Nº 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.",
      ],
    },
    {
      titulo: "Cambios",
      parrafos: [
        "Si cambiamos esta política, lo vas a ver en esta página con la fecha nueva. Si el cambio es importante, te avisamos por email.",
      ],
    },
  ],
  contacto: "Contacto",
} as const;

/**
 * Los emails (plantillas en src/emails). Confirmación y recuperación los
 * manda Supabase con nuestra plantilla; bienvenida y aviso interno, la web
 * con Resend. "{x}" se reemplaza al armar cada email.
 */
export const EMAILS = {
  pie: {
    bajada: "Software a la vanguardia de cada nicho.",
    porque: "Recibís este email porque creaste una cuenta en Quvant.",
  },
  confirmacion: {
    asunto: "Confirmá tu email para entrar a Quvant",
    vistaPrevia: "Un toque y tu cuenta queda lista.",
    titulo: "Confirmá tu email.",
    texto: "Gracias por registrarte en Quvant. Tocá el botón para confirmar tu email y entrar a tu cuenta.",
    boton: "Confirmar mi email",
    vence: "El enlace vence en una hora. Si no creaste una cuenta en Quvant, ignorá este email.",
  },
  recuperacion: {
    asunto: "Elegí tu contraseña nueva de Quvant",
    vistaPrevia: "El enlace para cambiar tu contraseña.",
    titulo: "Elegí tu contraseña nueva.",
    texto: "Pediste cambiar la contraseña de tu cuenta de Quvant. Tocá el botón y elegí una nueva.",
    boton: "Elegir contraseña nueva",
    vence: "El enlace vence en una hora. Si no lo pediste, ignorá este email: tu contraseña sigue igual.",
  },
  bienvenida: {
    asunto: "Te damos la bienvenida a Quvant",
    vistaPrevia: "Tu cuenta ya está lista.",
    titulo: "Hola, {nombre}.",
    texto: "Tu cuenta ya está lista. Gracias por contarnos de tu negocio: así te mostramos lo que sirve para tu rubro.",
    /** Qué hace Quvant por cada rubro, en dos líneas. Honesto: lo que existe hoy y lo que está en camino. */
    rubros: {
      industria:
        "Para la industria, Quvant ordena el stock de cada sucursal, las compras y las ventas en un solo sistema. Y el dueño ve todo desde el celular.",
      gimnasios:
        "Para gimnasios, Quvant suma la administración del gimnasio sobre un sistema que ya funciona, y una app para que tus socios tengan rutinas y dietas personalizadas.",
      holistica:
        "Estamos armando el sistema para centros y profesionales del bienestar. Te avisamos apenas esté listo; mientras tanto, contanos qué necesitás.",
      pymes:
        "Para pymes estamos diseñando la gestión completa, del presupuesto al reporte, sobre un sistema que ya funciona en otros rubros.",
      inmobiliarias:
        "Para inmobiliarias estamos diseñando la cartera de propiedades, los contratos y las cobranzas en un solo lugar, sobre un sistema que ya funciona.",
      supermercados:
        "Para supermercados estamos diseñando la venta rápida en muchas cajas, el stock y las sucursales, sobre un sistema que ya funciona.",
      otro: "Quvant tiene un sistema que ya funciona (ventas, stock, compras y reportes) y lo adaptamos a cada rubro. Contanos el tuyo y vemos cómo encaja.",
    },
    /** Un único botón, según lo que la trajo a Quvant. */
    botones: {
      mejorar_clientela: "Ver el sistema para tu rubro",
      hacer_web: "Pedir mi web",
      curiosidad: "Hablar con nosotros",
    },
    cierre: "Cualquier duda, escribinos por WhatsApp: te responde una persona del equipo.",
    firma: "El equipo de Quvant",
  },
  avisoInterno: {
    asunto: "Nuevo registro: {nombre} · {rubro}",
    vistaPrevia: "Alguien confirmó su cuenta en la web.",
    titulo: "Nuevo registro confirmado.",
    campos: {
      nombre: "Nombre",
      email: "Email",
      rubro: "Rubro",
      objetivo: "Objetivo",
      empresa: "Empresa",
      ciudad: "Ciudad",
      novedades: "Novedades",
      origen: "Vino desde",
    },
    si: "Sí",
    no: "No",
    sinDato: "—",
    boton: "Ver en el panel",
  },
  /** Para el enlace de respaldo cuando el botón no anda. */
  respaldo: "¿El botón no anda? Copiá este enlace en tu navegador:",
} as const;

/**
 * El panel interno (solo admin): resumen de registros, rendimiento de las
 * plantillas por rubro y la bandeja del chat. "{x}" se reemplaza en el
 * componente.
 */
export const PANEL_ADMIN = {
  titulo: "Panel",
  secciones: [
    { ruta: "/panel", nombre: "Resumen" },
    { ruta: "/panel/plantillas", nombre: "Plantillas" },
    { ruta: "/panel/nucleos", nombre: "Núcleos" },
    { ruta: "/panel/mapa", nombre: "Mapa" },
    { ruta: "/panel/mensajes", nombre: "Bandeja" },
  ],
  miCuenta: "Mi cuenta",
  verWeb: "Ver la web",
  salir: "Salir",
  cargando: "Cargando…",
  /** Los objetivos, cortos, para gráficos y tablas. */
  objetivosCortos: {
    mejorar_clientela: "Mejorar su clientela",
    hacer_web: "Hacer su web",
    curiosidad: "Curiosidad",
  },
  sinRubro: "Sin rubro",
  resumen: {
    titulo: "Resumen",
    bajada: "Cuántos entran, quiénes se registran, de qué rubro son y qué buscan. No cuenta las cuentas de admin.",
    visitas: {
      titulo: "Entraron y se registraron",
      nota: "Personas distintas que entraron a la web (cada navegador cuenta una vez) y qué parte creó su cuenta. No cuenta robots ni a quien pidió no ser medido, así que es un piso: entraron al menos estas.",
      tiles: { hoy: "Entraron hoy", semana: "Esta semana", mes: "Este mes" },
      registraron: "{n} se registraron · {p}",
      registro: "1 se registró · {p}",
      desde: "Contando desde el {fecha}",
      sinMedir: "Todavía no hay visitas medidas. Se empiezan a contar apenas entre la primera persona con el cambio publicado.",
      sinMigracion: "Falta aplicar en la base la medición de visitas (migraciones 20261022…). Ver docs/publicar.md.",
    },
    tiles: {
      hoy: "Registros de hoy",
      semana: "Esta semana",
      mes: "Este mes",
      confirmacion: "Confirmaron el email",
      deTotal: "{n} de {total}",
    },
    porNicho: "Personas por rubro",
    porObjetivo: "Personas por objetivo",
    cruce: "Rubro × objetivo",
    cruceNota: "Cada celda: cuántas personas de ese rubro buscan eso. Cuanto más clara, más personas.",
    total: "Total",
    personas: "personas",
    ultimos: "Últimos registrados",
    filtros: {
      titulo: "Filtrar",
      nicho: "Rubro",
      objetivo: "Objetivo",
      ciudad: "Ciudad",
      desde: "Desde",
      hasta: "Hasta",
      novedades: "Novedades",
      todos: "Todos",
      si: "Sí",
      no: "No",
      aplicar: "Filtrar",
      limpiar: "Limpiar",
    },
    exportar: "Exportar CSV",
    exportarNota: "Exporta todas las filas del filtro, no solo las que se ven.",
    columnas: {
      fecha: "Alta",
      nombre: "Nombre",
      email: "Email",
      nicho: "Rubro",
      objetivo: "Objetivo",
      empresa: "Empresa",
      ciudad: "Ciudad",
      telefono: "Teléfono",
      novedades: "Novedades",
      confirmado: "Confirmó",
      origen: "Vino desde",
    },
    vacio: "No hay registros con estos filtros.",
    mostrando: "Mostrando {n} de {total}.",
    sinDatos: "Todavía no se registró nadie. Cuando alguien cree su cuenta, aparece acá.",
  },
  plantillas: {
    titulo: "Rendimiento de plantillas",
    bajada:
      "Qué rubro mira la gente, cuál convierte en registros y cuál vende de verdad. Las visitas y los clics se miden en la web sin cookies de terceros; los clientes se cargan a mano abajo.",
    rango: "Período",
    rangos: { "7": "7 días", "30": "30 días", "90": "90 días" },
    ordenar: "Ordenar por",
    aplicar: "Ver",
    metricas: {
      vistas: "Visitas al rubro",
      clics_demo: "Clics en la demo",
      clics_contacto: "Clics en Hablemos",
      inicios_registro: "Empezaron el registro",
      registros: "Registros",
      conversion: "Conversión",
      activos: "Clientes activos",
      abono: "Abono mensual",
    },
    conversionNota: "Registros sobre visitas al rubro.",
    destacados: {
      ingresos: "Más ingresos",
      interes: "Más interés",
      conversion: "Mejor conversión",
      menosInteres: "Menos interés",
      sinDatos: "Sin datos todavía",
    },
    clientesPorEstado: "Clientes",
    estadosCliente: {
      demo_mostrada: "Demo mostrada",
      en_prueba: "En prueba",
      activo: "Activo",
      baja: "Baja",
    },
    estadosRubro: { disponible: "Disponible", "en-diseno": "En diseño", proximamente: "Próximamente", otro: "Sin plantilla" },
    comparacion: "Comparación entre rubros",
    sinRubroNota: "Clics en «Hablemos» del encabezado, que no son de ningún rubro.",
    sinEventos:
      "Todavía no hay visitas medidas en este período. La medición arranca cuando esta versión de la web esté publicada.",
  },
  clientes: {
    titulo: "Clientes por plantilla",
    bajada: "Lo que vende de verdad: cargá cada empresa a la que le mostraron una plantilla y cómo sigue.",
    campos: {
      empresa: "Empresa",
      nicho: "Plantilla (rubro)",
      estado: "Estado",
      abono: "Abono mensual (opcional, en pesos)",
      fecha: "Fecha",
      notas: "Notas (opcional)",
    },
    agregar: "Agregar cliente",
    agregando: "Agregando…",
    agregado: "Listo, quedó cargado.",
    cambiarEstado: "Cambiar estado",
    borrar: "Borrar",
    confirmarBorrar: "¿Borrar {empresa}? No se puede deshacer.",
    vacio: "Todavía no hay clientes cargados.",
    errores: {
      empresa: "Escribí el nombre de la empresa.",
      nicho: "Elegí el rubro de la plantilla.",
      estado: "Elegí el estado.",
      abono: "El abono tiene que ser un número (sin puntos de miles).",
      fecha: "Revisá la fecha.",
      general: "No se pudo guardar. Probá de nuevo.",
    },
  },
  bandeja: {
    sinSesion: "Tu sesión venció.",
    ingresar: "Ingresar de nuevo",
  },
  /** 6.3 El mapa de prospección: los locales visitados, cómo nos fue y a cuáles volver. */
  mapa: {
    titulo: "Mapa de prospección",
    bajada: "Los locales que visitamos y cómo nos fue en cada uno. Cargá la visita en la puerta del local, desde el celular.",
    sinMapa: "El mapa no pudo cargar (hace falta conexión y un navegador con WebGL). La lista, las fichas y la carga de visitas funcionan igual.",
    contadores: {
      locales: "Locales cargados",
      visitados: "Visitados",
      interesados: "Interesados",
      clientes: "Clientes",
      descartados: "Descartados",
      visitasMes: "Visitas del mes",
      sinVisitas: "Nadie salió todavía",
    },
    estados: { por_visitar: "Por visitar", visitado: "Visitado", interesado: "Interesado", cliente: "Cliente", descartado: "Descartado" },
    feedback: { bueno: "Bueno", regular: "Regular", malo: "Malo" },
    volver: { si: "Sí", mas_adelante: "Más adelante", no: "No" },
    sinVisitas: "Sin visitas",
    leyenda: { titulo: "Cómo leer los puntos", sinVisitar: "Sin visitar", volver: "Hay que volver", cliente: "Cliente", descartado: "Descartado" },
    filtros: {
      titulo: "Filtrar",
      nicho: "Rubro",
      estado: "Estado",
      feedback: "Último feedback",
      volver: "Volver",
      visitante: "Quién lo visitó",
      sinVisitar: "Sin visitar hace más de (días)",
      semana: "Próximas visitas de esta semana",
      todos: "Todos",
      aplicar: "Filtrar",
      limpiar: "Limpiar",
    },
    lista: {
      titulo: "Locales",
      ordenar: "Ordenar por",
      orden: { visitas: "Cantidad de visitas", ultima: "Última visita", proxima: "Próxima visita", nombre: "Nombre" },
      vacio: "No hay locales con estos filtros.",
      sinUbicar: "Sin ubicar",
      ubicando: "Ubicándolo…",
      mostrando: "{n} locales · {ubicados} en el mapa",
      abrir: "Ver el local",
    },
    ficha: {
      visitas: "Visitas",
      ultimoFeedback: "Último feedback",
      volver: "Volver",
      proxima: "Próxima visita",
      cargarVisita: "Cargar visita",
      comoLlegar: "Cómo llegar",
      verEnGoogle: "Ver en Google Maps",
      llamar: "Llamar",
      atendio: "Atendió {nombre}",
      mostramos: "Mostramos: {que}",
      ubicandoImportado: "Importado de una planilla: lo estamos ubicando. Si no aparece, tocá «Ubicarlo donde estoy» parado en la puerta.",
      cerrar: "Cerrar",
      historial: "Historial",
      sinHistorial: "Todavía no tiene visitas.",
      estado: "Estado",
      guardar: "Guardar",
      borrar: "Borrar este local",
      confirmarBorrar: "¿Borrar {nombre} con todas sus visitas? No se puede deshacer.",
      ubicarAca: "Ubicarlo donde estoy",
      importado: "Importado",
      prueba: "Prueba",
      sinCoordenadas: "Sin ubicación en el mapa: tocá «Ubicarlo donde estoy» parado en la puerta del local.",
      fue: "Fue {nombre}",
    },
    visita: {
      titulo: "Cargar visita",
      fecha: "Fecha",
      quien: "Quién fue",
      feedback: "¿Cómo nos fue?",
      volver: "¿Volver?",
      nota: "Nota (opcional)",
      mostrado: "Qué le mostramos (opcional)",
      mostradoOpciones: ["La plantilla de su rubro", "Una página web", "Un sistema a medida", "Trabajos que hicimos"],
      siguiente: "Siguiente paso (opcional)",
      proxima: "Próxima visita (opcional)",
      guardar: "Guardar visita",
      guardando: "Guardando…",
      guardada: "Listo, visita cargada.",
      errores: {
        fecha: "Revisá la fecha.",
        quien: "Elegí quién fue.",
        feedback: "Elegí cómo nos fue.",
        proxima: "Revisá la fecha de la próxima visita.",
        general: "No se pudo guardar. Probá de nuevo.",
      },
    },
    local: {
      titulo: "Agregar un local",
      bajada:
        "Pegá el link de Google Maps del local (en el celular: Compartir → Copiar), buscá la dirección, o cargalo parado en la puerta con «Estoy acá». Si ya estaba cargado, se abre el que está.",
      link: {
        etiqueta: "Link de Google Maps",
        marcador: "https://maps.app.goo.gl/… (pegá acá lo que copiaste)",
        boton: "Leer link",
        leyendo: "Leyendo…",
        vacio: "Pegá primero el link de Google Maps.",
        noEsLink: "Eso no parece un link de Google Maps. En la app: Compartir → Copiar link.",
        cortoSinRespuesta: "No pudimos abrir ese link corto. Abrilo en el navegador y pegá la dirección larga que aparece arriba.",
        sinCoordenadas: "El link no trae la ubicación. Te dejamos el nombre en el buscador: tocá «Buscar».",
        leido: "Leímos «{nombre}» y su ubicación. Revisá los datos y agregalo.",
        sinNombre: "el local",
      },
      busqueda: {
        etiqueta: "Buscar la dirección",
        marcador: "Calle y número, ciudad",
        boton: "Buscar",
        buscando: "Buscando…",
        corta: "Escribí un poco más para buscar.",
        sinRespuesta: "El buscador de OpenStreetMap no respondió. Probá de nuevo en un rato.",
        nada: "No encontramos esa dirección. Probá con calle, número y ciudad, o usá «Estoy acá».",
        elegido: "Listo, ubicado. Completá el nombre si falta y agregalo.",
        atribucion: "Direcciones de © OpenStreetMap (Nominatim).",
      },
      abrirExistente: "Abrir el que está",
      ubicacion: "Ubicado en {coordenadas} ({precision})",
      exacta: "exacta",
      aproximada: "aproximada",
      sinUbicar: "Todavía sin ubicación en el mapa (se puede agregar igual).",
      quitarUbicacion: "Quitar",
      contacto: "Quién nos atendió (opcional)",
      nombre: "Nombre",
      nicho: "Rubro",
      sinNicho: "—",
      rubro: "Rubro, como lo dirías vos (opcional)",
      direccion: "Dirección",
      ciudad: "Ciudad",
      provincia: "Provincia",
      telefono: "Teléfono",
      web: "Web",
      estoyAca: "Estoy acá",
      ubicando: "Buscando tu ubicación…",
      ubicado: "Ubicación tomada (±{m} m).",
      sinUbicacion: "No pudimos tomar tu ubicación: en el celular hace falta HTTPS y dar permiso.",
      agregar: "Agregar local",
      agregando: "Agregando…",
      agregado: "Listo, quedó cargado.",
      repetido: "Ese local ya estaba cargado: lo abrimos.",
      errores: {
        nombre: "Escribí el nombre del local.",
        nicho: "Elegí un rubro de la lista.",
        coordenadas: "La ubicación quedó incompleta. Probá «Estoy acá» de nuevo.",
        largo: "Ese dato es demasiado largo.",
        general: "No se pudo guardar. Probá de nuevo.",
      },
    },
    importar: {
      titulo: "Importar una planilla",
      bajada:
        "Un CSV con nombre, ciudad, provincia, web, teléfono y rubro (y el link de Google Maps, si lo tiene), exportado de prospeccion-empresas.xlsx o prospeccion-herramientas.xlsx. Solo se leen esas columnas: «Estado comercial» y «Notas propias» no se tocan. Se cargan como importados, por visitar, y se ubican de a uno por segundo en OpenStreetMap; los que no aparecen quedan «sin ubicar» para corregirlos a mano.",
      archivo: "Archivo CSV",
      boton: "Importar CSV",
      importando: "Importando…",
      resultado: "{importados} cargados · {repetidos} ya estaban · {errores} con error.",
      cola: {
        ubicando: "Ubicando en el mapa, de a uno por segundo: faltan {quedan}. Dejá esta pantalla abierta.",
        pendientes: "Quedan {quedan} locales importados sin ubicar.",
        listo: "Listo, terminamos de ubicarlos.",
        resumen: "Ubicados {ubicados}, sin ubicar {sinUbicar}.",
        seguir: "Seguir ubicando",
      },
      errores: {
        archivo: "Elegí un archivo CSV.",
        vacio: "El archivo no tiene filas con nombre.",
        columnas: "No encontré la columna del nombre (nombre, empresa o local).",
        grande: "Como mucho 500 filas por vez.",
        general: "No se pudo importar. Probá de nuevo.",
      },
    },
    costo:
      "Mapa propio, sin claves ni costo: mosaicos de OpenFreeMap (gratis, sin límite de vistas) y direcciones de Nominatim (como mucho una búsqueda por segundo, siempre al tocar «Buscar»). Datos © OpenStreetMap. Los botones de Google solo abren Google Maps.",
  },
  /** La sección Núcleos: todo Quvant → cada núcleo → cada cliente. */
  nucleos: {
    titulo: "Núcleos",
    bajada: "Cómo se usa el sistema: todo Quvant, cada núcleo y cada cliente. Medido por uso del sistema, no por ventas.",
    medidoPorUso: "Medido por uso del sistema, no por ventas.",
    ejemplo: {
      cartel: "Datos de ejemplo",
      explicacion: "Clientes y uso inventados para ver el panel. Se apagan solos cuando haya datos reales.",
      noSeGuarda: "Con datos de ejemplo no se guarda nada. Cuando haya clientes reales, sí.",
    },
    filtros: { rango: "Período", rangos: { "7": "7 días", "30": "30 días", "90": "90 días" }, responsable: "Responsable", todos: "Los dos", fabrizio: "fabrizio", michel: "Michel", prueba: "Incluir clientes de prueba" },
    actualizar: { boton: "Actualizar ahora", corriendo: "Actualizando…", listo: "Listo: {fotos} fotos guardadas y {alertas} alertas nuevas.", ejemplo: "Sin PostHog ni tablas no hay nada que actualizar: el panel muestra datos de ejemplo.", error: "No se pudo actualizar." },
    semaforo: { verde: "Bien", amarillo: "Atención", rojo: "En riesgo", arranque: "En arranque" },
    tendencia: { sube: "Sube", estable: "Estable", baja: "Baja" },
    general: {
      tiles: { clientes: "Clientes activos", usuarios: "Usuarios activos esta semana", acciones: "Acciones esta semana", salud: "Salud promedio", alertas: "Alertas abiertas" },
      constelacion: "Constelación de núcleos",
      constelacionNota: "Cada núcleo es un nodo: su tamaño, la cantidad de clientes; su brillo, la actividad de la semana. Los clientes orbitan como puntos.",
      lista: "Núcleos",
      actividad: "Actividad de las últimas 12 semanas por núcleo",
      alertasHoy: "Alertas abiertas, por gravedad",
      sinAlertas: "No hay alertas abiertas.",
      proximamente: "Próximamente",
      proximamenteNota: "Este núcleo todavía no tiene sistema: sin números hasta que exista.",
      clientes: "{n} clientes",
      verNucleo: "Entrar al núcleo",
    },
    nucleo: {
      volver: "Todos los núcleos",
      comparacion: "Contra el resto de Quvant",
      ranking: "Clientes",
      ordenar: "Ordenar por",
      ordenes: { salud: "Salud", adopcion: "Adopción", tendencia: "Tendencia", crecimiento: "Crecimiento" },
      mapaCalor: "Adopción de funciones clave",
      mapaCalorNota: "Clientes en filas, funciones clave en columnas. Una columna vacía pide una mejora del sistema o una capacitación general; una fila vacía, una llamada.",
      embudo: "Embudo de activación",
      pasos: { alta: "Alta", primera_sesion: "Primer inicio de sesión", primera_accion_principal: "Primera operación", primera_funcion_avanzada: "Primera función avanzada", uso_semanal_estable: "Uso semanal estable" },
      ciudad: "Ciudad de clientes",
      ciudadNota: "Cada cliente es un volumen: la altura es la actividad, el ancho la cantidad de sucursales y el acabado la salud.",
      quePasa: "¿Qué está pasando en este núcleo?",
      sinClientes: "Todavía no hay clientes en este núcleo.",
      usada: "usada",
      sinUsar: "sin usar",
      dejoDeUsar: "dejó de usar",
    },
    cliente: {
      volver: "Volver al núcleo",
      alta: "Alta",
      sucursales: "Sucursales",
      usuarios: "Usuarios",
      responsable: "Responsable",
      plan: "Plan",
      salud: "Salud",
      evolucion: "Evolución de la salud",
      usoSemanal: "Uso semanal por módulo (8 semanas)",
      torre: "Torre de uso",
      torreNota: "Una columna por módulo y una fila por semana: se ve de un vistazo qué módulo se apagó.",
      funciones: "Funciones clave",
      ultimaVez: "Última vez",
      nunca: "Nunca",
      porSucursal: "Actividad por sucursal (7 días)",
      porRol: "Acciones por rol (4 semanas)",
      diasActivos: "{n} días activos",
      lineaDeTiempo: "Alertas y acompañamientos",
      sinHistorial: "Todavía no hay alertas ni acompañamientos.",
      registrar: "Registrar acompañamiento",
      registrando: "Guardando…",
      acompanamientoListo: "Listo, quedó registrado.",
      acompanamientoError: "No se pudo registrar el acompañamiento.",
      noEncontrado: "No encontré ese cliente.",
      sinIndicadores: "Este cliente todavía no tiene indicadores calculados: tocá «Actualizar ahora».",
      tiposAcomp: { llamada: "Llamada", visita: "Visita", capacitacion: "Capacitación", mensaje: "Mensaje", correccion: "Corrección en la configuración", novedad: "Novedad en el sistema" },
      campos: { tipo: "Qué hicimos", fecha: "Fecha", nota: "Nota (opcional)", alerta: "Resuelve la alerta" },
      ninguna: "Ninguna",
      dejarNovedad: "Dejar novedad en su sistema",
      dejarNovedadNota: "Pendiente: necesita «Novedades de Quvant» en el sistema (paso A.5, no hecho todavía).",
    },
    alertas: {
      tipos: { dejo_de_usar: "Dejó de usar una función clave", nunca_uso: "Nunca usó una función clave", cayo_actividad: "Cayó la actividad", sucursal_sin_actividad: "Sucursal sin actividad", bajo_semaforo: "Bajó de color", sin_sesiones: "Nadie inició sesión" },
      gravedad: { roja: "Roja", amarilla: "Amarilla" },
      estados: { nueva: "Nueva", vista: "Vista", resuelta: "Resuelta", descartada: "Descartada" },
      acciones: { ver: "Marcar vista", resolver: "Resolver", descartar: "Descartar", acompanar: "Registrar acompañamiento" },
    },
    claude: {
      titulo: "Qué dice Claude",
      nota: "Resume al cliente y sugiere qué hacer con sus indicadores de uso. Nunca manda nada solo: el borrador se edita y se copia.",
      pedir: "Analizar este cliente",
      pidiendo: "Analizando…",
      resumen: "Resumen",
      riesgo: "Principal riesgo",
      correcciones: "Qué conviene hacer",
      tiposCorreccion: { configuracion: "Configuración", capacitacion: "Capacitación", mejora: "Mejora del sistema" },
      mensaje: "Borrador de mensaje",
      copiar: "Copiar el mensaje",
      copiado: "Copiado.",
      ejemplo: "Sin ANTHROPIC_API_KEY: este análisis se armó con los indicadores, sin Claude.",
      modelo: "Modelo",
      error: "No se pudo analizar. Probá de nuevo en un rato.",
    },
    tresD: { ver3d: "Vista 3D", verLista: "Vista lista", sinWebGL: "Este dispositivo no tiene 3D: se muestra la lista." },
  },
} as const;
