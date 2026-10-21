import { NextResponse, type NextRequest } from "next/server";
import { cargarHistorial } from "@/servidor/bitacora/datos";
import { adminDelPedido } from "@/servidor/panel/acceso";

/** El historial de un registro, para el "Historial" plegable de cada ficha (se pide al abrirlo). */
export async function GET(pedido: NextRequest) {
  const admin = await adminDelPedido();
  if (!admin) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  const tabla = pedido.nextUrl.searchParams.get("tabla") ?? "";
  const registro = pedido.nextUrl.searchParams.get("registro") ?? "";
  if (!/^[a-z_]{1,60}$/.test(tabla) || !/^[\w-]{1,80}$/.test(registro)) return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  const historial = await cargarHistorial(admin.supabase, tabla, registro);
  return NextResponse.json(historial ?? { entradas: [], nombres: {}, falta: true }, { headers: { "Cache-Control": "no-store" } });
}
