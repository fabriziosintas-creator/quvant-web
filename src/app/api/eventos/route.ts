import { NextResponse, type NextRequest } from "next/server";
import { ORIGENES, PROFUNDIDADES, TRAMOS } from "@/componentes/medicion/atencion";
import { ACENTO_NICHO } from "@/datos/colores";
import { esNicho, uuidValido } from "@/servidor/cuenta/validacion";
import { crearClienteAdmin } from "@/supabase/admin";
import { configSupabase } from "@/supabase/entorno";
import { crearClienteServidor } from "@/supabase/servidor";
import type { Enums } from "@/supabase/tipos";

/**
 * Recibe los eventos de la web pública (ver componentes/medicion): las
 * visitas, qué rubro se miró, dónde se tocó "demo" o "Hablemos", y los pasos del
 * registro. Lo que llega, lo guarda el servidor con la clave secreta
 * (nadie inserta eventos por la API de Supabase).
 *
 * Sin datos personales: ni IP, ni navegador, ni email. El id anónimo lo
 * crea el navegador; si la persona está logueada va también su id, nada
 * más. Con la señal de "no rastrear" (Do Not Track o Global Privacy
 * Control) no se guarda nada. El límite de frecuencia lo pone la base
 * (privado.limitar_eventos): acá solo se valida la forma.
 */

const TIPOS: readonly Enums<"tipo_evento">[] = [
  "visita",
  "tiempo_nicho",
  "profundidad_nicho",
  "origen",
  "vista_nicho",
  "clic_demo",
  "clic_contacto",
  "inicio_registro",
  "registro_completo",
  "email_confirmado",
];
/** Lo que el navegador puede mandar (los de registro los anota la base). */
const DESDE_LA_WEB: readonly Enums<"tipo_evento">[] = ["visita", "vista_nicho", "clic_demo", "clic_contacto", "inicio_registro", "tiempo_nicho", "profundidad_nicho", "origen"];

/** Los valores que acepta cada evento con detalle: listas cerradas, nunca texto libre. */
const DETALLES: Partial<Record<Enums<"tipo_evento">, readonly string[]>> = { tiempo_nicho: TRAMOS, profundidad_nicho: PROFUNDIDADES, origen: ORIGENES };
/** Rubros que se pueden medir: los del registro y los que la web muestra como próximamente (todos están en la tabla nichos). */
const esRubro = (v: unknown): v is string => esNicho(v) || (typeof v === "string" && v in ACENTO_NICHO);

const noRastrear = (pedido: NextRequest) =>
  pedido.headers.get("dnt") === "1" || pedido.headers.get("sec-gpc") === "1";

/** Robots que ejecutan JavaScript (buscadores, vistas previas, pruebas de velocidad): no son personas. */
const ROBOT = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|prerender|phantom|selenium|puppeteer|playwright/i;
const esRobot = (pedido: NextRequest) => {
  const agente = pedido.headers.get("user-agent") ?? "";
  return agente === "" || ROBOT.test(agente);
};

export async function POST(pedido: NextRequest) {
  // Sin configurar, con "no rastrear" o de un robot: como si nada (204 para que el navegador no reintente).
  if (!configSupabase() || noRastrear(pedido) || esRobot(pedido)) return new NextResponse(null, { status: 204 });

  let cuerpo: { eventos?: unknown };
  try {
    cuerpo = await pedido.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  }
  const lista = Array.isArray(cuerpo.eventos) ? cuerpo.eventos.slice(0, 20) : [];

  const filas = lista.flatMap((e: Record<string, unknown>) => {
    const tipo = TIPOS.find((t) => t === e.tipo);
    if (!tipo || !DESDE_LA_WEB.includes(tipo)) return [];
    const visita = typeof e.visita === "string" && uuidValido(e.visita) ? e.visita : null;
    if (!visita) return [];
    const nicho = esRubro(e.nicho) ? e.nicho : null;
    const pagina = typeof e.pagina === "string" ? e.pagina.replace(/[?#].*$/, "").slice(0, 200) : null;
    const lista = DETALLES[tipo];
    if (lista) {
      // Con detalle: tiene que ser de su lista; tiempo y profundidad, además, de un rubro.
      if (typeof e.detalle !== "string" || !lista.includes(e.detalle)) return [];
      if (tipo !== "origen" && !nicho) return [];
      return [{ tipo, nicho_id: nicho, pagina, visita_id: visita, detalle: e.detalle }];
    }
    return [{ tipo, nicho_id: nicho, pagina, visita_id: visita }];
  });
  if (filas.length === 0) return new NextResponse(null, { status: 204 });

  // Si hay sesión, el id de la persona (para contar registros por visita).
  let perfil: string | null = null;
  if (pedido.cookies.getAll().some((c) => c.name.startsWith("sb-"))) {
    const { data } = await (await crearClienteServidor()).auth.getClaims();
    perfil = data?.claims?.sub ?? null;
  }

  const admin = crearClienteAdmin();

  // Un admin (fabrizio o Michel) no se mide: su navegador queda anotado como
  // del equipo (se descuenta también lo que ya había contado) y no se guarda nada.
  if (perfil) {
    const { data: quien } = await admin.from("perfiles").select("rol").eq("id", perfil).maybeSingle();
    if (quien?.rol === "admin") {
      const navegadores = [...new Set(filas.map((f) => f.visita_id))].map((visita_id) => ({ visita_id, perfil_id: perfil }));
      const { error } = await admin.from("navegadores_equipo").upsert(navegadores, { onConflict: "visita_id", ignoreDuplicates: true });
      if (error) console.error("[eventos] equipo:", error.message);
      return new NextResponse(null, { status: 204 });
    }
  }

  // Las visitas van aparte: si la base todavía no tiene el tipo "visita"
  // (migración sin aplicar), solo fallan ellas y el resto se guarda.
  // Lo mismo con los eventos con detalle (migración de nichos).
  const conDetalle = (f: (typeof filas)[number]) => "detalle" in f;
  const tandas = [filas.filter((f) => f.tipo !== "visita" && !conDetalle(f)), filas.filter((f) => f.tipo === "visita"), filas.filter(conDetalle)];
  for (const tanda of tandas) {
    if (tanda.length === 0) continue;
    const { error } = await admin.from("eventos").insert(tanda.map((fila) => ({ ...fila, perfil_id: perfil })));
    if (error) console.error("[eventos]", error.message);
  }
  return new NextResponse(null, { status: 204 });
}
