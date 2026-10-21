import { NextResponse, type NextRequest } from "next/server";
import { esNicho, uuidValido } from "@/servidor/cuenta/validacion";
import { crearClienteAdmin } from "@/supabase/admin";
import { configSupabase } from "@/supabase/entorno";
import { crearClienteServidor } from "@/supabase/servidor";
import type { Enums } from "@/supabase/tipos";

/**
 * Recibe los eventos de la web pública (ver componentes/medicion): qué
 * rubro se miró, dónde se tocó "demo" o "Hablemos", y los pasos del
 * registro. Lo que llega, lo guarda el servidor con la clave secreta
 * (nadie inserta eventos por la API de Supabase).
 *
 * Sin datos personales: ni IP, ni navegador, ni email. El id anónimo lo
 * crea el navegador; si la persona está logueada va también su id, nada
 * más. Con la señal de "no rastrear" (Do Not Track o Global Privacy
 * Control) no se guarda nada. El límite de frecuencia lo pone la base
 * (privado.limitar_eventos): acá solo se valida la forma.
 */

/**
 * Lo que el navegador puede mandar. Los del registro (registro_completo,
 * email_confirmado) y el lugar asignado de la promo los anota la base.
 */
const DESDE_LA_WEB = [
  "vista_nicho",
  "clic_demo",
  "clic_contacto",
  "inicio_registro",
  "vista_cinta_promo",
  "cierre_cinta_promo",
  "clic_cinta_promo",
  "vista_promo",
  "uso_demo_promo",
  "play_video_promo",
  "inicio_registro_promo",
] as const;

const noRastrear = (pedido: NextRequest) =>
  pedido.headers.get("dnt") === "1" || pedido.headers.get("sec-gpc") === "1";

export async function POST(pedido: NextRequest) {
  // Sin configurar o con "no rastrear": como si nada (200 para que el navegador no reintente).
  if (!configSupabase() || noRastrear(pedido)) return new NextResponse(null, { status: 204 });

  let cuerpo: { eventos?: unknown };
  try {
    cuerpo = await pedido.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  }
  const lista = Array.isArray(cuerpo.eventos) ? cuerpo.eventos.slice(0, 20) : [];

  const filas = lista.flatMap((e: Record<string, unknown>) => {
    const tipo = DESDE_LA_WEB.find((t) => t === e.tipo);
    if (!tipo) return [];
    const visita = typeof e.visita === "string" && uuidValido(e.visita) ? e.visita : null;
    if (!visita) return [];
    const nicho = typeof e.nicho === "string" && esNicho(e.nicho) ? e.nicho : null;
    const pagina = typeof e.pagina === "string" ? e.pagina.replace(/[?#].*$/, "").slice(0, 200) : null;
    // Los tipos de la promo entran a los tipos generados al aplicar su migración.
    return [{ tipo: tipo as Enums<"tipo_evento">, nicho_id: nicho, pagina, visita_id: visita }];
  });
  if (filas.length === 0) return new NextResponse(null, { status: 204 });

  // Si hay sesión, el id de la persona (para contar registros por visita).
  let perfil: string | null = null;
  if (pedido.cookies.getAll().some((c) => c.name.startsWith("sb-"))) {
    const { data } = await (await crearClienteServidor()).auth.getClaims();
    perfil = data?.claims?.sub ?? null;
  }

  const { error } = await crearClienteAdmin()
    .from("eventos")
    .insert(filas.map((fila) => ({ ...fila, perfil_id: perfil })));
  if (error) console.error("[eventos]", error.message);
  return new NextResponse(null, { status: 204 });
}
