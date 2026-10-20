import { NextResponse, type NextRequest } from "next/server";
import { correrProcesoDiario } from "@/servidor/nucleos/proceso";

/**
 * El proceso diario de Núcleos, para Vercel Cron (vercel.json). Vercel
 * manda "Authorization: Bearer <CRON_SECRET>"; sin la clave correcta, 401.
 * Desde el panel se corre con el botón "Actualizar ahora" (acción del
 * servidor, con sesión de admin), no por acá.
 */
export async function GET(pedido: NextRequest) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || pedido.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 401 });
  }
  try {
    const resultado = await correrProcesoDiario();
    return NextResponse.json(resultado, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[nucleos] proceso diario:", error);
    return NextResponse.json({ error: "El proceso falló; ver el registro del servidor." }, { status: 500 });
  }
}
