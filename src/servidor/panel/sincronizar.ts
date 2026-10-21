"use server";

import { PANEL_ADMIN } from "@/datos/textos";
import type { Respuesta, TipoOperacion } from "@/sinconexion/cola";
import { uuidValido } from "@/servidor/cuenta/validacion";
import { adminDelPedido } from "./acceso";
import { agregarLocal, cambiarEstadoLocal, cargarVisita } from "./locales";

/**
 * Manda al servidor una operación que se cargó sin señal. Si la sesión
 * venció, lo dice sin redirigir (la cola sigue en el teléfono hasta que
 * alguien vuelva a ingresar). Si el local ya no existe o los datos no
 * pasan, la rechaza con el motivo, para que alguien decida.
 */

const S = PANEL_ADMIN.sinSenal;

export async function sincronizarOperacion(tipo: TipoOperacion, datos: Record<string, string>): Promise<Respuesta> {
  const admin = await adminDelPedido();
  if (!admin) return { resultado: "sin_sesion" };
  const formulario = new FormData();
  for (const [k, v] of Object.entries(datos)) if (typeof v === "string") formulario.set(k, v.slice(0, 2000));

  if (tipo === "visita" || tipo === "estado") {
    const id = tipo === "visita" ? datos.local_id : datos.id;
    if (!uuidValido(id ?? "")) return { resultado: "rechazada", motivo: S.datosMal };
    const { data } = await admin.supabase.from("locales").select("id").eq("id", id).maybeSingle();
    if (!data) return { resultado: "rechazada", motivo: S.localBorrado };
  }

  if (tipo === "estado") {
    await cambiarEstadoLocal(formulario);
    return { resultado: "ok" };
  }
  const r = tipo === "visita" ? await cargarVisita({ estado: "inicial" }, formulario) : await agregarLocal({ estado: "inicial" }, formulario);
  if (r.estado === "listo" || r.estado === "repetido") return { resultado: "ok" };
  const detalle = r.mensaje ?? Object.values(r.errores ?? {}).filter(Boolean).join(" ");
  return { resultado: "rechazada", motivo: detalle || S.datosMal };
}
