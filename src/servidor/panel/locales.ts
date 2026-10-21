"use server";

import { revalidatePath, updateTag } from "next/cache";
import { PANEL_ADMIN } from "@/datos/textos";
import { esNicho, texto, uuidValido, type Errores } from "@/servidor/cuenta/validacion";
import { exigirAdmin } from "./acceso";
import { columna, leerCsv } from "./csv";
import {
  completarConLoQueVinoAntes,
  esHostPermitido,
  esLinkDeMapas,
  leerLinkLargo,
  leerTextoPegado,
  metrosEntre,
  nombreComparable,
  salirDelConsentimiento,
  type LeidoDeGoogle,
} from "./linkGoogle";
import { esEstadoLocal, esFeedback, esVolver } from "./mapa";
import { buscarLugar, lugarEn, type Lugar } from "./nominatim";
import type { TablesInsert } from "@/supabase/tipos";

/**
 * Las acciones del mapa de prospección (6.3): leer un link de Google Maps,
 * buscar una dirección, "Estoy acá", agregar un local sin duplicarlo,
 * cargar una visita, cambiar su estado, ubicarlo donde estoy, borrarlo e
 * importar una planilla. Corren con la sesión del admin: la base solo deja
 * escribir a admin, y las visitas solo a nombre de un admin.
 *
 * Nada de esto usa APIs de Google: los links se leen como texto y las
 * direcciones se buscan con Nominatim (ver nominatim.ts).
 */

const RUTA = "/panel/mapa";
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const OSM_ID = /^[NWR]\d{1,15}$/;
const T = PANEL_ADMIN.mapa;
type Supabase = Awaited<ReturnType<typeof exigirAdmin>>["supabase"];

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

/** La clave única que generó el teléfono (cargas sin señal), o null. */
const claveCliente = (datos: FormData) => {
  const clave = texto(datos, "clave_cliente").toLowerCase();
  return /^[0-9a-f-]{36}$/.test(clave) ? clave : null;
};

/**
 * Inserta con la clave del teléfono; si la columna todavía no existe (falta
 * la migración 20261023140000_clave_cliente), inserta sin ella.
 */
async function insertarConClave<R extends { error: { code?: string; message: string } | null }>(conClave: () => PromiseLike<R>, sinClave: () => PromiseLike<R>): Promise<R> {
  const r = await conClave();
  if (r.error && (r.error.code === "42703" || r.error.code === "PGRST204" || /clave_cliente/.test(r.error.message)) && r.error.code !== "23505") return sinClave();
  return r;
}

// ── Duplicados ────────────────────────────────────────────────────────
type Candidato = { link?: string | null; osm_id?: string | null; latitud?: number | null; longitud?: number | null; nombre?: string; direccion?: string | null };

/**
 * El local que ya está cargado, si lo hay: el mismo link de Google Maps,
 * el mismo lugar de OpenStreetMap, el mismo nombre a menos de 30 metros o
 * la misma dirección.
 */
async function buscarRepetido(supabase: Supabase, c: Candidato): Promise<string | null> {
  if (c.link) {
    const { data } = await supabase.from("locales").select("id").eq("link_google_maps", c.link).limit(1).maybeSingle();
    if (data) return data.id;
  }
  if (c.osm_id) {
    const { data } = await supabase.from("locales").select("id").eq("osm_id", c.osm_id).maybeSingle();
    if (data) return data.id;
  }
  if (c.latitud != null && c.longitud != null && c.nombre) {
    const margen = 0.0005; // ~50 m: se filtra después a 30 m exactos
    const { data } = await supabase
      .from("locales")
      .select("id, nombre, latitud, longitud")
      .gte("latitud", c.latitud - margen)
      .lte("latitud", c.latitud + margen)
      .gte("longitud", c.longitud - margen)
      .lte("longitud", c.longitud + margen);
    const nombre = nombreComparable(c.nombre);
    const cerca = (data ?? []).find(
      (l) => l.latitud !== null && l.longitud !== null && nombreComparable(l.nombre) === nombre && metrosEntre({ latitud: c.latitud!, longitud: c.longitud! }, { latitud: l.latitud, longitud: l.longitud }) <= 30,
    );
    if (cerca) return cerca.id;
  }
  if (c.direccion) {
    const { data } = await supabase.from("locales").select("id").eq("direccion_normalizada", normalizarDireccion(c.direccion)).limit(1).maybeSingle();
    if (data) return data.id;
  }
  return null;
}

// ── Links de Google Maps ──────────────────────────────────────────────
/**
 * Sigue un link corto (maps.app.goo.gl) hasta el largo, desde el servidor.
 * Solo a hosts de Google, solo https, como mucho 6 saltos: este servidor
 * no le hace pedidos a cualquier dirección que alguien pegue.
 */
async function seguirLinkCorto(url: URL): Promise<URL | null> {
  let actual = url;
  for (let salto = 0; salto < 6; salto++) {
    const consentimiento = salirDelConsentimiento(actual);
    if (consentimiento) actual = consentimiento;
    if (actual.protocol !== "https:" || !esHostPermitido(actual.hostname)) return null;
    if (esLinkDeMapas(actual) && !["maps.app.goo.gl", "goo.gl", "g.co"].includes(actual.hostname)) return actual;
    let respuesta: Response;
    try {
      respuesta = await fetch(actual, { redirect: "manual", signal: AbortSignal.timeout(8000), headers: { "Accept-Language": "es-AR,es" }, cache: "no-store" });
    } catch {
      return null;
    }
    const destino = respuesta.headers.get("location");
    if (respuesta.status < 300 || respuesta.status >= 400 || !destino) return null;
    try {
      actual = new URL(destino, actual);
    } catch {
      return null;
    }
  }
  return null;
}

export type RespuestaLink = { estado: "listo"; leido: LeidoDeGoogle; repetidoId?: string } | { estado: "error"; mensaje: string };

/** "Pegá el link de Google Maps": nombre y coordenadas, sin la API de Google. */
export async function leerLinkGoogle(pegado: string): Promise<RespuestaLink> {
  const { supabase } = await exigirAdmin(RUTA);
  const E = T.local.link;
  const textoPegado = String(pegado ?? "").slice(0, 3000);
  const resultado = leerTextoPegado(textoPegado);
  if (!resultado) return { estado: "error", mensaje: E.noEsLink };

  let leido: LeidoDeGoogle;
  if ("corto" in resultado) {
    const largo = await seguirLinkCorto(resultado.corto);
    if (!largo) return { estado: "error", mensaje: E.cortoSinRespuesta };
    leido = leerLinkLargo(largo, resultado.corto.toString());
    completarConLoQueVinoAntes(leido, resultado.antes);
  } else {
    leido = resultado.leido;
  }
  if (leido.nombre) leido.nombre = leido.nombre.slice(0, 160);
  if (leido.direccion) leido.direccion = leido.direccion.slice(0, 300);
  if (leido.link.length > 2000) return { estado: "error", mensaje: E.noEsLink };

  const repetidoId = await buscarRepetido(supabase, { link: leido.link, latitud: leido.latitud, longitud: leido.longitud, nombre: leido.nombre ?? undefined });
  return { estado: "listo", leido, repetidoId: repetidoId ?? undefined };
}

// ── Nominatim ─────────────────────────────────────────────────────────
export type RespuestaBusqueda = { estado: "listo"; lugares: Lugar[] } | { estado: "error"; mensaje: string };

/** "Buscar": al tocar el botón, nunca mientras se escribe (lo pide la política de Nominatim). */
export async function buscarDireccion(consulta: string): Promise<RespuestaBusqueda> {
  const { supabase } = await exigirAdmin(RUTA);
  const texto = String(consulta ?? "").trim();
  if (texto.length < 3) return { estado: "error", mensaje: T.local.busqueda.corta };
  const lugares = await buscarLugar(supabase, texto);
  if (lugares === null) return { estado: "error", mensaje: T.local.busqueda.sinRespuesta };
  return { estado: "listo", lugares };
}

/** "Estoy acá": la dirección del punto donde está el celular. */
export async function direccionAca(latitud: number, longitud: number): Promise<Lugar | null> {
  const { supabase } = await exigirAdmin(RUTA);
  if (!Number.isFinite(latitud) || !Number.isFinite(longitud) || Math.abs(latitud) > 90 || Math.abs(longitud) > 180) return null;
  return lugarEn(supabase, latitud, longitud);
}

// ── Agregar un local ──────────────────────────────────────────────────
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
    contacto: texto(datos, "contacto"),
    web: texto(datos, "web"),
    latitud: texto(datos, "latitud"),
    longitud: texto(datos, "longitud"),
    osm_id: texto(datos, "osm_id"),
    link_google_maps: texto(datos, "link_google_maps"),
  };
  const errores: Errores = {};
  if (!valores.nombre || valores.nombre.length > 160) errores.nombre = E.nombre;
  if (valores.nicho && !esNicho(valores.nicho)) errores.nicho = E.nicho;
  const latitud = coordenada(valores.latitud);
  const longitud = coordenada(valores.longitud);
  if ((latitud === null) !== (longitud === null) || Number.isNaN(latitud) || Number.isNaN(longitud)) errores.coordenadas = E.coordenadas;
  if (latitud !== null && (Math.abs(latitud) > 90 || Math.abs(longitud ?? 0) > 180)) errores.coordenadas = E.coordenadas;
  if (valores.osm_id && !OSM_ID.test(valores.osm_id)) errores.coordenadas = E.coordenadas;
  for (const [campo, maximo] of [["rubro", 120], ["direccion", 300], ["ciudad", 120], ["provincia", 120], ["telefono", 60], ["contacto", 120], ["web", 300], ["link_google_maps", 2000]] as const) {
    if (valores[campo].length > maximo) errores[campo] = E.largo;
  }
  if (Object.keys(errores).length > 0) return { estado: "error", errores, valores };

  // Cargado sin señal: si esa clave ya llegó, es el mismo local.
  const clave = claveCliente(datos);
  if (clave) {
    const { data: ya } = await supabase.from("locales").select("id").eq("clave_cliente", clave).maybeSingle();
    if (ya) return { estado: "listo", mensaje: T.local.agregado, localId: ya.id };
  }

  const repetido = await buscarRepetido(supabase, {
    link: valores.link_google_maps || null,
    osm_id: valores.osm_id || null,
    latitud,
    longitud,
    nombre: valores.nombre,
    direccion: valores.direccion || null,
  });
  if (repetido) return { estado: "repetido", mensaje: T.local.repetido, localId: repetido };

  const fila: TablesInsert<"locales"> = {
    nombre: valores.nombre,
    nicho_id: valores.nicho || null,
    rubro: valores.rubro || null,
    direccion: valores.direccion || null,
    ciudad: valores.ciudad || null,
    provincia: valores.provincia || null,
    telefono: valores.telefono || null,
    contacto: valores.contacto || null,
    web: valores.web || null,
    latitud,
    longitud,
    osm_id: valores.osm_id || null,
    link_google_maps: valores.link_google_maps || null,
    cargado_por: perfil.id,
  };
  const { data, error } = await insertarConClave(
    () => supabase.from("locales").insert({ ...fila, clave_cliente: clave }).select("id").single(),
    () => supabase.from("locales").insert(fila).select("id").single(),
  );
  if (error?.code === "23505" && clave) {
    const { data: ya } = await supabase.from("locales").select("id").eq("clave_cliente", clave).maybeSingle();
    if (ya) return { estado: "listo", mensaje: T.local.agregado, localId: ya.id };
  }
  if (error || !data) {
    console.error("[locales] agregar:", error?.message);
    return { estado: "error", mensaje: E.general, valores };
  }
  updateTag("nichos");
  revalidatePath(RUTA);
  return { estado: "listo", mensaje: T.local.agregado, localId: data.id };
}

// ── Visitas y estado ──────────────────────────────────────────────────
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
    mostrado: texto(datos, "mostrado"),
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
  if (valores.nota.length > 2000 || valores.siguiente.length > 500 || valores.mostrado.length > 200) errores.general = E.general;
  if (Object.keys(errores).length > 0) return { estado: "error", errores, valores };

  // Cargada sin señal: si esa clave ya llegó, no se crea dos veces.
  const clave = claveCliente(datos);
  if (clave) {
    const { data: ya, error: sinColumna } = await supabase.from("visitas").select("id").eq("clave_cliente", clave).maybeSingle();
    if (ya) return { estado: "listo", mensaje: T.visita.guardada, localId: valores.local_id };
    if (sinColumna) console.error("[visitas] clave:", sinColumna.message);
  }
  const fila: TablesInsert<"visitas"> = {
    local_id: valores.local_id,
    fecha: valores.fecha,
    visitante_id: valores.visitante,
    feedback: valores.feedback as "bueno" | "regular" | "malo",
    volver: valores.volver ? (valores.volver as "si" | "mas_adelante" | "no") : null,
    nota: valores.nota || null,
    que_se_mostro: valores.mostrado || null,
    siguiente_paso: valores.siguiente || null,
  };
  // La tarjeta de "Primeros 100", solo si se marcó (la columna llega con la migración de la promo).
  const conTarjeta = datos.get("tarjeta_promo") === "on" ? { ...fila, tarjeta_promo: true } : fila;
  const { error } = await insertarConClave(() => supabase.from("visitas").insert({ ...conTarjeta, clave_cliente: clave }), () => supabase.from("visitas").insert(conTarjeta));
  if (error?.code === "23505" && clave) return { estado: "listo", mensaje: T.visita.guardada, localId: valores.local_id };
  if (error) {
    console.error("[visitas] cargar:", error.message);
    return { estado: "error", mensaje: E.general, valores };
  }
  if (valores.proxima) {
    const { error: errorProxima } = await supabase.from("locales").update({ proxima_visita: valores.proxima }).eq("id", valores.local_id);
    if (errorProxima) console.error("[visitas] próxima:", errorProxima.message);
  }
  updateTag("nichos");
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
  updateTag("nichos");
  revalidatePath(RUTA);
}

/** "Ubicarlo donde estoy": las coordenadas del celular, parado en la puerta (y la dirección, si faltaba). */
export async function ubicarLocal(datos: FormData) {
  const { supabase } = await exigirAdmin(RUTA);
  const id = texto(datos, "id");
  const latitud = coordenada(texto(datos, "latitud"));
  const longitud = coordenada(texto(datos, "longitud"));
  if (!uuidValido(id) || latitud === null || longitud === null || Number.isNaN(latitud) || Number.isNaN(longitud)) return;
  const { data: local } = await supabase.from("locales").select("direccion, ciudad, provincia").eq("id", id).maybeSingle();
  const lugar = local && !local.direccion ? await lugarEn(supabase, latitud, longitud) : null;
  const { error } = await supabase
    .from("locales")
    .update({
      latitud,
      longitud,
      ubicacion_pendiente: false,
      ...(lugar ? { direccion: lugar.direccion.slice(0, 300), ciudad: local?.ciudad ?? lugar.ciudad, provincia: local?.provincia ?? lugar.provincia } : {}),
    })
    .eq("id", id);
  if (error) console.error("[locales] ubicar:", error.message);
  updateTag("nichos");
  revalidatePath(RUTA);
}

export async function borrarLocal(datos: FormData) {
  const { supabase } = await exigirAdmin(RUTA);
  const id = texto(datos, "id");
  if (!uuidValido(id)) return;
  const { error } = await supabase.from("locales").delete().eq("id", id);
  if (error) console.error("[locales] borrar:", error.message);
  updateTag("nichos");
  revalidatePath(RUTA);
}

// ── Importar planillas ────────────────────────────────────────────────
/**
 * Importar una planilla (CSV con nombre, ciudad, provincia, web, teléfono,
 * rubro y, si lo trae, el link de Google Maps). Solo lee: nunca escribe en
 * la planilla ni toca "Estado comercial" ni "Notas propias".
 *
 * Los locales se cargan enseguida, "por visitar" y con la ubicación
 * pendiente; después la pantalla llama a ubicarPendientes() de a tandas,
 * que los ubica de a una consulta por segundo (Nominatim no permite más).
 */
export async function importarCsv(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario & { pendientes?: number }> {
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

  const { data: existentes } = await supabase.from("locales").select("nombre, ciudad, link_google_maps");
  const clave = (nombre: string, ciudad: string) => `${nombreComparable(nombre)}|${ciudad.trim().toLowerCase()}`;
  const yaCargados = new Set((existentes ?? []).map((l) => clave(l.nombre, l.ciudad ?? "")));
  const linksCargados = new Set((existentes ?? []).flatMap((l) => (l.link_google_maps ? [l.link_google_maps] : [])));

  const nuevos: TablesInsert<"locales">[] = [];
  let repetidos = 0;
  for (const fila of filas) {
    const nombre = columna(fila, "nombre", "empresa", "local", "nombre del local").slice(0, 160);
    if (!nombre) continue;
    const ciudad = columna(fila, "ciudad", "localidad").slice(0, 120);
    const provincia = columna(fila, "provincia").slice(0, 120);
    const link = columna(fila, "link", "google maps", "link google maps", "maps", "mapa").slice(0, 2000);
    if (yaCargados.has(clave(nombre, ciudad)) || (link && linksCargados.has(link))) {
      repetidos++;
      continue;
    }
    yaCargados.add(clave(nombre, ciudad));
    if (link) linksCargados.add(link);
    // Un link largo ya trae las coordenadas: no hace falta buscarlo.
    const leido = link ? leerTextoPegado(link) : null;
    const ubicado = leido && "leido" in leido && leido.leido.latitud !== null ? leido.leido : null;
    nuevos.push({
      nombre,
      ciudad: ciudad || null,
      provincia: provincia || null,
      rubro: columna(fila, "rubro", "categoria", "tipo").slice(0, 120) || null,
      telefono: columna(fila, "telefono", "tel", "celular", "whatsapp").slice(0, 60) || null,
      web: columna(fila, "web", "sitio", "sitio web", "pagina").slice(0, 300) || null,
      direccion: columna(fila, "direccion", "domicilio").slice(0, 300) || ubicado?.direccion || null,
      link_google_maps: link || null,
      latitud: ubicado?.latitud ?? null,
      longitud: ubicado?.longitud ?? null,
      ubicacion_pendiente: !ubicado,
      origen: "importado",
      estado: "por_visitar",
      cargado_por: perfil.id,
    });
  }

  let importados = 0;
  let errores = 0;
  for (let i = 0; i < nuevos.length; i += 100) {
    const tanda = nuevos.slice(i, i + 100);
    const { error } = await supabase.from("locales").insert(tanda);
    if (error) {
      errores += tanda.length;
      console.error("[locales] importar:", error.message);
    } else importados += tanda.length;
  }
  updateTag("nichos");
  revalidatePath(RUTA);
  const pendientes = await contarPendientes(supabase);
  const mensaje = T.importar.resultado.replace("{importados}", String(importados)).replace("{repetidos}", String(repetidos)).replace("{errores}", String(errores));
  return { estado: "listo", mensaje, pendientes };
}

async function contarPendientes(supabase: Supabase) {
  const { count } = await supabase.from("locales").select("id", { count: "exact", head: true }).eq("ubicacion_pendiente", true);
  return count ?? 0;
}

export type TandaUbicada = { ubicados: number; sinUbicar: number; quedan: number; error?: string };

/**
 * Ubica una tanda de locales importados: primero por su link de Google
 * Maps (si trae uno corto, se sigue), si no por nombre + ciudad + provincia
 * en Nominatim. Los que no aparecen quedan "sin ubicar" para corregirlos a
 * mano ("Ubicarlo donde estoy" en la ficha). Se corta a los ~20 segundos
 * para no pasarse del tiempo de una función del servidor.
 */
export async function ubicarPendientes(): Promise<TandaUbicada> {
  const { supabase } = await exigirAdmin(RUTA);
  const inicio = Date.now();
  const { data: pendientes, error } = await supabase
    .from("locales")
    .select("id, nombre, ciudad, provincia, direccion, link_google_maps")
    .eq("ubicacion_pendiente", true)
    .order("creado_en")
    .limit(15);
  if (error) return { ubicados: 0, sinUbicar: 0, quedan: 0, error: T.importar.errores.general };

  let ubicados = 0;
  let sinUbicar = 0;
  for (const local of pendientes ?? []) {
    if (Date.now() - inicio > 20_000) break;
    let punto: { latitud: number; longitud: number; direccion?: string | null; osm_id?: string | null } | null = null;

    if (local.link_google_maps) {
      const leido = leerTextoPegado(local.link_google_maps);
      if (leido && "corto" in leido) {
        const largo = await seguirLinkCorto(leido.corto);
        const l = largo ? leerLinkLargo(largo) : null;
        if (l?.latitud != null && l.longitud != null) punto = { latitud: l.latitud, longitud: l.longitud, direccion: l.direccion };
      } else if (leido && "leido" in leido && leido.leido.latitud !== null && leido.leido.longitud !== null) {
        punto = { latitud: leido.leido.latitud, longitud: leido.leido.longitud, direccion: leido.leido.direccion };
      }
    }
    if (!punto) {
      const consulta = [local.direccion, local.nombre, local.ciudad, local.provincia, "Argentina"].filter(Boolean).join(", ");
      const lugares = await buscarLugar(supabase, consulta, 1);
      // null: Nominatim no respondió. Se deja pendiente para la próxima tanda.
      if (lugares === null) return { ubicados, sinUbicar, quedan: await contarPendientes(supabase), error: T.local.busqueda.sinRespuesta };
      const lugar = lugares[0];
      if (lugar) punto = { latitud: lugar.latitud, longitud: lugar.longitud, direccion: lugar.direccion, osm_id: lugar.osm_id };
    }

    const cambios = punto
      ? { latitud: punto.latitud, longitud: punto.longitud, direccion: local.direccion ?? punto.direccion?.slice(0, 300) ?? null, osm_id: punto.osm_id ?? null, ubicacion_pendiente: false }
      : { ubicacion_pendiente: false };
    let { error: errorCambio } = await supabase.from("locales").update(cambios).eq("id", local.id);
    // Dos filas de la planilla en el mismo lugar de OpenStreetMap: se guarda sin el id.
    if (errorCambio?.code === "23505") ({ error: errorCambio } = await supabase.from("locales").update({ ...cambios, osm_id: null }).eq("id", local.id));
    if (errorCambio) {
      console.error("[locales] ubicar importado:", errorCambio.message);
      continue;
    }
    if (punto) ubicados++;
    else sinUbicar++;
  }
  updateTag("nichos");
  revalidatePath(RUTA);
  return { ubicados, sinUbicar, quedan: await contarPendientes(supabase) };
}
