/**
 * La cola de operaciones sin señal, pura (con pruebas en cola.test.ts):
 * qué se manda primero, cuándo se reintenta, qué pasa con cada respuesta
 * del servidor y cómo se cuenta lo que se mandó.
 *
 * Cada operación lleva una clave única generada en el teléfono: el
 * servidor no crea dos veces lo mismo, así que mandarla de nuevo es seguro.
 */

export const TIPOS_OPERACION = ["visita", "estado", "local"] as const;
export type TipoOperacion = (typeof TIPOS_OPERACION)[number];

export type Operacion = {
  clave: string;
  tipo: TipoOperacion;
  datos: Record<string, string>;
  /** Para mostrar en la lista ("Visita a Ferretería Sur"). */
  titulo: string;
  creadaEn: string;
  intentos: number;
  ultimoIntento: string | null;
  estado: "pendiente" | "rechazada";
  /** Por qué la rechazó el servidor (queda para que alguien decida). */
  motivo: string | null;
};

/** Lo que contesta el servidor por cada operación. */
export type Respuesta = { resultado: "ok" } | { resultado: "rechazada"; motivo: string } | { resultado: "sin_sesion" } | { resultado: "sin_red" };

export function nuevaOperacion(clave: string, tipo: TipoOperacion, datos: Record<string, string>, titulo: string, ahora: string): Operacion {
  return { clave, tipo, datos: { ...datos, clave_cliente: clave }, titulo, creadaEn: ahora, intentos: 0, ultimoIntento: null, estado: "pendiente", motivo: null };
}

/** Espera antes de reintentar: 5 s, 10 s, 20 s… hasta 10 minutos. */
export function espera(intentos: number): number {
  return Math.min(5000 * 2 ** Math.max(0, intentos - 1), 10 * 60 * 1000);
}

/**
 * Las que se pueden mandar ahora, en el orden en que se cargaron (un local
 * nuevo antes que el cambio de estado que vino después). Las rechazadas no
 * se mandan solas: esperan a que alguien decida.
 */
export function paraMandar(cola: readonly Operacion[], ahora: string, forzar = false): Operacion[] {
  const t = Date.parse(ahora);
  return cola
    .filter((o) => o.estado === "pendiente" && (forzar || !o.ultimoIntento || t - Date.parse(o.ultimoIntento) >= espera(o.intentos)))
    .sort((a, b) => a.creadaEn.localeCompare(b.creadaEn) || a.clave.localeCompare(b.clave));
}

/** Qué hacer con la operación según la respuesta: borrarla (null) o guardarla actualizada. */
export function aplicarRespuesta(op: Operacion, r: Respuesta, ahora: string): Operacion | null {
  switch (r.resultado) {
    case "ok":
      return null;
    case "rechazada":
      return { ...op, estado: "rechazada", motivo: r.motivo, intentos: op.intentos + 1, ultimoIntento: ahora };
    case "sin_red":
      return { ...op, intentos: op.intentos + 1, ultimoIntento: ahora };
    case "sin_sesion":
      // Sin sesión no cuenta como intento: se manda apenas vuelva a ingresar.
      return op;
  }
}

/** Para el aviso "Se mandaron 3 visitas y 1 local". */
export function contarPorTipo(ops: readonly Pick<Operacion, "tipo">[]): Record<TipoOperacion, number> {
  const c: Record<TipoOperacion, number> = { visita: 0, estado: 0, local: 0 };
  for (const o of ops) c[o.tipo]++;
  return c;
}

/** Si la misma clave aparece dos veces (dos pestañas), queda una sola. */
export function sinRepetidas(cola: readonly Operacion[]): Operacion[] {
  const vistas = new Map<string, Operacion>();
  for (const o of cola) if (!vistas.has(o.clave)) vistas.set(o.clave, o);
  return [...vistas.values()];
}
