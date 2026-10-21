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
  ruta: "/primeros-100",
  tope: 100,
  /** Ejemplo: cuántos lugares ya se dieron. El real sale de lugares_restantes() en la base. */
  EJEMPLO_DADOS: 37,
  registro: "/registro?promo=primeros-100",
} as const;

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
  botones: { quiero: "Quiero mi lugar", comoFunciona: "Ver cómo funciona" },

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
      texto: "Escribís cuánto aumentaron los costos y ves cómo quedan los precios y tu margen, antes de aplicar nada.",
      cuanto: "¿Cuánto aumentaron los costos?",
      columnas: { producto: "Producto", costo: "Costo nuevo", hoy: "Precio hoy", nuevo: "Precio nuevo" },
      margen: "Tu margen sigue en {m} %.",
      redondeoTodo: "TODO fabrizio: ¿el sistema redondea los precios? Si sí, se muestra acá; si no, no se promete.",
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
    // TODO: revisar con un abogado antes de difundir (Ley 24.240). Valores por defecto del prompt.
    items: [
      "Vigencia: desde la publicación hasta completar 100 lugares o hasta el 31 de enero de 2027, lo que pase primero.",
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
} as const;
