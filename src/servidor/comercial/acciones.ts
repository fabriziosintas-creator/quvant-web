"use server";

import { revalidatePath, updateTag } from "next/cache";
import { CONTACTOS, MOTIVOS_PERDIDA, TIPOS_ACTIVIDAD, esEtapa, type Etapa, type TipoActividad } from "@/comercial/comercial";
import { PANEL_ADMIN } from "@/datos/textos";
import { esNicho, texto, uuidValido, type Errores } from "@/servidor/cuenta/validacion";
import { exigirAdmin } from "@/servidor/panel/acceso";
import type { TablesUpdate } from "@/supabase/tipos";

/**
 * Las acciones del seguimiento comercial: crear una oportunidad (a mano o
 * desde un registro, un local o una charla), moverla de etapa (al ganar,
 * crea o enlaza el cliente en Plantillas), cargar actividad y editar sus
 * datos. Con la sesión del admin: la base solo deja a los admin.
 */

const T = PANEL_ADMIN.comercial;
const E = T.errores;
const RUTA = "/panel/comercial";
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export type EstadoForm = { estado: "inicial" | "error" | "listo"; mensaje?: string; errores?: Errores; valores?: Record<string, string>; id?: string };

const monto = (v: string) => {
  const limpio = v.replace(/[$\s]/g, "");
  if (!limpio) return null;
  const n = limpio.includes(",") ? Number(limpio.replace(/\./g, "").replace(",", ".")) : /^\d{1,3}(\.\d{3})+$/.test(limpio) ? Number(limpio.replace(/\./g, "")) : Number(limpio);
  return Number.isFinite(n) && n >= 0 && n < 1e13 ? Math.round(n * 100) / 100 : NaN;
};

function refrescar() {
  updateTag("nichos");
  updateTag("hoy");
  revalidatePath(RUTA, "layout");
}

function leerDatos(datos: FormData) {
  const v = Object.fromEntries(["negocio", "contacto", "telefono", "email", "nicho", "ciudad", "valor_abono", "valor_proyecto", "probabilidad", "responsable", "proximo_paso", "proximo_paso_fecha"].map((c) => [c, texto(datos, c)]));
  const errores: Errores = {};
  if (!v.negocio || v.negocio.length > 160) errores.negocio = E.negocio;
  if (v.nicho && !esNicho(v.nicho)) errores.nicho = E.general;
  if (v.email && (v.email.length > 200 || !v.email.includes("@"))) errores.email = E.email;
  const abono = monto(v.valor_abono);
  const proyecto = monto(v.valor_proyecto);
  if (Number.isNaN(abono)) errores.valor_abono = E.monto;
  if (Number.isNaN(proyecto)) errores.valor_proyecto = E.monto;
  const prob = v.probabilidad === "" ? null : Number(v.probabilidad);
  if (prob !== null && (!Number.isInteger(prob) || prob < 0 || prob > 100)) errores.probabilidad = E.probabilidad;
  if (v.responsable && v.responsable !== "fabrizio" && v.responsable !== "michel") errores.responsable = E.general;
  if (v.proximo_paso_fecha && !FECHA.test(v.proximo_paso_fecha)) errores.proximo_paso_fecha = E.fecha;
  if (v.contacto.length > 120 || v.telefono.length > 60 || v.ciudad.length > 120 || v.proximo_paso.length > 300) errores.general = E.largo;
  return {
    v,
    errores,
    fila: {
      negocio: v.negocio,
      contacto: v.contacto || null,
      telefono: v.telefono || null,
      email: v.email || null,
      nicho_id: v.nicho || null,
      ciudad: v.ciudad || null,
      valor_abono: abono,
      valor_proyecto: proyecto,
      probabilidad: prob,
      responsable: v.responsable || "fabrizio",
      proximo_paso: v.proximo_paso || null,
      proximo_paso_fecha: v.proximo_paso_fecha || null,
    },
  };
}

export async function crearOportunidad(_previo: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const { supabase } = await exigirAdmin(RUTA);
  const { v, errores, fila } = leerDatos(datos);
  const perfil = texto(datos, "perfil_id");
  const local = texto(datos, "local_id");
  const conversacion = texto(datos, "conversacion_id");
  if (Object.keys(errores).length > 0) return { estado: "error", errores, valores: v };
  const origen = perfil ? "registro" : local ? "local" : conversacion ? "chat" : "manual";
  // Si ya hay una abierta desde el mismo origen, se abre esa.
  if (local || perfil) {
    const { data: ya } = await supabase.from("oportunidades").select("id").eq(local ? "local_id" : "perfil_id", local || perfil).not("etapa", "in", "(ganado,perdido)").limit(1).maybeSingle();
    if (ya) return { estado: "listo", mensaje: T.yaExistia, id: ya.id };
  }
  const { data, error } = await supabase
    .from("oportunidades")
    .insert({
      ...fila,
      origen,
      perfil_id: uuidValido(perfil) ? perfil : null,
      local_id: uuidValido(local) ? local : null,
      conversacion_id: conversacion ? conversacion.slice(0, 80) : null,
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("[comercial] crear:", error?.message);
    return { estado: "error", mensaje: error?.code === "23505" ? T.yaExistia : E.general, valores: v };
  }
  refrescar();
  return { estado: "listo", mensaje: T.creada, id: data.id };
}

export async function editarOportunidad(_previo: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const { supabase } = await exigirAdmin(RUTA);
  const id = texto(datos, "id");
  const { v, errores, fila } = leerDatos(datos);
  if (!uuidValido(id)) errores.general = E.general;
  if (Object.keys(errores).length > 0) return { estado: "error", errores, valores: v };
  const { error } = await supabase.from("oportunidades").update(fila).eq("id", id);
  if (error) {
    console.error("[comercial] editar:", error.message);
    return { estado: "error", mensaje: E.general, valores: v };
  }
  refrescar();
  return { estado: "listo", mensaje: T.guardada, id };
}

/** Mover de etapa (desde el tablero, arrastrando o con "Mover a…", o desde la ficha). */
export async function moverEtapa(id: string, etapa: string, motivo?: string, motivoTexto?: string): Promise<{ ok: boolean; mensaje?: string }> {
  const { supabase, perfil } = await exigirAdmin(RUTA);
  if (!uuidValido(id) || !esEtapa(etapa)) return { ok: false, mensaje: E.general };
  const { data: op } = await supabase.from("oportunidades").select("*").eq("id", id).maybeSingle();
  if (!op) return { ok: false, mensaje: E.general };
  if (op.etapa === etapa) return { ok: true };
  if (etapa === "perdido" && !(MOTIVOS_PERDIDA as readonly string[]).includes(motivo ?? "")) return { ok: false, mensaje: E.motivo };

  const cambios: TablesUpdate<"oportunidades"> = { etapa };
  if (etapa === "perdido") {
    cambios.motivo_perdida = motivo;
    cambios.motivo_perdida_texto = motivoTexto?.slice(0, 300) || null;
  }
  // Ganado: el cliente entra en Plantillas (o se enlaza el que ya estaba) y el local pasa a cliente.
  if (etapa === "ganado" && !op.cliente_plantilla_id) {
    const { data: ya } = await supabase.from("clientes_plantilla").select("id").ilike("empresa", op.negocio).limit(1).maybeSingle();
    let clienteId = ya?.id ?? null;
    if (clienteId) {
      await supabase.from("clientes_plantilla").update({ estado: "activo", ...(op.valor_abono ? { abono_mensual: op.valor_abono } : {}) }).eq("id", clienteId);
    } else {
      const { data: nuevo, error } = await supabase
        .from("clientes_plantilla")
        .insert({ empresa: op.negocio, nicho_id: op.nicho_id ?? "otro", estado: "activo", abono_mensual: op.valor_abono, local_id: op.local_id, cargado_por: perfil.id, es_prueba: op.es_prueba })
        .select("id")
        .single();
      if (error) console.error("[comercial] cliente:", error.message);
      clienteId = nuevo?.id ?? null;
    }
    cambios.cliente_plantilla_id = clienteId;
    if (op.local_id) await supabase.from("locales").update({ estado: "cliente" }).eq("id", op.local_id);
  }
  const { error } = await supabase.from("oportunidades").update(cambios).eq("id", id);
  if (error) {
    console.error("[comercial] mover:", error.message);
    return { ok: false, mensaje: E.general };
  }
  await supabase.from("oportunidades_actividad").insert({
    oportunidad_id: id,
    tipo: "cambio_etapa",
    etapa_anterior: op.etapa,
    etapa_nueva: etapa,
    resultado: etapa === "perdido" ? [motivo, motivoTexto].filter(Boolean).join(": ").slice(0, 500) : null,
    quien: perfil.id,
    es_prueba: op.es_prueba,
  });
  refrescar();
  return { ok: true, mensaje: etapa === "ganado" ? T.ganada : undefined };
}

/** Cargar actividad en menos de diez segundos. Un primer contacto mueve "nuevo" a "contactado". */
export async function cargarActividad(_previo: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const { supabase, perfil } = await exigirAdmin(RUTA);
  const id = texto(datos, "oportunidad_id");
  const tipo = texto(datos, "tipo");
  const resultado = texto(datos, "resultado");
  const proximo = texto(datos, "proximo_paso");
  const proximaFecha = texto(datos, "proximo_paso_fecha");
  const errores: Errores = {};
  if (!uuidValido(id)) errores.general = E.general;
  if (!(TIPOS_ACTIVIDAD as readonly string[]).includes(tipo) || tipo === "cambio_etapa") errores.tipo = E.tipo;
  if (resultado.length > 500 || proximo.length > 300) errores.resultado = E.largo;
  if (proximaFecha && !FECHA.test(proximaFecha)) errores.proximo_paso_fecha = E.fecha;
  if (Object.keys(errores).length > 0) return { estado: "error", errores, valores: { tipo, resultado, proximo_paso: proximo, proximo_paso_fecha: proximaFecha } };

  const { data: op } = await supabase.from("oportunidades").select("etapa, es_prueba").eq("id", id).maybeSingle();
  if (!op) return { estado: "error", mensaje: E.general };
  const { error } = await supabase.from("oportunidades_actividad").insert({ oportunidad_id: id, tipo, resultado: resultado || null, quien: perfil.id, es_prueba: op.es_prueba });
  if (error) {
    console.error("[comercial] actividad:", error.message);
    return { estado: "error", mensaje: E.general };
  }
  if (proximo || proximaFecha) await supabase.from("oportunidades").update({ proximo_paso: proximo || null, proximo_paso_fecha: proximaFecha || null }).eq("id", id);
  // El primer contacto mueve "nuevo" a "contactado"; una demo hecha o una propuesta, a su etapa.
  const siguiente: Partial<Record<TipoActividad, Etapa>> = { demo: "demo_hecha", propuesta: "propuesta" };
  const orden = ["nuevo", "contactado", "demo_agendada", "demo_hecha", "propuesta", "negociacion"];
  const destino = siguiente[tipo as TipoActividad] ?? (op.etapa === "nuevo" && CONTACTOS.includes(tipo as TipoActividad) ? "contactado" : null);
  if (destino && orden.indexOf(destino) > orden.indexOf(op.etapa)) await moverEtapa(id, destino);
  refrescar();
  return { estado: "listo", mensaje: T.actividadCargada, id };
}
