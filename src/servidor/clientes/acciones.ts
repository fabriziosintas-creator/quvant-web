"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { esMotivoBaja, faltasDeConstancia, organizacionValida } from "@/clientes/clientes";
import { PANEL_ADMIN } from "@/datos/textos";
import { diaBA } from "@/objetivos/fechas";
import { moverEtapa } from "@/servidor/comercial/acciones";
import { esNicho, texto, uuidValido, type Errores } from "@/servidor/cuenta/validacion";
import { exigirAdmin } from "@/servidor/panel/acceso";

/**
 * Alta de un cliente real (el día que se cierra la venta), el permiso para
 * compartir métricas (solo con constancia) y la baja con motivo. Con la
 * sesión del admin: la base solo deja a los admin, y además no deja
 * prender el permiso sin una constancia "prendido".
 */

const T = PANEL_ADMIN.clientesSistema;
const E = T.errores;
const RUTA = "/panel/clientes";
const NUCLEOS = ["industria", "gimnasios", "holistica", "kioscos", "pymes", "inmobiliarias", "supermercados"];
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export type EstadoCliente = { estado: "inicial" | "error" | "listo"; mensaje?: string; errores?: Errores; valores?: Record<string, string> };

function refrescar(id?: string) {
  updateTag("nichos");
  updateTag("hoy");
  revalidatePath(RUTA, "layout");
  revalidatePath("/panel/nucleos", "layout");
  if (id) revalidatePath(`${RUTA}/${id}`);
}

const entero = (v: string) => (/^\d{1,4}$/.test(v) && Number(v) >= 1 ? Number(v) : NaN);
const monto = (v: string) => {
  const limpio = v.replace(/[$\s.]/g, "").replace(",", ".");
  if (!limpio) return null;
  const n = Number(limpio);
  return Number.isFinite(n) && n >= 0 && n < 1e11 ? Math.round(n * 100) / 100 : NaN;
};

export async function crearClienteSistema(_previo: EstadoCliente, datos: FormData): Promise<EstadoCliente> {
  const { supabase, perfil } = await exigirAdmin(`${RUTA}/nuevo`);
  const v = Object.fromEntries(["nombre", "nucleo", "organizacion", "plan", "sucursales", "usuarios", "responsable", "abono", "alta", "oportunidad_id", "local_id", "plantilla_id"].map((c) => [c, texto(datos, c)]));
  const modulos = datos.getAll("modulos").map(String).filter((m) => /^[a-z_]{1,40}$/.test(m)).slice(0, 30);
  const errores: Errores = {};
  if (!v.nombre || v.nombre.length > 160) errores.nombre = E.nombre;
  if (!NUCLEOS.includes(v.nucleo)) errores.nucleo = E.nicho;
  if (!organizacionValida(v.organizacion)) errores.organizacion = E.organizacion;
  const sucursales = entero(v.sucursales || "1");
  const usuarios = entero(v.usuarios || "1");
  if (Number.isNaN(sucursales)) errores.sucursales = E.numero;
  if (Number.isNaN(usuarios)) errores.usuarios = E.numero;
  const abono = monto(v.abono);
  if (Number.isNaN(abono)) errores.abono = E.monto;
  const hoy = diaBA(new Date());
  const alta = v.alta || hoy;
  if (!FECHA.test(alta) || alta > hoy) errores.alta = E.fecha;
  const plan = v.plan === "negocio" || v.plan === "multinegocio" ? v.plan : null;
  const responsable = v.responsable === "michel" ? "michel" : "fabrizio";
  if (Object.keys(errores).length > 0) return { estado: "error", errores, valores: v };

  const { data: repetida } = await supabase.from("clientes_sistema").select("id").eq("organizacion_id", v.organizacion).maybeSingle();
  if (repetida) return { estado: "error", errores: { organizacion: E.organizacionRepetida }, valores: v };

  // De dónde viene: una oportunidad, un local del mapa o un cliente ya cargado en Plantillas.
  const oportunidad = uuidValido(v.oportunidad_id) ? (await supabase.from("oportunidades").select("id, cliente_plantilla_id, local_id, etapa").eq("id", v.oportunidad_id).maybeSingle()).data : null;
  const localId = uuidValido(v.local_id) ? v.local_id : (oportunidad?.local_id ?? null);
  let plantillaId = uuidValido(v.plantilla_id) ? v.plantilla_id : (oportunidad?.cliente_plantilla_id ?? null);

  const comercial = { estado: "activo" as const, fecha_alta: alta, fecha_baja: null, motivo_baja: null, ...(abono !== null ? { abono_mensual: abono } : {}), ...(localId ? { local_id: localId } : {}) };
  if (plantillaId) {
    const { error } = await supabase.from("clientes_plantilla").update(comercial).eq("id", plantillaId);
    if (error) console.error("[clientes] plantilla:", error.message);
  } else {
    const { data, error } = await supabase
      .from("clientes_plantilla")
      .insert({ ...comercial, empresa: v.nombre, nicho_id: esNicho(v.nucleo) ? v.nucleo : "otro", fecha: alta, cargado_por: perfil.id })
      .select("id")
      .single();
    if (error) console.error("[clientes] plantilla:", error.message);
    plantillaId = data?.id ?? null;
  }

  const { data: nuevo, error } = await supabase
    .from("clientes_sistema")
    .insert({ organizacion_id: v.organizacion, nombre: v.nombre, nucleo_id: v.nucleo, alta, plan, sucursales_contratadas: sucursales, usuarios_contratados: usuarios, responsable, modulos_activos: modulos, cliente_plantilla_id: plantillaId })
    .select("id")
    .single();
  if (error || !nuevo) {
    console.error("[clientes] alta:", error?.message);
    return { estado: "error", mensaje: error?.code === "23505" ? E.organizacionRepetida : E.general, valores: v };
  }

  if (oportunidad && oportunidad.etapa !== "ganado") {
    if (!oportunidad.cliente_plantilla_id && plantillaId) await supabase.from("oportunidades").update({ cliente_plantilla_id: plantillaId }).eq("id", oportunidad.id);
    await moverEtapa(oportunidad.id, "ganado");
  }
  if (localId) await supabase.from("locales").update({ estado: "cliente" }).eq("id", localId);
  refrescar();
  redirect(`${RUTA}/${nuevo.id}`);
}

/** Prender (con constancia) o apagar el permiso de compartir métricas. Cada cambio queda en el historial. */
export async function cambiarPermisoMetricas(_previo: EstadoCliente, datos: FormData): Promise<EstadoCliente> {
  const { supabase } = await exigirAdmin(RUTA);
  const v = Object.fromEntries(["cliente_id", "accion", "fecha", "quien", "medio", "detalle"].map((c) => [c, texto(datos, c)]));
  if (!uuidValido(v.cliente_id) || (v.accion !== "prendido" && v.accion !== "apagado")) return { estado: "error", mensaje: E.general };
  const faltas = faltasDeConstancia({ fecha: v.fecha, quien: v.quien, medio: v.medio, detalle: v.detalle }, diaBA(new Date()));
  if (faltas.length > 0) return { estado: "error", mensaje: E.constancia, errores: Object.fromEntries(faltas.map((f) => [f, E.constancia])), valores: v };

  const { error } = await supabase.from("permisos_metricas").insert({ cliente_id: v.cliente_id, accion: v.accion, fecha: v.fecha, quien: v.quien, medio: v.medio, detalle: v.detalle || null });
  if (error) {
    console.error("[clientes] constancia:", error.message);
    return { estado: "error", mensaje: E.general, valores: v };
  }
  const { error: errorCambio } = await supabase.from("clientes_sistema").update({ comparte_metricas: v.accion === "prendido" }).eq("id", v.cliente_id);
  if (errorCambio) {
    console.error("[clientes] permiso:", errorCambio.message);
    return { estado: "error", mensaje: E.general, valores: v };
  }
  refrescar(v.cliente_id);
  return { estado: "listo", mensaje: T.metricas.listo };
}

/** La baja, con fecha y motivo, en los dos lados del cliente (cuenta del sistema y Plantillas). */
export async function darDeBaja(_previo: EstadoCliente, datos: FormData): Promise<EstadoCliente> {
  const { supabase } = await exigirAdmin(RUTA);
  const v = Object.fromEntries(["cliente_id", "fecha", "motivo", "nota"].map((c) => [c, texto(datos, c)]));
  const errores: Errores = {};
  if (!uuidValido(v.cliente_id)) errores.general = E.general;
  if (!esMotivoBaja(v.motivo)) errores.motivo = E.motivo;
  const fecha = v.fecha || diaBA(new Date());
  if (!FECHA.test(fecha)) errores.fecha = E.fecha;
  if (v.nota.length > 500) errores.nota = E.general;
  if (Object.keys(errores).length > 0) return { estado: "error", errores, valores: v };

  const { data: cliente, error } = await supabase.from("clientes_sistema").update({ baja: fecha, motivo_baja: v.motivo, nota_baja: v.nota || null }).eq("id", v.cliente_id).select("cliente_plantilla_id, alta").single();
  if (error || !cliente) {
    console.error("[clientes] baja:", error?.message);
    return { estado: "error", mensaje: E.general, valores: v };
  }
  if (cliente.cliente_plantilla_id) {
    const { error: e2 } = await supabase.from("clientes_plantilla").update({ estado: "baja", fecha_baja: fecha, motivo_baja: v.motivo }).eq("id", cliente.cliente_plantilla_id);
    if (e2) console.error("[clientes] baja plantilla:", e2.message);
  }
  refrescar(v.cliente_id);
  return { estado: "listo", mensaje: T.baja.listo };
}
