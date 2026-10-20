import { NextResponse } from "next/server";
import { almacen } from "@/servidor/chat/almacen";
import { MODELO, hayIA } from "@/servidor/chat/asistente";
import { canalAvisos } from "@/servidor/chat/whatsapp";
import { adminDelPedido } from "@/servidor/panel/acceso";

/**
 * Quién está en la bandeja y cómo está configurado el chat (para los avisos
 * de arriba). Se entra con la cuenta de admin; la clave compartida
 * (PANEL_CLAVE) ya no existe: para salir, "Salir" del panel.
 */
export async function GET() {
  const admin = await adminDelPedido();
  return NextResponse.json(
    {
      sesion: admin ? { nombre: admin.perfil.nombre } : null,
      ...(admin ? { almacen: almacen().tipo, ia: hayIA() ? MODELO : null, avisos: canalAvisos() } : {}),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
