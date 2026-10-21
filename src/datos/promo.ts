/**
 * La promo de lanzamiento "Primeros 100" (docs/promo-primeros-100.md).
 *
 * ┌───────────────────────────────────────────────────────────────┐
 * │  EJEMPLO: esta página todavía no está publicada. El contador   │
 * │  (EJEMPLO_DADOS) es de muestra: el número real va a salir de   │
 * │  la base. Las condiciones usan los valores por defecto del     │
 * │  prompt hasta que fabrizio complete sus decisiones.            │
 * └───────────────────────────────────────────────────────────────┘
 */

export const PROMO = {
  id: "primeros-100",
  ruta: "/primeros-100",
  tope: 100,
  /** Ejemplo: cuántos lugares ya se dieron (solo si la base todavía no tiene la promo). */
  EJEMPLO_DADOS: 37,
  registro: "/registro?promo=primeros-100",
  /** Los rubros que pueden elegir los 2 meses del sistema (el dato real está en promo_config). */
  rubrosSistema: ["industria", "gimnasios"],
} as const;

/**
 * El video de la promo (docs/promo-primeros-100.md, sección 6). Mientras
 * `archivo` sea null, la página muestra solo las demostraciones: nunca un
 * reproductor vacío. Cuando esté (el render de video/ con la composición
 * Promo100, o uno grabado con el celular), se copia a public/promo100/ y
 * se completan las rutas. Cada capítulo es una situación: la página los
 * ofrece como botones y cada situación tiene su "Ver en el video".
 */
export type IdSituacion = "sin-internet" | "aumento" | "stock";
export const VIDEO_PROMO: {
  archivo: string | null;
  archivoWebm: string | null;
  poster: string | null;
  /** Subtítulos en WebVTT (casi todos lo miran sin sonido). */
  subtitulos: string | null;
  capitulos: ReadonlyArray<{ id: IdSituacion; titulo: string; desde: number }>;
} = {
  archivo: null, // TODO: "/promo100/promo-100-1080.mp4"
  archivoWebm: null, // TODO: "/promo100/promo-100-1080.webm"
  poster: null, // TODO: "/promo100/promo-100-poster.webp"
  subtitulos: null, // TODO: "/promo100/promo-100.es.vtt"
  capitulos: [
    { id: "sin-internet", titulo: "Se cortó internet", desde: 0 },
    { id: "aumento", titulo: "La lista nueva del proveedor", desde: 13 },
    { id: "stock", titulo: "Se está terminando algo", desde: 26 },
  ],
};

export type IdBeneficio = "web_app_50" | "sistema_2_meses";
export const BENEFICIOS: readonly IdBeneficio[] = ["web_app_50", "sistema_2_meses"];
export const esBeneficio = (valor: unknown): valor is IdBeneficio => typeof valor === "string" && (BENEFICIOS as readonly string[]).includes(valor);

export const PROMO_TEXTOS = {
  metaTitulo: "Primeros 100",
  etiqueta: "Primeros 100",
  titulo: "Para los primeros 100 que se suman.",
  bajada:
    "Elegí lo que más te sirve: 50 % de descuento en el desarrollo de tu web o tu app, o dos meses sin cargo del sistema para administrar tu negocio.",
  contador: {
    quedan: "Quedan {n} de {tope}",
    dados: "{n} lugares ya tienen dueño.",
    ejemplo: "Número de ejemplo: el real sale de los registros.",
    lleno: "Se completaron los 100 lugares.",
  },
  botones: { quiero: "Quiero mi lugar", espera: "Anotarme en la lista de espera", comoFunciona: "Ver cómo funciona" },
  /** Cuando se completan los lugares o pasa la fecha. */
  cerrada: {
    titulo: "Se completaron los 100 lugares.",
    texto: "Gracias a todos los que se sumaron. Si te registrás igual eligiendo un beneficio, quedás en la lista de espera: si se libera un lugar, te escribimos.",
  },

  situaciones: {
    etiqueta: "Tres momentos que conocés",
    bajada: "Tocá cada uno y mirá qué hace el sistema.",
    nota: "Ilustración: así funciona en el sistema. Los productos y los precios son de ejemplo.",
    sinInternet: {
      titulo: "Se cortó internet.",
      texto:
        "El mostrador sigue cobrando. Las ventas quedan guardadas y se mandan solas cuando vuelve la conexión, con su hora de verdad.",
      conectado: "Conectado",
      cortado: "Sin internet",
      cortar: "Cortar internet",
      volver: "Volver a conectar",
      cobrar: "Cobrar una venta",
      enviada: "Enviada",
      pendiente: "Para mandar",
      enviando: "Mandando…",
      estadoCortado: "Sin internet, el mostrador sigue cobrando. {n} para mandar cuando vuelva la conexión.",
      estadoConectado: "Todo al día.",
      vacio: "Todavía no cobraste nada. Probá cortar internet y cobrar igual.",
    },
    aumento: {
      titulo: "Llegó la lista nueva del proveedor.",
      texto:
        "Escribís cuánto aumentaron los costos y el sistema te muestra los precios nuevos, ya redondeados como vos quieras, y tu margen, antes de aplicar nada.",
      cuanto: "¿Cuánto aumentaron los costos?",
      redondeo: "Redondeo",
      // Las mismas opciones que el sistema (verificado en la demo el 21-oct-2026).
      opciones: [
        { id: "10", texto: "A $10" },
        { id: "100", texto: "A $100" },
        { id: "1000", texto: "A $1.000" },
        { id: "99", texto: "Terminado en ,99" },
        { id: "sin", texto: "Sin redondeo" },
      ],
      columnas: { producto: "Producto", costo: "Costo nuevo", hoy: "Precio hoy", nuevo: "Precio nuevo" },
      margen: "Margen promedio: {m} %.",
    },
    stock: {
      titulo: "Se está terminando algo.",
      texto: "Cuando un producto baja del mínimo, te avisa y te arma el pedido para el proveedor.",
      vender: "Vender una",
      reiniciar: "Empezar de nuevo",
      unidades: "{n} en stock",
      minimo: "mínimo {n}",
      aviso: "Queda poco: {producto}.",
      pedido: "Pedido sugerido para {proveedor}",
      llevar: "{n} unidades para volver a {ideal}",
      todoBien: "Hay stock. Vendé hasta que baje del mínimo.",
    },
  },

  beneficios: {
    etiqueta: "Elegís uno de los dos",
    web: {
      titulo: "50 % en tu web o tu app",
      para: "Para cualquier rubro.",
      texto: "La mitad del presupuesto de desarrollo de una web nueva o una app a medida.",
      incluye: ["Diseño y desarrollo", "Que se vea bien en el celular", "Puesta en marcha"],
      noIncluye: "No incluye dominio, hosting, mantenimiento mensual ni la carga de contenidos.",
      condicion: "Se usa aprobando el presupuesto dentro de los 90 días.",
    },
    sistema: {
      titulo: "2 meses gratis del sistema",
      para: "Para Industria y comercio, y Gimnasios y fitness.",
      texto: "El sistema para administrar tu negocio: caja, stock, precios y compras, desde la computadora y el celular.",
      incluye: ["La puesta en marcha con nosotros", "Tus productos y precios cargados", "Todas las funciones de tu rubro"],
      noIncluye: "Sin tarjeta y sin débito automático: al terminar los dos meses te preguntamos si seguís.",
      condicion: "Se activa dentro de los 60 días.",
    },
    incluyeTitulo: "Incluye",
  },

  comoFunciona: {
    etiqueta: "Cómo funciona",
    pasos: [
      { titulo: "Te registrás y elegís", texto: "Creás tu cuenta en un minuto y elegís uno de los dos beneficios." },
      { titulo: "Confirmás tu email", texto: "Con el email confirmado, tu lugar queda reservado con su número." },
      { titulo: "Te escribimos", texto: "Michel o Fabrizio te escriben por WhatsApp para arrancar. Por orden de lugar." },
    ],
  },

  bases: {
    titulo: "Bases y condiciones",
    /** {tope} y {hasta} se completan con lo que dice la base (promo_config). */
    // TODO: revisar con un abogado antes de difundir (Ley 24.240). Valores por defecto del prompt.
    items: [
      "Vigencia: desde la publicación hasta completar {tope} lugares o hasta el {hasta}, lo que pase primero.",
      "Un lugar por persona y por negocio. El lugar se asigna al confirmar el email, en el orden en que se confirman.",
      "Cada lugar da un solo beneficio, a elección: 50 % sobre el presupuesto de desarrollo de una web o una app, o dos meses sin cargo del sistema de gestión.",
      "El 50 % se aplica sobre el presupuesto aprobado. No incluye dominio, hosting, mantenimiento mensual ni carga de contenidos. El presupuesto tiene que aprobarse dentro de los 90 días de asignado el lugar.",
      "Los dos meses sin cargo son para los rubros con sistema disponible (Industria y comercio; Gimnasios y fitness) y se activan dentro de los 60 días. No se pide tarjeta ni hay débito automático. Al terminar, el abono es de $____ por mes si la persona decide seguir.",
      "Las puestas en marcha se agendan por orden de lugar, según la disponibilidad del equipo.",
      "El beneficio no se cambia por dinero ni se transfiere.",
    ],
  },

  cierre: {
    titulo: "¿Te sumás?",
    texto: "Te respondemos nosotros, no un bot.",
  },

  /** Los beneficios en una línea (cuenta, emails, panel). */
  beneficiosCortos: { web_app_50: "50 % en tu web o tu app", sistema_2_meses: "2 meses gratis del sistema" },

  /** La cinta de arriba del encabezado. */
  cinta: {
    largo: "Lanzamiento: los primeros 100 eligen 50 % en su web o 2 meses gratis del sistema",
    corto: "Primeros 100: 50 % en tu web o 2 meses gratis",
    quedan: "Quedan {n}",
    cerrar: "Cerrar el aviso",
  },

  /** Una línea con link, para Sistemas, Contacto y el pie. */
  entrada: {
    texto: "Primeros 100: elegí 50 % en tu web o 2 meses gratis del sistema.",
    link: "Ver cómo",
  },

  /** El registro con ?promo=primeros-100. */
  registro: {
    etiqueta: "Primeros 100",
    abierta: "Quedan {n} de {tope}. Elegí tu beneficio abajo: cuando confirmes tu email, tu lugar queda reservado con su número.",
    llena: "Se completaron los {tope} lugares. Si te registrás igual con un beneficio elegido, quedás en la lista de espera.",
    eleccion: "Elegí tu beneficio",
    noDisponible: "Para tu rubro todavía no hay sistema: el beneficio de la web sí te sirve.",
    telefono: { etiqueta: "Teléfono", marcador: "Para coordinar por WhatsApp", ayuda: "Lo usamos solo para coordinar tu beneficio." },
    confirmar: "Cuando confirmes tu email, tu lugar de Primeros 100 queda reservado con su número.",
    errores: {
      beneficio: "Elegí uno de los dos beneficios.",
      telefono: "Dejanos un teléfono para coordinar tu beneficio.",
      noDisponible: "Los 2 meses del sistema todavía no están disponibles para tu rubro.",
    },
  },

  /** El email a quienes ya tienen cuenta y aceptaron novedades (se manda solo con el OK de fabrizio). */
  novedad: {
    asunto: "Primeros 100: 2 meses gratis del sistema o 50 % en tu web",
    vistaPrevia: "Para las primeras 100 personas. Quedan {n} lugares.",
    titulo: "Hola, {nombre}.",
    texto: "Como tenés cuenta en Quvant y nos dijiste que querías recibir novedades, te lo contamos antes que a nadie: arrancamos con Primeros 100.",
    beneficios: [
      "2 meses gratis del sistema para administrar tu negocio (Industria y comercio; Gimnasios y fitness).",
      "O 50 % en el desarrollo de tu web o tu app, para cualquier rubro.",
    ],
    quedan: "Quedan {n} de {tope} lugares, hasta el {hasta}.",
    boton: "Reservar mi lugar",
    bases: "Las bases y condiciones están en quvant.com.ar/primeros-100.",
    porque: "Recibís este email porque aceptaste recibir novedades de Quvant. Si no querés más, desmarcá la opción en tu cuenta.",
  },

  /** Lo que suman la bienvenida y el aviso interno cuando hay lugar. */
  emails: {
    asuntoLugar: "Tu lugar N° {n} de Primeros 100 está reservado",
    asuntoEspera: "Quedaste en la lista de espera de Primeros 100",
    lugar: "Tu lugar: N° {n} de {tope}.",
    espera: "Se completaron los lugares justo antes de que confirmaras: quedaste en la lista de espera. Si se libera uno, te escribimos.",
    beneficio: "Tu beneficio: {beneficio}.",
    queSigue: "Te escribimos por WhatsApp para arrancar, por orden de lugar. Si querés adelantarte, escribinos vos.",
    plazos: {
      web_app_50: "Para usarlo, el presupuesto se aprueba dentro de los 90 días.",
      sistema_2_meses: "Los dos meses se activan dentro de los 60 días. Sin tarjeta y sin débito automático.",
    },
    boton: "Escribirnos por WhatsApp",
    aviso: {
      asunto: "Primeros 100 · lugar N° {n}: {nombre} · {rubro}",
      asuntoEspera: "Primeros 100 · lista de espera: {nombre} · {rubro}",
      lugar: "Lugar",
      beneficio: "Beneficio",
      telefono: "Teléfono",
      escribirle: "Escribirle por WhatsApp",
    },
  },

  /** La sección del panel de los socios (/panel/primeros-100). */
  panel: {
    titulo: "Primeros 100",
    bajada: "Quiénes tienen lugar, qué eligieron, en qué están y de dónde vinieron. El número lo da la base, en el orden en que confirmaron el email.",
    sinBase: "La base todavía no tiene la promo: falta aplicar la migración 20261024120000_promo_primeros_100.sql.",
    indicadores: {
      dados: "Lugares dados",
      quedan: "Quedan",
      espera: "Lista de espera",
      pedidos: "Sin confirmar el email",
      web: "Eligieron la web o app",
      sistema: "Eligieron el sistema",
      tarjetas: "Tarjetas dejadas en visitas",
      porVisita: "{n} lugares vinieron del QR",
      deTope: "de {tope}",
      hasta: "Hasta el {hasta}",
    },
    porRubro: "Lugares por rubro",
    porOrigen: "De dónde vinieron",
    embudo: {
      titulo: "El camino",
      nota: "Visitas distintas en los últimos 30 días, de la medición propia (sin terceros; respeta «no rastrear»).",
      pasos: {
        vista_cinta_promo: "Vieron la cinta",
        clic_cinta_promo: "Tocaron la cinta",
        vista_promo: "Entraron a la página",
        uso_demo_promo: "Usaron una demostración",
        play_video_promo: "Miraron el video",
        inicio_registro_promo: "Empezaron el registro",
        lugar_asignado: "Tienen lugar",
      },
      cerraron: "Cerraron la cinta",
      sinDatos: "Todavía no hay visitas medidas. La medición arranca cuando la promo esté publicada.",
    },
    lista: {
      titulo: "Los lugares",
      vacio: "Todavía no se dio ningún lugar.",
      espera: "Lista de espera",
      pedidos: "Pidieron y falta que confirmen el email",
      columnas: { numero: "N°", persona: "Persona", rubro: "Rubro", beneficio: "Beneficio", estado: "Estado", origen: "Vino desde", fecha: "Desde" },
      notas: "Notas",
      guardar: "Guardar",
      whatsapp: "WhatsApp",
      prueba: "prueba",
    },
    estados: {
      pedido: "Sin confirmar",
      espera: "En espera",
      reservado: "Reservado",
      coordinando: "Coordinando",
      en_uso: "En uso",
      usado: "Usado",
      vencido: "Vencido",
      cancelado: "Cancelado",
    },
    control: {
      titulo: "La promo",
      activa: "Abierta: la web muestra la cinta y da lugares.",
      pausada: "Pausada: la web no la muestra y nadie recibe lugar (quedan en espera).",
      pausar: "Pausar la promo",
      reabrir: "Reabrir la promo",
    },
    exportar: "Exportar CSV",
  },

  /** La cuenta: el lugar de la persona o el botón para reservarlo. */
  cuenta: {
    etiqueta: "Primeros 100",
    tuLugar: "Tu lugar: N° {n} de {tope}",
    pedido: "Pediste un lugar",
    espera: "Lista de espera",
    beneficio: "Tu beneficio: {beneficio}.",
    estados: {
      pedido: "Confirmá tu email y tu lugar queda reservado con su número.",
      espera: "Estás en la lista de espera, en el puesto {n}. Si se libera un lugar, te escribimos.",
      reservado: "Tu lugar está reservado. Te escribimos por WhatsApp para arrancar, por orden de lugar.",
      coordinando: "Estamos coordinando con vos para arrancar.",
      en_uso: "Ya lo estás usando.",
      usado: "Ya lo usaste. ¡Gracias por sumarte!",
      vencido: "Venció el plazo para usarlo. Si querés, escribinos y vemos.",
      cancelado: "Este lugar se canceló. Si es un error, escribinos.",
    },
    whatsapp: "Escribirnos por WhatsApp",
    mensaje: "Hola, soy {nombre}. Tengo el lugar {n} de Primeros 100 ({beneficio}).",
    reservar: {
      titulo: "Quedan {n} lugares de Primeros 100",
      texto: "Elegí tu beneficio y reservá tu lugar. Lo coordinamos por WhatsApp, por orden de lugar.",
      boton: "Reservar mi lugar",
      reservando: "Reservando…",
      listo: "Listo: tu lugar quedó reservado.",
      espera: "Se completaron los lugares justo ahora: quedaste en la lista de espera.",
      error: "No se pudo reservar. Probá de nuevo en un rato.",
    },
    bases: "Ver las bases y condiciones",
  },
} as const;
