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
    nombre: "Plataformas",
    corto: "Sistemas",
    frase: "Un núcleo que ya funciona y un sistema para cada rubro.",
    titulo: "El mismo núcleo, un sistema para cada rubro.",
    bajada:
      "Quvant es el sistema de gestión: un núcleo común que ya funciona y, arriba, una plantilla pensada para cada rubro. Cada producto lleva su nombre y la firma de la casa.",
    metaTitulo: "Sistemas de gestión por rubro: industria, gimnasios y más",
    capitulos: [
      { id: "hoy", nombre: "Lo que hace hoy" },
      { id: "rubros", nombre: "Rubros" },
      { id: "integraciones", nombre: "Integraciones" },
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
      { id: "equipo", nombre: "El equipo" },
      { id: "video", nombre: "En 45 segundos" },
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
  siguiente: "Seguí por",
  anterior: "Volver a",
  capitulos: "En esta página",
  navPrincipal: "Canales del sitio",
  navCelular: "Barra de canales",
} as const;

/** Interruptor 3D / texto: arriba en la computadora, en el pie en el celular. */
export const INTERRUPTOR_VISTA = {
  etiqueta: "Elegir cómo ver el sitio",
  opcion3d: "Vista 3D",
  opcionTexto: "Vista texto",
  corto3d: "3D",
  cortoTexto: "Texto",
} as const;

export const ACCESIBILIDAD = {
  saltarAlContenido: "Saltar al contenido",
  irAlInicio: "Quvant — ir al inicio",
} as const;

export const HERO = {
  titulo: "QUVANT",
  propuesta: "Software de gestión, apps y webs para pymes y empresas de primer nivel.",
  botonPrimario: { texto: "Ver trabajos", destino: "/trabajos" },
  botonSecundario: { texto: "Hablemos", destino: "/contacto" },
} as const;

/** La portada, después del video: los canales, los trabajos destacados y el cierre. */
export const INICIO = {
  canales: {
    etiqueta: "Canales",
    titulo: "Elegí por dónde seguir.",
    entrar: "Entrar",
    enVivo: "En vivo",
    pausar: "Pausar el recorrido de canales",
    seguir: "Seguir con el recorrido de canales",
  },
  destacados: {
    etiqueta: "Trabajos",
    titulo: "Algunos que ya están andando.",
    verTodos: "Ver todos los trabajos",
  },
  cierre: {
    titulo: "¿Tenés un proyecto en mente?",
    texto: "Contanos qué necesitás y te respondemos con una propuesta concreta.",
    boton: "Hablemos",
  },
} as const;

export const CONTACTO_SECCION = {
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

/** El canal Trabajos: la vitrina, el visor y el caso Ferremix. */
export const WEBS = {
  /** La vitrina del portfolio (datos en src/datos/portfolio.ts). */
  vitrina: {
    filtros: "Filtrar por tipo",
    todo: "Todo",
    proyectos: "proyectos",
    enVivo: "para probar en vivo",
    ayudaMouse: "Pasá el mouse para verla moverse. Clic para entrar.",
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
} as const;

/** El canal Plataformas (título y bajada en CANALES). */
export const PLATAFORMAS = {
  /** Para los datos estructurados: qué es Quvant como producto. */
  descripcion:
    "Quvant es el sistema de gestión: un núcleo común que ya funciona y, arriba, una plantilla pensada para cada rubro.",
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
        "Antes de proponer nada, entendemos cómo trabajás hoy: qué te traba y qué hacés a mano. Llegamos con preguntas, no con una solución armada.",
      marca: "Nada de soluciones enlatadas.",
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
      parrafos: [
        "Sistemas y sitios web para startups y empresas de primer nivel, simples de usar desde el primer día. Con las tecnologías más nuevas e inteligencia artificial para construir más rápido y con más precisión.",
      ],
      puntos: ["Sistemas y sitios web", "Tecnologías nuevas", "IA para construir mejor"],
      dato: { numero: 10, prefijo: "+", etiqueta: "años construyendo software" },
      ventana: "quvant · construir.ts",
    },
    comercial: {
      etiqueta: "Fuerza comercial",
      titular: "Entendemos tu negocio antes de escribir una línea de código.",
      parrafos: [
        "Conocemos el negocio y a la gente que lo mueve. Lo que necesitás se vuelve un pedido claro para desarrollo, y te acompañamos hasta que el sistema anda en tu empresa. Y después también.",
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
      foto: "", // TODO: guardar la foto en public/equipo/michel.jpg y poner acá "/equipo/michel.jpg".
    },
    {
      nombre: "Fabrizio",
      iniciales: "F",
      rol: "Fuerza comercial",
      cargo: "Co-founder · Área comercial",
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
  /** El spot de 45 s (video/ en este repo), con play a pedido y sonido. */
  spot: {
    ventana: "Quvant en 45 segundos",
    nota: "Con sonido",
    reproducir: "Ver el video",
    duracion: "0:45",
    descripcion:
      "Video de Quvant: cómo programamos y diseñamos, Yunque y Forja por dentro con pantallas reales, cómo trabajamos por fases y la firma de la marca.",
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
  ingreso: {
    quien: "¿Quién sos?",
    clave: "Clave",
    entrar: "Entrar",
    claveDePrueba: "En esta computadora la clave de prueba es «quvant». En producción se define con PANEL_CLAVE.",
    sinConfigurar: "Falta configurar PANEL_CLAVE en el servidor.",
  },
  salir: "Salir",
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
} as const;
