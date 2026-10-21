import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { ipDe } from "@/servidor/chat/sesion";
import { LimiteExcedido, novedadesParaVisitante, recibirDelVisitante } from "@/servidor/chat/servicio";

/**
 * El chat del visitante.
 *  POST { conversacion?, texto, pagina? } → guarda el mensaje y devuelve lo nuevo
 *    (la respuesta del asistente, si le toca).
 *  GET ?conversacion=…&desde=… → lo que llegó después de `desde` (las
 *    respuestas del equipo, que el chat consulta cada pocos segundos).
 */

const ID_VALIDO = /^[0-9a-f-]{36}$/i;

export async function POST(pedido: NextRequest) {
  let cuerpo: { conversacion?: unknown; texto?: unknown; pagina?: unknown };
  try {
    cuerpo = await pedido.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  }
  const texto = typeof cuerpo.texto === "string" ? cuerpo.texto : "";
  if (!texto.trim()) return NextResponse.json({ error: "Escribí un mensaje" }, { status: 400 });
  const id = typeof cuerpo.conversacion === "string" && ID_VALIDO.test(cuerpo.conversacion) ? cuerpo.conversacion : null;
  const pagina = typeof cuerpo.pagina === "string" ? cuerpo.pagina.slice(0, 120) : null;

  try {
    const vista = await recibirDelVisitante({ id, texto, pagina, ip: ipDe(pedido) });
    // Una charla nueva o un mensaje nuevo: "Hoy" lo muestra en el próximo pedido.
    revalidateTag("hoy", "max");
    return NextResponse.json(vista);
  } catch (error) {
    if (error instanceof LimiteExcedido) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    console.error("[chat] Error al recibir un mensaje:", error);
    return NextResponse.json({ error: "No pudimos recibir tu mensaje. Probá de nuevo." }, { status: 500 });
  }
}

export async function GET(pedido: NextRequest) {
  const id = pedido.nextUrl.searchParams.get("conversacion") ?? "";
  const desde = Number(pedido.nextUrl.searchParams.get("desde") ?? 0) || 0;
  if (!ID_VALIDO.test(id)) return NextResponse.json({ error: "Conversación inválida" }, { status: 400 });
  const vista = await novedadesParaVisitante(id, desde);
  if (!vista) return NextResponse.json({ error: "No existe" }, { status: 404 });
  return NextResponse.json(vista, { headers: { "Cache-Control": "no-store" } });
}
