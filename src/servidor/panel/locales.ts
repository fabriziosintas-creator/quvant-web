"use server";

import { revalidatePath } from "next/cache";
import { PANEL_ADMIN } from "@/datos/textos";
import { esNicho, texto, uuidValido, type Errores } from "@/servidor/cuenta/validacion";
import { exigirAdmin } from "./acceso";
import { columna, leerCsv } from "./csv";
import { geocodificar, hayGeocodificacion } from "./geocodificar";
import { esEstadoLocal, esFeedback, esVolver } from "./mapa";

/**
 * Las acciones del mapa de prospección (6.3): agregar un local, cargar una
 * visita, cambiar su estado, ubicarlo donde estoy, borrarlo e importar una
 * planilla. Corren con la sesión del admin: la base solo deja escribir a
 * admin, y las visitas solo a nombre de un admin.
 */

const RUTA = "/panel/mapa";
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const T = PANEL_ADMIN.mapa;

export type EstadoFormulario = {
  estado: "inicial" | "error" | "listo" | "repetido";
  mensaje?: string;
  errores?: Errores;
  valores?: Record<string, string>;
  /** El local que ya existía (al intentar cargar uno repetido) o el recién creado. */
  localId?: string;
};

/** Un número de coordenada, o null si está vacío; NaN si está mal. */
const coordenada = (valor: string) => (valor === "" ? null : Number(valor.replace(",", ".")));

const normalizarDireccion = (direccion: string) => direccion.trim().toLowerCase().replace(/\s+/g, " ");

export async function agregarLocal(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
  const { supabase, perfil } = await exigirAdmin(RUTA);
  const E = T.local.errores;
  const valores = {
    nombre: texto(datos, "nombre"),
    nicho: texto(datos, "nicho"),
    rubro: texto(datos, "rubro"),
    direccion: texto(datos, "direccion"),
    ciudad: texto(datos, "ciudad"),
    provincia: texto(datos, "provincia"),
    telefono: texto(datos, "telefono"),
    web: texto(datos, "web"),
    latitud: texto(datos, "latitud"),
    longitud: texto(datos, "longitud"),
    place_id: texto(datos, "place_id"),
  };
  const errores: Errores = {};
  if (!valores.nombre || valores.nombre.length > 160) errores.nombre = E.nombre;
  if (valores.nicho && !esNicho(valores.nicho)) errores.nicho = E.nicho;
  const latitud = coordenada(valores.latitud);
  const longitud = coordenada(valores.longitud);
  if ((latitud === null) !== (longitud === null) || Number.isNaN(latitud) || Number.isNaN(longitud)) errores.coordenadas = E.coordenadas;
  if (latitud !== null && (Math.abs(latitud) > 90 || Math.abs(longitud ?? 0) > 180)) errores.coordenadas = E.coordenadas;
  for (const [campo, maximo] of [["rubro", 120], ["direccion", 300], ["ciudad", 120], ["provincia", 120], ["telefono", 60], ["web", 300], ["place_id", 300]] as const) {
    if (valores[campo].length > maximo) errores[campo] = E.largo;
  }
  if (Object.keys(errores).length > 0) return { estado: "error", errores, valores };

  // Sin duplicados: el mismo lugar de Google, o la misma dirección, abre el que está.
  if (valores.place_id) {
    const { data } = await supabase.from("locales").select("id").eq("place_id", valores.place_id).maybeSingle();
    if (data) return { estado: "repetido", mensaje: T.local.repetido, localId: data.id };
  }
  if (valores.direccion) {
    const { data } = await supabase.from("locales").select("id").eq("direccion_normalizada", normalizarDireccion(valores.direccion)).limit(1).maybeSingle();
    if (data) return { estado: "repetido", mensaje: T.local.repetido, localId: data.id };
  }

  const { data, error } = await supabase
    .from("locales")
    .insert({
      nombre: valores.nombre,
      nicho_id: valores.nicho || null,
      rubro: valores.rubro || null,
      direccion: valores.direccion || null,
      ciudad: valores.ciudad || null,
      provincia: valores.provincia || null,
      telefono: valores.telefono || null,
      web: valores.web || null,
      latitud,
      longitud,
      place_id: valores.place_id || null,
      cargado_por: perfil.id,
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("[locales] agregar:", error?.message);
    return { estado: "error", mensaje: E.general, valores };
  }
  revalidatePath(RUTA);
  return { estado: "listo", mensaje: T.local.agregado, localId: data.id };
}

export async function cargarVisita(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
  const { supabase } = await exigirAdmin(RUTA);
  const E = T.visita.errores;
  const valores = {
    local_id: texto(datos, "local_id"),
    fecha: texto(datos, "fecha"),
    visitante: texto(datos, "visitante"),
    feedback: texto(datos, "feedback"),
    volver: texto(datos, "volver"),
    nota: texto(datos, "nota"),
    siguiente: texto(datos, "siguiente"),
    proxima: texto(datos, "proxima"),
  };
  const errores: Errores = {};
  if (!uuidValido(valores.local_id)) errores.general = E.general;
  if (!FECHA.test(valores.fecha)) errores.fecha = E.fecha;
  if (!uuidValido(valores.visitante)) errores.visitante = E.quien;
  if (!esFeedback(valores.feedback)) errores.feedback = E.feedback;
  if (valores.volver && !esVolver(valores.volver)) errores.volver = E.general;
  if (valores.proxima && !FECHA.test(valores.proxima)) errores.proxima = E.proxima;
  if (valores.nota.length > 2000 || valores.siguiente.length > 500) errores.general = E.general;
  if (Object.keys(errores).length > 0) return { estado: "error", errores, valores };

  // tarjeta_promo solo si se marcó (la columna llega con la migración de la promo).
  const tarjeta = datos.get("tarjeta_promo") === "on" ? { tarjeta_promo: true } : {};
  const { error } = await supabase.from("visitas").insert({
    ...(tarjeta as Record<string, never>),
    local_id: valores.local_id,
    fecha: valores.fecha,
    visitante_id: valores.visitante,
    feedback: valores.feedback as "bueno" | "regular" | "malo",
    volver: valores.volver ? (valores.volver as "si" | "mas_adelante" | "no") : null,
    nota: valores.nota || null,
    siguiente_paso: valores.siguiente || null,
  });
  if (error) {
    console.error("[visitas] cargar:", error.message);
    return { estado: "error", mensaje: E.general, valores };
  }
  if (valores.proxima) {
    const { error: errorProxima } = await supabase.from("locales").update({ proxima_visita: valores.proxima }).eq("id", valores.local_id);
    if (errorProxima) console.error("[visitas] próxima:", errorProxima.message);
  }
  revalidatePath(RUTA);
  return { estado: "listo", mensaje: T.visita.guardada, localId: valores.local_id };
}

/** Estado, "volver" y próxima visita del local, desde la ficha. */
export async function cambiarEstadoLocal(datos: FormData) {
  const { supabase } = await exigirAdmin(RUTA);
  const id = texto(datos, "id");
  const estado = texto(datos, "estado");
  const volver = texto(datos, "volver");
  const proxima = texto(datos, "proxima");
  if (!uuidValido(id) || !esEstadoLocal(estado)) return;
  const { error } = await supabase
    .from("locales")
    .update({
      estado,
      volver: esVolver(volver) ? volver : null,
      proxima_visita: FECHA.test(proxima) ? proxima : null,
    })
    .eq("id", id);
  if (error) console.error("[locales] estado:", error.message);
  revalidatePath(RUTA);
}

/** "Ubicarlo donde estoy": las coordenadas del celular, parado en la puerta. */
export async function ubicarLocal(datos: FormData) {
  const { supabase } = await exigirAdmin(RUTA);
  const id = texto(datos, "id");
  const latitud = coordenada(texto(datos, "latitud"));
  const longitud = coordenada(texto(datos, "longitud"));
  if (!uuidValido(id) || latitud === null || longitud === null || Number.isNaN(latitud) || Number.isNaN(longitud)) return;
  const { error } = await supabase.from("locales").update({ latitud, longitud }).eq("id", id);
  if (error) console.error("[locales] ubicar:", error.message);
  revalidatePath(RUTA);
}

export async function borrarLocal(datos: FormData) {
  const { supabase } = await exigirAdmin(RUTA);
  const id = texto(datos, "id");
  if (!uuidValido(id)) return;
  const { error } = await supabase.from("locales").delete().eq("id", id);
  if (error) console.error("[locales] borrar:", error.message);
  revalidatePath(RUTA);
}

/**
 * Importar una planilla (CSV con nombre, ciudad, provincia, web, teléfono y
 * rubro). Solo lee: nunca escribe en la planilla ni toca "Estado comercial"
 * ni "Notas propias". Ubica cada local con la Geocoding API si hay clave de
 * servidor; los que no ubica igual se cargan, sin coordenadas.
 */
export async function importarCsv(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
  const { supabase, perfil } = await exigirAdmin(RUTA);
  const E = T.importar.errores;
  const archivo = datos.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) return { estado: "error", errores: { archivo: E.archivo } };
  if (archivo.size > 2_000_000) return { estado: "error", errores: { archivo: E.grande } };

  let filas: Array<Record<string, string>>;
  try {
    filas = leerCsv(await archivo.text());
  } catch {
    return { estado: "error", mensaje: E.general };
  }
  if (filas.length === 0) return { estado: "error", errores: { archivo: E.vacio } };
  if (!("nombre" in filas[0] || "empresa" in filas[0] || "local" in filas[0] || "nombre del local" in filas[0])) {
    return { estado: "error", errores: { archivo: E.columnas } };
  }
  if (filas.length > 500) return { estado: "error", errores: { archivo: E.grande } };

  const { data: existentes } = await supabase.from("locales").select("nombre, ciudad");
  const clave = (nombre: string, ciudad: string) => `${nombre.trim().toLowerCase()}|${ciudad.trim().toLowerCase()}`;
  const yaCargados = new Set((existentes ?? []).map((l) => clave(l.nombre, l.ciudad ?? "")));

  let importados = 0;
  let ubicados = 0;
  let repetidos = 0;
  let errores = 0;
  for (const fila of filas) {
    const nombre = columna(fila, "nombre", "empresa", "local", "nombre del local").slice(0, 160);
    if (!nombre) continue;
    const ciudad = columna(fila, "ciudad", "localidad").slice(0, 120);
    const provincia = columna(fila, "provincia").slice(0, 120);
    if (yaCargados.has(clave(nombre, ciudad))) {
      repetidos++;
      continue;
    }
    const ubicacion = await geocodificar([nombre, ciudad, provincia, "Argentina"].filter(Boolean).join(", "));
    const { error } = await supabase.from("locales").insert({
      nombre,
      ciudad: ciudad || null,
      provincia: provincia || null,
      rubro: columna(fila, "rubro", "categoria", "tipo").slice(0, 120) || null,
      telefono: columna(fila, "telefono", "tel", "celular", "whatsapp").slice(0, 60) || null,
      web: columna(fila, "web", "sitio", "sitio web", "pagina").slice(0, 300) || null,
      direccion: ubicacion?.direccion.slice(0, 300) ?? null,
      latitud: ubicacion?.latitud ?? null,
      longitud: ubicacion?.longitud ?? null,
      place_id: ubicacion?.place_id ?? null,
      origen: "importado",
      estado: "por_visitar",
      cargado_por: perfil.id,
    });
    if (error) {
      // Un place_id repetido (dos filas que Google ubica en el mismo lugar) cuenta como repetido.
      if (error.code === "23505") repetidos++;
      else {
        errores++;
        console.error("[locales] importar:", error.message);
      }
      continue;
    }
    yaCargados.add(clave(nombre, ciudad));
    importados++;
    if (ubicacion) ubicados++;
  }
  revalidatePath(RUTA);
  const resumen = T.importar.resultado
    .replace("{importados}", String(importados))
    .replace("{ubicados}", String(ubicados))
    .replace("{sinUbicar}", String(importados - ubicados))
    .replace("{repetidos}", String(repetidos))
    .replace("{errores}", String(errores));
  return { estado: "listo", mensaje: hayGeocodificacion() ? resumen : `${resumen} ${T.importar.sinClaveServidor}` };
}
