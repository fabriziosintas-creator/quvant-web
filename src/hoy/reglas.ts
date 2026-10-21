import { horasHabiles, CONTACTOS, type Actividad } from "../comercial/comercial";

/**
 * Las reglas de "Hoy": qué hay que hacer hoy, en orden de urgencia. Cada
 * tarjeta sale de datos (nunca inventada) y lleva sus acciones. Puro, con
 * pruebas en reglas.test.ts.
 */

export type Urgencia = 0 | 1 | 2; // 0 urgente · 1 para hoy · 2 para tener en cuenta
export type Accion = { etiqueta: string; href: string; externo?: boolean };
export type Item = { id: string; titulo: string; detalle?: string; acciones: Accion[] };
export type Tarjeta = {
  clave: string;
  tipo: "sin_contactar" | "pasos_vencidos" | "visitas_hoy" | "objetivos" | "socios" | "chat" | "cobros" | "tipo_cambio";
  urgencia: Urgencia;
  cantidad: number;
  items: Item[];
  /** Una acción general de la tarjeta (ir a la sección). */
  accion?: Accion;
};

export type EntradaHoy = {
  ahora: string;
  hoy: string;
  /** Mes "AAAA-MM". */
  mes: string;
  oportunidades: Array<{ id: string; negocio: string; etapa: string; creadoEn: string; telefono: string | null; proximoPaso: string | null; proximoFecha: string | null }> | null;
  actividades: Actividad[];
  locales: Array<{ id: string; nombre: string; proxima: string | null; caliente: boolean; latitud: number | null; longitud: number | null }>;
  objetivos: Array<{ id: string; nombre: string; estado: string; ritmo: string }>;
  socios: Array<{ id: string; nombre: string; semaforo: string; alertasNuevas: number; href: string }>;
  /** Si Núcleos está con datos de ejemplo, la tarjeta de socios no se muestra. */
  sociosDeEjemplo: boolean;
  charlas: Array<{ id: string; nombre: string; espera: boolean; noLeidos: number }>;
  cobrosPendientes: Array<{ id: string; cliente: string; monto: number }>;
  /** Clientes activos con abono que todavía no tienen el cobro del abono de este mes. */
  abonosSinCargar: Array<{ id: string; empresa: string }>;
  hayTipoCambio: boolean;
  /** Claves pospuestas por este admin hasta hoy o después. */
  pospuestas: Set<string>;
};

const MAX_ITEMS = 4;

export function armarHoy(e: EntradaHoy): Tarjeta[] {
  const tarjetas: Tarjeta[] = [];

  if (e.oportunidades) {
    // Registros (oportunidades nuevas) sin ningún contacto después de 24 horas hábiles.
    const contactadas = new Set(e.actividades.filter((a) => CONTACTOS.includes(a.tipo)).map((a) => a.oportunidadId));
    const sinContactar = e.oportunidades.filter((o) => o.etapa === "nuevo" && !contactadas.has(o.id) && horasHabiles(o.creadoEn, e.ahora) > 24);
    if (sinContactar.length) {
      tarjetas.push({
        clave: "sin_contactar",
        tipo: "sin_contactar",
        urgencia: 0,
        cantidad: sinContactar.length,
        items: sinContactar.slice(0, MAX_ITEMS).map((o) => ({
          id: o.id,
          titulo: o.negocio,
          detalle: `${Math.floor(horasHabiles(o.creadoEn, e.ahora))} h hábiles`,
          acciones: [
            ...(o.telefono ? [{ etiqueta: "llamar", href: `tel:${o.telefono.replace(/[^\d+]/g, "")}`, externo: true }] : []),
            { etiqueta: "ficha", href: `/panel/comercial/${o.id}` },
          ],
        })),
        accion: { etiqueta: "comercial", href: "/panel/comercial?vista=lista&etapa=nuevo" },
      });
    }
    const vencidos = e.oportunidades.filter((o) => o.proximoFecha && o.proximoFecha <= e.hoy && o.etapa !== "ganado" && o.etapa !== "perdido");
    if (vencidos.length) {
      tarjetas.push({
        clave: "pasos_vencidos",
        tipo: "pasos_vencidos",
        urgencia: vencidos.some((o) => o.proximoFecha! < e.hoy) ? 0 : 1,
        cantidad: vencidos.length,
        items: vencidos
          .sort((a, b) => a.proximoFecha!.localeCompare(b.proximoFecha!))
          .slice(0, MAX_ITEMS)
          .map((o) => ({ id: o.id, titulo: o.negocio, detalle: [o.proximoFecha!.split("-").reverse().join("/"), o.proximoPaso].filter(Boolean).join(" · "), acciones: [{ etiqueta: "ficha", href: `/panel/comercial/${o.id}` }] })),
        accion: { etiqueta: "comercial", href: "/panel/comercial?vista=lista&vencidas=si" },
      });
    }
  }

  const deHoy = e.locales.filter((l) => l.proxima === e.hoy);
  const calientesSinFecha = e.locales.filter((l) => l.caliente && !l.proxima);
  if (deHoy.length) {
    tarjetas.push({
      clave: "visitas_hoy",
      tipo: "visitas_hoy",
      urgencia: 1,
      cantidad: deHoy.length,
      items: [...deHoy, ...calientesSinFecha].slice(0, MAX_ITEMS).map((l) => ({ id: l.id, titulo: l.nombre, detalle: l.proxima === e.hoy ? "hoy" : "caliente, sin fecha", acciones: [{ etiqueta: "mapa", href: `/panel/mapa?local=${l.id}` }] })),
      accion: { etiqueta: "recorrido", href: "/panel/mapa?semana=si" },
    });
  }

  const flojos = e.objetivos.filter((o) => o.estado === "atrasado" || o.estado === "en_riesgo");
  if (flojos.length) {
    tarjetas.push({
      clave: "objetivos",
      tipo: "objetivos",
      urgencia: flojos.some((o) => o.estado === "atrasado") ? 0 : 1,
      cantidad: flojos.length,
      items: flojos.slice(0, MAX_ITEMS).map((o) => ({ id: o.id, titulo: o.nombre, detalle: o.ritmo, acciones: [{ etiqueta: "objetivo", href: `/panel/objetivos/${o.id}` }] })),
      accion: { etiqueta: "objetivos", href: "/panel/objetivos?estado=atrasado" },
    });
  }

  if (!e.sociosDeEjemplo) {
    const enRojo = e.socios.filter((s) => s.semaforo === "rojo" || s.alertasNuevas > 0);
    if (enRojo.length) {
      tarjetas.push({
        clave: "socios",
        tipo: "socios",
        urgencia: enRojo.some((s) => s.semaforo === "rojo") ? 0 : 1,
        cantidad: enRojo.length,
        items: enRojo.slice(0, MAX_ITEMS).map((s) => ({ id: s.id, titulo: s.nombre, detalle: s.semaforo === "rojo" ? "en rojo" : `${s.alertasNuevas} alertas nuevas`, acciones: [{ etiqueta: "nucleos", href: s.href }] })),
        accion: { etiqueta: "nucleos", href: "/panel/nucleos" },
      });
    }
  }

  const esperando = e.charlas.filter((c) => c.espera || c.noLeidos > 0);
  if (esperando.length) {
    tarjetas.push({
      clave: "chat",
      tipo: "chat",
      urgencia: esperando.some((c) => c.espera) ? 0 : 1,
      cantidad: esperando.length,
      items: esperando.slice(0, MAX_ITEMS).map((c) => ({ id: c.id, titulo: c.nombre, detalle: c.noLeidos ? `${c.noLeidos} sin leer` : "espera respuesta", acciones: [{ etiqueta: "bandeja", href: `/panel/mensajes?c=${c.id}` }] })),
      accion: { etiqueta: "bandeja", href: "/panel/mensajes" },
    });
  }

  const cobros = e.cobrosPendientes.length + e.abonosSinCargar.length;
  if (cobros) {
    tarjetas.push({
      clave: `cobros:${e.mes}`,
      tipo: "cobros",
      urgencia: 2,
      cantidad: cobros,
      items: [
        ...e.cobrosPendientes.map((c) => ({ id: c.id, titulo: c.cliente, detalle: "pendiente de cobro", acciones: [] })),
        ...e.abonosSinCargar.map((c) => ({ id: c.id, titulo: c.empresa, detalle: "abono del mes sin cargar", acciones: [] })),
      ].slice(0, MAX_ITEMS),
      accion: { etiqueta: "facturacion", href: "/panel/objetivos/facturacion" },
    });
  }

  if (!e.hayTipoCambio) tarjetas.push({ clave: `tipo_cambio:${e.mes}`, tipo: "tipo_cambio", urgencia: 2, cantidad: 1, items: [] });

  return tarjetas.filter((t) => !e.pospuestas.has(t.clave)).sort((a, b) => a.urgencia - b.urgencia || b.cantidad - a.cantidad);
}

export const resumirDia = (t: Tarjeta[]) => ({ urgentes: t.filter((x) => x.urgencia === 0).length, paraHoy: t.filter((x) => x.urgencia === 1).length });
