/**
 * La bitácora, pura (con pruebas en bitacora.test.ts): cómo se dice un
 * cambio en palabras ("Fabrizio cambió el estado de Ferretería Norte:
 * visitado → interesado"), a qué ficha lleva y si se puede deshacer.
 */

export const ACCIONES = ["alta", "cambio", "baja", "deshacer", "ingreso", "exportacion"] as const;
export type Accion = (typeof ACCIONES)[number];

export type Entrada = {
  id: number;
  creadoEn: string;
  quien: string | null;
  sistema: boolean;
  tabla: string;
  registroId: string | null;
  accion: Accion;
  cambios: Record<string, unknown> | null;
  detalle: Record<string, unknown> | null;
  resumen: string | null;
};

export type Textos = {
  sistema: string;
  frases: Record<"alta" | "baja" | "cambioUno" | "cambioVarios" | "deshacer" | "ingreso" | "exportacion", string>;
  tablas: Record<string, string>;
  campos: Record<string, string>;
  valores: Record<string, string>;
  si: string;
  no: string;
  vacio: string;
};

export type Linea = { campo: string; antes: string; despues: string };

/** Un valor guardado, para leer: nada, sí/no, listas, fechas y textos largos recortados. */
export function valorLegible(v: unknown, t: Pick<Textos, "valores" | "si" | "no" | "vacio">): string {
  if (v === null || v === undefined || v === "") return t.vacio;
  if (typeof v === "boolean") return v ? t.si : t.no;
  if (Array.isArray(v)) return v.length ? v.map((x) => valorLegible(x, t)).join(", ") : t.vacio;
  if (typeof v === "object") return JSON.stringify(v).slice(0, 80);
  const s = String(v);
  if (t.valores[s]) return t.valores[s];
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 16).replace("T", " ");
  return s.length > 80 ? `${s.slice(0, 79)}…` : s;
}

const nombreCampo = (campo: string, t: Textos) => t.campos[campo] ?? campo.replace(/_/g, " ");

/** Los campos de un cambio, con su antes y después (en altas y bajas, solo el valor). */
export function lineasDe(e: Entrada, t: Textos): Linea[] {
  if (!e.cambios) return [];
  return Object.entries(e.cambios).map(([campo, v]) => {
    if ((e.accion === "cambio" || e.accion === "deshacer") && Array.isArray(v) && v.length === 2) return { campo: nombreCampo(campo, t), antes: valorLegible(v[0], t), despues: valorLegible(v[1], t) };
    return { campo: nombreCampo(campo, t), antes: e.accion === "baja" ? valorLegible(v, t) : "", despues: e.accion === "baja" ? "" : valorLegible(v, t) };
  });
}

/** La frase de la línea de tiempo. */
export function describir(e: Entrada, nombreQuien: string | null, t: Textos): string {
  const quien = e.sistema && !e.quien ? t.sistema : (nombreQuien ?? t.sistema);
  const que = t.tablas[e.tabla] ?? e.tabla;
  const de = e.resumen ?? t.vacio;
  const reemplazar = (frase: string, extra: Record<string, string> = {}) =>
    Object.entries({ quien, que, de, ...extra }).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), frase);
  switch (e.accion) {
    case "alta":
      return reemplazar(t.frases.alta);
    case "baja":
      return reemplazar(t.frases.baja);
    case "deshacer":
      return reemplazar(t.frases.deshacer);
    case "ingreso":
      return reemplazar(t.frases.ingreso);
    case "exportacion":
      return reemplazar(t.frases.exportacion);
    case "cambio": {
      const lineas = lineasDe(e, t);
      if (lineas.length === 1) return reemplazar(t.frases.cambioUno, { campo: lineas[0].campo, antes: lineas[0].antes, despues: lineas[0].despues });
      return reemplazar(t.frases.cambioVarios, { n: String(lineas.length) });
    }
  }
}

/** A qué ficha lleva cada registro (null: no tiene una propia). */
export function enlaceDe(e: Pick<Entrada, "tabla" | "registroId" | "cambios" | "accion">): string | null {
  if (!e.registroId || e.accion === "baja") return null;
  switch (e.tabla) {
    case "locales":
      return `/panel/mapa?local=${e.registroId}`;
    case "visitas": {
      const local = e.cambios?.local_id;
      return typeof local === "string" ? `/panel/mapa?local=${local}` : null;
    }
    case "oportunidades":
      return `/panel/comercial/${e.registroId}`;
    case "clientes_sistema":
      return `/panel/clientes/${e.registroId}`;
    case "clientes_plantilla":
      return "/panel/plantillas";
    case "metas":
      return `/panel/objetivos/${e.registroId}`;
    case "cobros_quvant":
    case "tipo_cambio_mensual":
      return "/panel/objetivos/facturacion";
    default:
      return null;
  }
}

export const ENMASCARADOS = ["email", "telefono", "whatsapp", "contacto_email"];
export const TABLAS_DESHACER = ["locales", "visitas", "clientes_plantilla", "clientes_sistema", "cobros_quvant", "tipo_cambio_mensual", "metas", "avances_manuales", "oportunidades", "acompanamientos"];

export type MotivoNoDeshacer = "baja" | "alta" | "otra" | "enmascarado" | "tabla";

/** Por qué no se puede deshacer desde acá (null: se puede). La base vuelve a revisar todo antes de tocar nada. */
export function motivoNoDeshacer(e: Pick<Entrada, "accion" | "tabla" | "cambios">): MotivoNoDeshacer | null {
  if (e.accion === "baja") return "baja";
  if (e.accion === "alta") return "alta";
  if (e.accion !== "cambio" && e.accion !== "deshacer") return "otra";
  if (!TABLAS_DESHACER.includes(e.tabla)) return "tabla";
  if (Object.keys(e.cambios ?? {}).some((c) => ENMASCARADOS.includes(c))) return "enmascarado";
  return null;
}
