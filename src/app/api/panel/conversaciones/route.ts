import { NextResponse } from "next/server";
import { adminDelPedido } from "@/servidor/panel/acceso";
import { listarParaPanel } from "@/servidor/chat/servicio";

/** La bandeja del panel: las conversaciones, las más recientes primero. */
export async function GET() {
  if (!(await adminDelPedido())) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  const conversaciones = await listarParaPanel();
  return NextResponse.json({ conversaciones }, { headers: { "Cache-Control": "no-store" } });
}
