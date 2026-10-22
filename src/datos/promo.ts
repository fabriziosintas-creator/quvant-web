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
  /** Los rubros que pueden elegir el mes gratis del sistema (el dato real está en promo_config). */
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
  archivo: "/promo100/promo-100-1080.mp4",
  // Sin WebM: con el grano de la imagen, el VP9 salía más pesado que el MP4.
  archivoWebm: null,
  poster: "/promo100/promo-100-poster.webp",
  // Los textos van quemados en la imagen (casi todos lo miran sin sonido; la música es de fondo): con el .vtt se leerían dos veces.
  subtitulos: null,
  capitulos: [
    { id: "sin-internet", titulo: "Se cortó internet", desde: 0 },
    { id: "aumento", titulo: "La lista nueva del proveedor", desde: 13 },
    { id: "stock", titulo: "Se está terminando algo", desde: 26 },
  ],
};

export type IdBeneficio = "web_app_50" | "sistema_1_mes";
export const BENEFICIOS: readonly IdBeneficio[] = ["web_app_50", "sistema_1_mes"];
export const esBeneficio = (valor: unknown): valor is IdBeneficio => typeof valor === "string" && (BENEFICIOS as readonly string[]).includes(valor);

export const PROMO_TEXTOS = {
  metaTitulo: "Primeros 100",
  etiqueta: "Primeros 100",
  titulo: "Para los primeros 100 que se suman.",
  bajada:
    "Elegí lo que más te sirve: 50 % de descuento en el desarrollo de tu web o tu app, o un mes sin cargo del sistema para administrar tu negocio.",
  contador: {
    quedan: "Quedan {n} de {tope}",
    dados: "{n} lugares ya tienen dueño.",
    ejemplo: "Número de ejemplo: el real sale de los registros.",
    lleno: "Se completaron los 100 lugares.",
    /** La vigencia, cerca del contador (Ley 24.240, art. 7: fecha de comienzo y de fin a la vista). */
    vigencia: "Del {desde} al {hasta}, o hasta completar los {tope} lugares.",
  },
  botones: { quiero: "Quiero mi lugar", espera: "Anotarme en la lista de espera", comoFunciona: "Ver cómo funciona" },
  /** Cuando se completan los lugares o pasa la fecha. */
  cerrada: {
    titulo: "Se completaron los 100 lugares.",
    texto: "Gracias a todos los que se sumaron. Si te registrás igual eligiendo un beneficio, quedás en la lista de espera: si abrimos más lugares, te avisamos.",
  },
  /** Antes de abrirla desde el panel (todavía no tiene fecha de comienzo). */
  antes: {
    titulo: "Primeros 100 arranca muy pronto.",
    texto: "Los primeros 100 que se registren van a elegir 1 mes gratis del sistema o 50 % en su web o su app. Mientras tanto, podés crear tu cuenta.",
    boton: "Crear mi cuenta",
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
      titulo: "1 mes gratis del sistema",
      para: "Para Industria y comercio, y Gimnasios y fitness.",
      texto: "El sistema para administrar tu negocio: caja, stock, precios y compras, desde la computadora y el celular.",
      incluye: ["La puesta en marcha con nosotros", "Tus productos y precios cargados", "Todas las funciones de tu rubro"],
      noIncluye: "Sin tarjeta y sin débito automático: al terminar el mes te preguntamos si seguís.",
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
    /**
     * Revisadas el 22-oct-2026 (marca/promo/bases-primeros-100-revisadas.pdf).
     * {desde}, {hasta} y {tope} se completan con lo que dice la base
     * (promo_config): desde es el día en que se abre la promo en el panel.
     * Sin precio del abono a propósito (decisión de fabrizio): se informa
     * por escrito antes de que termine el mes.
     *
     * Sin razón social, CUIT, domicilio ni email del organizador y sin más
     * límites para el beneficio 2, por ahora; tampoco se pasan por un
     * abogado (decisiones de fabrizio, 22-oct-2026).
     */
    items: [
      "Organizador. Organiza la promoción Quvant (quvant.com.ar). Contacto: WhatsApp +54 11 2481-1956.",
      "Vigencia. Del {desde} al {hasta} inclusive, o hasta asignar los {tope} lugares, lo que ocurra primero. Si Quvant la termina antes, lo anuncia en la web y en sus redes, y respeta los lugares ya asignados.",
      "Quién participa. Personas mayores de 18 años que se registren en quvant.com.ar con datos verdaderos y confirmen su email. Un lugar por persona y por negocio: si hay más de un registro del mismo negocio, vale el primero. Las cuentas del equipo de Quvant no participan.",
      "Cómo se asigna el lugar. Al registrarse (o desde su cuenta, si ya la tenía) la persona elige uno de los dos beneficios. El lugar se asigna solo, con un número del 1 al {tope}, en el orden en que se confirman los emails; se ve en la cuenta y llega por email. Registrarse y reservar no tiene costo ni obliga a contratar nada.",
      "Lista de espera. Quien confirma cuando ya no quedan lugares queda en lista de espera, que no da derecho al beneficio. Si Quvant abre más lugares, avisa por email y se pueden reservar desde la cuenta. Un lugar asignado no pasa a otra persona.",
      "Beneficio 1: 50 % en una web o una app. Descuento del 50 % sobre el precio del desarrollo de una web nueva (o la renovación completa de una existente) o de una app a medida, para cualquier rubro. El presupuesto se arma con los mismos criterios y precios que para cualquier cliente y muestra el precio sin descuento, el descuento y el total. No incluye dominio, hosting, mantenimiento mensual, carga de contenidos ni servicios de terceros. Quvant envía el presupuesto dentro de los 15 días hábiles de la primera reunión y la persona tiene 90 días corridos desde que lo recibe para aprobarlo; si no lo aprueba en ese plazo, el beneficio vence.",
      "Beneficio 2: 1 mes sin cargo del sistema. Uso sin cargo, durante 1 mes, del sistema de gestión de Quvant para negocios de los rubros con sistema disponible: Industria y comercio, y Gimnasios y fitness. Incluye la puesta en marcha con el equipo de Quvant, la carga inicial de productos y precios a partir de las planillas del negocio y las funciones del sistema para su rubro. El mes corre desde el día en que el sistema queda funcionando en el negocio. Las puestas en marcha se coordinan por orden de lugar: la persona tiene 60 días corridos para empezar desde que Quvant le ofrece una fecha, y si la demora es de Quvant, ese plazo se extiende.",
      "Al terminar el mes. No se cobra nada ni se renueva solo: no se pide tarjeta ni hay débito automático. Antes de que termine, Quvant informa por escrito el precio vigente del abono y la persona decide si sigue; si sigue, lo acepta de forma expresa. Si no sigue, puede pedir sus datos en una planilla dentro de los 30 días siguientes; después se borran.",
      "Baja. Se puede dejar el beneficio en cualquier momento, sin costo, avisando por el mismo medio por el que se pidió (la web, WhatsApp o email).",
      "Condiciones generales. El beneficio es personal: no se transfiere, no se cambia por dinero ni por otro servicio y no se suma a otras promociones. Estas bases no se modifican en perjuicio de quien ya tiene su lugar.",
      "Datos personales. Los datos del registro se usan para asignar el lugar y coordinar el beneficio, según la política de privacidad (quvant.com.ar/privacidad); el teléfono, solo para coordinarlo. Se puede pedir el acceso, la corrección o el borrado de los datos (Ley 25.326).",
      "Consultas y reclamos. Por WhatsApp a Quvant. Nada de estas bases limita los derechos de la Ley 24.240 de Defensa del Consumidor; los reclamos de consumo también se pueden hacer ante la autoridad de aplicación.",
    ],
  },

  cierre: {
    titulo: "¿Te sumás?",
    texto: "Te respondemos nosotros, no un bot.",
  },

  /** Los beneficios en una línea (cuenta, emails, panel). */
  beneficiosCortos: { web_app_50: "50 % en tu web o tu app", sistema_1_mes: "1 mes gratis del sistema" },

  /** La cinta de arriba del encabezado. */
  cinta: {
    largo: "Lanzamiento: los primeros 100 eligen 50 % en su web o 1 mes gratis del sistema",
    corto: "Primeros 100: 50 % en tu web o 1 mes gratis",
    quedan: "Quedan {n}",
    cerrar: "Cerrar el aviso",
  },

  /** El botón de la portada, debajo de la cinta de rubros: lleva al video y de ahí al registro. */
  portal: {
    etiqueta: "Primeros 100 registros",
    /** El título, con la parte que se resalta aparte. */
    resalte: "1 mes gratis",
    titulo: "de sistema administrativo para tu negocio",
    texto: "Mirá en 40 segundos qué hace el sistema por tu negocio.",
    /** El mes gratis es para los rubros con sistema (rubros_sistema); para el resto, el 50 % (ver las bases). */
    nota: "O, según tu rubro, 50 % en tu web o tu app.",
    accion: "Ver el video",
    estados: { abierta: "Quedan {n} de {tope}", pronto: "Arranca muy pronto", llena: "Lista de espera" },
  },

  /** La invitación a bajar hasta los beneficios, con la Q que gira y suelta su punto. */
  regalo: {
    etiqueta: "Lo mejor viene ahora",
    titulo: "Y esto es lo que te regalamos.",
    texto: "Por ser de los primeros 100, elegís uno de los dos beneficios. Seguí bajando.",
    boton: "Ver lo que te regalamos",
  },

  /** La invitación a deslizar hasta el video, en la página de la promo. */
  irAlVideo: { texto: "Deslizá y mirá el video", duracion: "40 s" },

  /** Lo que aparece sobre el video cuando termina: el paso al registro. */
  finVideo: {
    titulo: "¿Te sirve para tu negocio?",
    texto: "Registrate, confirmá tu email y tu lugar queda reservado con su número.",
    textoAntes: "Creá tu cuenta ahora: cuando arranque, sos de los primeros en enterarte.",
    otraVez: "Ver de nuevo",
  },

  /** Una línea con link, para Sistemas, Contacto y el pie. */
  entrada: {
    texto: "Primeros 100: elegí 50 % en tu web o 1 mes gratis del sistema.",
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
      noDisponible: "El mes gratis del sistema todavía no está disponible para tu rubro.",
    },
  },

  /** El email a quienes ya tienen cuenta y aceptaron novedades (se manda solo con el OK de fabrizio). */
  novedad: {
    asunto: "Primeros 100: 1 mes gratis del sistema o 50 % en tu web",
    vistaPrevia: "Para las primeras 100 personas. Quedan {n} lugares.",
    titulo: "Hola, {nombre}.",
    texto: "Como tenés cuenta en Quvant y nos dijiste que querías recibir novedades, te lo contamos antes que a nadie: arrancamos con Primeros 100.",
    beneficios: [
      "1 mes gratis del sistema para administrar tu negocio (Industria y comercio; Gimnasios y fitness).",
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
    espera: "Se completaron los lugares justo antes de que confirmaras: quedaste en la lista de espera. Si abrimos más lugares, te avisamos y lo reservás desde tu cuenta.",
    beneficio: "Tu beneficio: {beneficio}.",
    queSigue: "Te escribimos por WhatsApp para arrancar, por orden de lugar. Si querés adelantarte, escribinos vos.",
    plazos: {
      web_app_50: "Para usarlo, el presupuesto se aprueba dentro de los 90 días.",
      sistema_1_mes: "El mes gratis se activa dentro de los 60 días. Sin tarjeta y sin débito automático.",
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
      activa: "Abierta desde el {desde}: la web muestra la cinta y da lugares.",
      pausada: "Pausada: la web no la muestra y nadie recibe lugar (quedan en espera). Si la terminás antes de tiempo, anuncialo en la web y en las redes (Ley 24.240, art. 7).",
      sinAbrir: "Todavía no se abrió. El día que la abras queda como fecha de comienzo de la oferta (sale en las bases, la página y la tarjeta).",
      abrir: "Abrir la promo hoy",
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
      espera: "Estás en la lista de espera, en el puesto {n}. Si abrimos más lugares, te avisamos y lo reservás desde acá.",
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
