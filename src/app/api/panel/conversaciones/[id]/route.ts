import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { adminDelPedido } from "@/servidor/panel/acceso";
import { accionDelPanel, detalleParaPanel, type AccionPanel } from "@/servidor/chat/servicio";

/**
 * Una conversación vista desde el panel.
 *  GET → la conversación con todos sus mensajes.
 *  POST { accion, texto? } → leer, tomar, devolver al asistente, cerrar,
 *    reabrir o responder (responder también la toma).
 */

const ACCIONES: readonly AccionPanel[] = ["leer", "tomar", "devolver", "cerrar", "reabrir", "responder"];

export async function GET(pedido: NextRequest, contexto: { params: Promise<{ id: string }> }) {
  if (!(await adminDelPedido())) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  const { id } = await contexto.params;
  const detalle = await detalleParaPanel(id);
  if (!detalle) return NextResponse.json({ error: "No existe" }, { status: 404 });
  return NextResponse.json(detalle, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(pedido: NextRequest, contexto: { params: Promise<{ id: string }> }) {
  const admin = await adminDelPedido();
  if (!admin) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  const { id } = await contexto.params;
  let cuerpo: { accion?: unknown; texto?: unknown };
  try {
    cuerpo = await pedido.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  }
  const accion = ACCIONES.find((a) => a === cuerpo.accion);
  if (!accion) return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
  const texto = typeof cuerpo.texto === "string" ? cuerpo.texto : undefined;
  const detalle = await accionDelPanel(id, accion, admin.perfil.nombre, texto);
  revalidateTag("hoy", "max");
  if (!detalle) return NextResponse.json({ error: "No existe" }, { status: 404 });
  return NextResponse.json(detalle);
}
