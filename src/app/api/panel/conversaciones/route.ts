import { NextResponse, type NextRequest } from "next/server";
import { leerSesion } from "@/servidor/chat/sesion";
import { listarParaPanel } from "@/servidor/chat/servicio";

/** La bandeja del panel: las conversaciones, las más recientes primero. */
export async function GET(pedido: NextRequest) {
  if (!leerSesion(pedido)) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  const conversaciones = await listarParaPanel();
  return NextResponse.json({ conversaciones }, { headers: { "Cache-Control": "no-store" } });
}
