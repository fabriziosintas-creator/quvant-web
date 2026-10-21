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
