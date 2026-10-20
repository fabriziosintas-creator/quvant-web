/**
 * El catálogo de medición del sistema Quvant: la única fuente de verdad de
 * qué se mide. Lo que no está acá, no sale (ver medir.ts).
 *
 * Regla de privacidad (sección 3): se mide cómo se usa el sistema, nunca el
 * negocio del cliente. Por eso ninguna propiedad es texto libre: solo
 * booleanos, contadores y listas cerradas. Nada de montos, precios,
 * márgenes, nombres de productos, datos de clientes finales ni textos.
 *
 * Las integraciones emuladas (ARCA, Mercado Pago, WhatsApp, sincronización)
 * no tienen eventos: no se miden como si funcionaran.
 *
 * Al cambiar algo, subir VERSION_CATALOGO y regenerar catalogo.json
 * (npm run catalogo:json). La versión viaja en cada evento.
 */

export const VERSION_CATALOGO = 1;

/** Las plantillas (núcleos) que existen hoy en el sistema o están en diseño. */
export const PLANTILLAS = ["industria", "gimnasios", "holistica", "pymes", "inmobiliarias", "supermercados", "kioscos"] as const;
export type Plantilla = (typeof PLANTILLAS)[number];

export const ROLES = ["dueno", "administracion", "caja", "deposito", "compras", "taller", "reparto", "profe", "recepcion", "otro"] as const;
export type Rol = (typeof ROLES)[number];

export const DISPOSITIVOS = ["celular", "computadora"] as const;
export type Dispositivo = (typeof DISPOSITIVOS)[number];

/** Los módulos del sistema (los del núcleo y los de cada plantilla). */
export const MODULOS = [
  "sesion",
  "tablero",
  "mostrador",
  "presupuestos",
  "precios",
  "inventario",
  "compras",
  "servicio_tecnico",
  "clientes",
  "reparto",
  "reportes",
  "importacion",
  "usuarios",
  "configuracion",
  // Gimnasios
  "socios",
  "accesos",
  "clases",
  "rutinas",
] as const;
export type Modulo = (typeof MODULOS)[number];

/** El tipo de cada propiedad: booleano, contador o una lista cerrada de valores. */
export type TipoPropiedad = "booleano" | "contador" | { opciones: readonly string[] };

export type DefinicionEvento = {
  modulo: Modulo;
  /** En qué plantillas existe el módulo ("todas" para el núcleo). */
  plantillas: "todas" | readonly Plantilla[];
  descripcion: string;
  /** Propiedades propias del evento (las comunes van siempre, ver PROPIEDADES_COMUNES). */
  propiedades: Readonly<Record<string, TipoPropiedad>>;
};

const LISTAS_DE_PRECIOS = ["minorista", "gremio", "mayorista"] as const;
const ESTADOS_REPARACION = ["ingresada", "presupuestada", "en_reparacion", "lista", "entregada", "cancelada"] as const;
const FORMATOS_EXPORTACION = ["excel", "pdf", "csv"] as const;
const TIPOS_IMPORTACION = ["lista_proveedor", "productos", "clientes", "stock"] as const;
const MEDIOS_ACCESO = ["qr", "manual", "credencial"] as const;

/**
 * Los eventos. Nombre: modulo_accion, en minúscula y guion bajo. Se anotan
 * cuando la acción se confirma (no al tocar el botón), salvo pantalla_vista.
 */
export const EVENTOS = {
  // ── Núcleo (todas las plantillas) ───────────────────────────────────
  sesion_iniciada: { modulo: "sesion", plantillas: "todas", descripcion: "Alguien entró al sistema.", propiedades: {} },
  sesion_cerrada: { modulo: "sesion", plantillas: "todas", descripcion: "Alguien cerró la sesión.", propiedades: {} },
  pantalla_vista: {
    modulo: "tablero",
    plantillas: "todas",
    descripcion: "Se abrió una pantalla (módulo y nombre de la pantalla, sin parámetros de la URL).",
    propiedades: { modulo_visto: { opciones: MODULOS }, pantalla: { opciones: ["principal", "lista", "detalle", "nuevo", "editar", "configuracion"] } },
  },
  usuario_creado: { modulo: "usuarios", plantillas: "todas", descripcion: "Se creó un usuario (con qué rol).", propiedades: { rol_creado: { opciones: ROLES } } },
  doble_factor_activado: { modulo: "usuarios", plantillas: "todas", descripcion: "Un usuario activó el doble factor.", propiedades: { rol_usuario: { opciones: ROLES } } },
  reporte_exportado: {
    modulo: "reportes",
    plantillas: "todas",
    descripcion: "Se exportó un reporte.",
    propiedades: { modulo_reporte: { opciones: MODULOS }, formato: { opciones: FORMATOS_EXPORTACION } },
  },
  importacion_completada: {
    modulo: "importacion",
    plantillas: "todas",
    descripcion: "Terminó una importación (la lista del proveedor, productos, clientes o stock).",
    propiedades: { tipo: { opciones: TIPOS_IMPORTACION }, cantidad_filas: "contador" },
  },
  auditoria_consultada: { modulo: "configuracion", plantillas: "todas", descripcion: "Alguien abrió el registro de auditoría.", propiedades: {} },

  // ── Industria y comercio ────────────────────────────────────────────
  caja_abierta: { modulo: "mostrador", plantillas: ["industria", "pymes", "supermercados", "kioscos"], descripcion: "Se abrió la caja.", propiedades: {} },
  caja_cerrada: {
    modulo: "mostrador",
    plantillas: ["industria", "pymes", "supermercados", "kioscos"],
    descripcion: "Se cerró la caja (con cuántas ventas tuvo).",
    propiedades: { cantidad_ventas: "contador" },
  },
  venta_confirmada: {
    modulo: "mostrador",
    plantillas: ["industria", "pymes", "supermercados", "kioscos"],
    descripcion: "Se confirmó una venta (si fue sin conexión y con qué lista de precios).",
    propiedades: { sin_conexion: "booleano", lista_precios: { opciones: LISTAS_DE_PRECIOS }, cantidad_items: "contador" },
  },
  venta_anulada: { modulo: "mostrador", plantillas: ["industria", "pymes", "supermercados", "kioscos"], descripcion: "Se anuló una venta.", propiedades: {} },
  presupuesto_creado: { modulo: "presupuestos", plantillas: ["industria", "pymes"], descripcion: "Se creó un presupuesto.", propiedades: { cantidad_items: "contador" } },
  presupuesto_convertido_en_venta: { modulo: "presupuestos", plantillas: ["industria", "pymes"], descripcion: "Un presupuesto pasó a venta.", propiedades: {} },
  aumento_masivo_previsualizado: {
    modulo: "precios",
    plantillas: ["industria", "pymes", "supermercados", "kioscos"],
    descripcion: "Se miró la vista previa (con el margen) de un aumento masivo.",
    propiedades: { cantidad_precios: "contador" },
  },
  aumento_masivo_aplicado: {
    modulo: "precios",
    plantillas: ["industria", "pymes", "supermercados", "kioscos"],
    descripcion: "Se aplicó un aumento masivo.",
    propiedades: { cantidad_precios: "contador", con_vista_previa: "booleano" },
  },
  conteo_camara_iniciado: { modulo: "inventario", plantillas: ["industria", "pymes", "supermercados", "kioscos"], descripcion: "Empezó un conteo de stock con la cámara.", propiedades: {} },
  conteo_camara_cerrado: {
    modulo: "inventario",
    plantillas: ["industria", "pymes", "supermercados", "kioscos"],
    descripcion: "Terminó un conteo con la cámara.",
    propiedades: { cantidad_productos: "contador" },
  },
  orden_sugerida_usada: {
    modulo: "compras",
    plantillas: ["industria", "pymes", "supermercados", "kioscos"],
    descripcion: "Se generó una orden de compra a partir de la sugerencia por stock mínimo.",
    propiedades: { cantidad_items: "contador" },
  },
  orden_compra_recibida: { modulo: "compras", plantillas: ["industria", "pymes", "supermercados", "kioscos"], descripcion: "Se marcó como recibida una orden de compra.", propiedades: {} },
  reparacion_ingresada: { modulo: "servicio_tecnico", plantillas: ["industria"], descripcion: "Entró un equipo al servicio técnico.", propiedades: {} },
  reparacion_estado_cambiado: {
    modulo: "servicio_tecnico",
    plantillas: ["industria"],
    descripcion: "Una reparación cambió de estado.",
    propiedades: { estado: { opciones: ESTADOS_REPARACION } },
  },
  cuenta_corriente_consultada: { modulo: "clientes", plantillas: ["industria", "pymes"], descripcion: "Se consultó la cuenta corriente de un cliente.", propiedades: {} },
  limite_cuenta_corriente_definido: { modulo: "clientes", plantillas: ["industria", "pymes"], descripcion: "Se definió o cambió el límite de una cuenta corriente.", propiedades: {} },
  hoja_ruta_abierta: { modulo: "reparto", plantillas: ["industria", "pymes"], descripcion: "Se abrió una hoja de ruta de reparto.", propiedades: { cantidad_entregas: "contador" } },

  // ── Gimnasios (a confirmar contra el código del sistema) ────────────
  socio_alta: { modulo: "socios", plantillas: ["gimnasios"], descripcion: "Se dio de alta un socio.", propiedades: {} },
  cuota_registrada: { modulo: "socios", plantillas: ["gimnasios"], descripcion: "Se registró el pago de una cuota (sin el monto).", propiedades: {} },
  acceso_validado: {
    modulo: "accesos",
    plantillas: ["gimnasios"],
    descripcion: "Un socio entró (con qué medio se validó el acceso).",
    propiedades: { medio: { opciones: MEDIOS_ACCESO }, permitido: "booleano" },
  },
  clase_creada: { modulo: "clases", plantillas: ["gimnasios"], descripcion: "Se creó una clase o un turno.", propiedades: {} },
  turno_reservado: { modulo: "clases", plantillas: ["gimnasios"], descripcion: "Un socio reservó un turno.", propiedades: {} },
  rutina_asignada: { modulo: "rutinas", plantillas: ["gimnasios"], descripcion: "Un profe asignó una rutina a un socio.", propiedades: {} },
} as const satisfies Record<string, DefinicionEvento>;

export type NombreEvento = keyof typeof EVENTOS;

/** Lo que viaja siempre, en todos los eventos (lo agrega medir()). */
export const PROPIEDADES_COMUNES = {
  organizacion_id: "La organización cliente (id interno).",
  plantilla: "El núcleo (nicho) de la organización.",
  sucursal_id: "La sucursal (id interno).",
  rol: "El rol del usuario que hizo la acción.",
  dispositivo: "celular o computadora.",
  version_app: "La versión del sistema.",
  version_catalogo: "La versión de este catálogo.",
  prueba: "true en las organizaciones de demo y de prueba.",
  sin_conexion: "true si el evento se guardó sin internet y salió después (la hora es la original).",
} as const;

/**
 * Funciones clave por plantilla: las que, si un cliente no usa, está
 * desaprovechando el sistema. El panel las usa para la adopción y las
 * alertas. frecuencia = cada cuánto se espera que se use.
 */
export type Frecuencia = "diaria" | "semanal" | "mensual";

export type FuncionClave = {
  id: string;
  nombre: string;
  /** El evento que la cuenta como usada. */
  evento: NombreEvento;
  frecuencia: Frecuencia;
  porQueImporta: string;
  /** Solo para clientes que tienen el módulo (por ejemplo, taller). */
  condicional?: boolean;
};

export const FUNCIONES_CLAVE: Readonly<Record<Plantilla, readonly FuncionClave[]>> = {
  industria: [
    { id: "caja_diaria", nombre: "Mostrador con caja abierta y cerrada todos los días", evento: "caja_cerrada", frecuencia: "diaria", porQueImporta: "Si la caja no se cierra, el tablero del dueño no muestra el día real y las diferencias aparecen a fin de mes." },
    { id: "presupuestos_a_venta", nombre: "Presupuestos que pasan a venta", evento: "presupuesto_convertido_en_venta", frecuencia: "semanal", porQueImporta: "Es lo que evita que los presupuestos se pierdan y mide cuántos se concretan." },
    { id: "aumento_con_margen", nombre: "Aumento masivo con vista previa del margen", evento: "aumento_masivo_previsualizado", frecuencia: "mensual", porQueImporta: "Ver el margen antes de aplicar evita subir precios a ciegas con cada lista nueva del proveedor." },
    { id: "conteo_camara", nombre: "Conteo de inventario con la cámara", evento: "conteo_camara_cerrado", frecuencia: "mensual", porQueImporta: "Sin conteos, el stock del sistema se despega del real y las sugerencias de compra dejan de servir." },
    { id: "ordenes_sugeridas", nombre: "Órdenes de compra sugeridas por stock mínimo", evento: "orden_sugerida_usada", frecuencia: "semanal", porQueImporta: "Es la función que corta los faltantes: comprar lo que el sistema ya sabe que falta." },
    { id: "servicio_tecnico", nombre: "Servicio técnico", evento: "reparacion_ingresada", frecuencia: "semanal", porQueImporta: "Si tienen taller y no lo cargan, el seguimiento de reparaciones sigue en papel.", condicional: true },
    { id: "cuentas_corrientes", nombre: "Cuentas corrientes con límite", evento: "limite_cuenta_corriente_definido", frecuencia: "mensual", porQueImporta: "El límite es lo que evita fiar de más; sin él, la cuenta corriente es una libreta." },
    { id: "doble_factor", nombre: "Doble factor activado para dueño y administración", evento: "doble_factor_activado", frecuencia: "mensual", porQueImporta: "Protege la cuenta que ve todo el negocio." },
  ],
  gimnasios: [
    { id: "altas_socios", nombre: "Alta de socios en el sistema", evento: "socio_alta", frecuencia: "semanal", porQueImporta: "Si los socios no están cargados, no hay cuotas, accesos ni rutinas que medir." },
    { id: "cuotas", nombre: "Cuotas registradas en el sistema", evento: "cuota_registrada", frecuencia: "semanal", porQueImporta: "Es la base para saber quién está al día sin revisar un cuaderno." },
    { id: "accesos", nombre: "Control de acceso con credencial", evento: "acceso_validado", frecuencia: "diaria", porQueImporta: "Cada entrada validada es un socio al día y una morosidad detectada a tiempo." },
    { id: "clases_turnos", nombre: "Clases y turnos", evento: "turno_reservado", frecuencia: "semanal", porQueImporta: "Los turnos reservados desde la app descomprimen la recepción.", condicional: true },
    { id: "rutinas", nombre: "Rutinas asignadas por los profes", evento: "rutina_asignada", frecuencia: "semanal", porQueImporta: "Es lo que hace que el socio use la app y vuelva.", condicional: true },
    { id: "doble_factor_gym", nombre: "Doble factor activado para el dueño", evento: "doble_factor_activado", frecuencia: "mensual", porQueImporta: "Protege la cuenta que ve a todos los socios." },
  ],
  // Las que siguen no tienen sistema todavía: sin funciones clave hasta que exista el módulo.
  holistica: [],
  pymes: [],
  inmobiliarias: [],
  supermercados: [],
  kioscos: [],
};

/** Las funciones clave que aplican a un cliente (las condicionales solo si tiene el módulo). */
export function funcionesClaveDe(plantilla: Plantilla, modulosActivos?: readonly string[]) {
  return FUNCIONES_CLAVE[plantilla].filter((f) => !f.condicional || !modulosActivos || modulosActivos.includes(EVENTOS[f.evento].modulo));
}

/** ¿Existe el evento en la plantilla? */
export function eventoVale(nombre: string, plantilla: Plantilla): nombre is NombreEvento {
  const def = (EVENTOS as Record<string, DefinicionEvento>)[nombre];
  if (!def) return false;
  return def.plantillas === "todas" || def.plantillas.includes(plantilla);
}
