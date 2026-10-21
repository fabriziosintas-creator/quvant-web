import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { correrProcesoDiario } from "@/servidor/nucleos/proceso";
import { procesoDiarioAvisos } from "@/servidor/avisos/proceso";
import { procesoDiarioObjetivos } from "@/servidor/objetivos/proceso";
import { crearClienteAdmin } from "@/supabase/admin";

/**
 * El proceso diario del panel, para Vercel Cron (vercel.json, 07:00 de
 * Buenos Aires). Vercel manda "Authorization: Bearer <CRON_SECRET>"; sin
 * la clave correcta, 401. Corre dos cosas por separado (si una falla, la
 * otra igual corre):
 *  · Núcleos: indicadores, alertas y emails.
 *  · Objetivos: cierra los períodos terminados y saca la foto del día
 *    (y avisa si un objetivo bajó a "en riesgo" o se cumplió).
 *  · Avisos: oportunidades estancadas y visitas interesantes (si no hay pg_cron).
 * Desde el panel se corren con "Actualizar ahora" y "Cerrar período
 * ahora" (acciones del servidor, con sesión de admin), no por acá.
 */
export async function GET(pedido: NextRequest) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || pedido.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 401 });
  }
  const [nucleos, objetivos, avisos] = await Promise.allSettled([
    correrProcesoDiario(),
    Promise.resolve().then(() => procesoDiarioObjetivos(crearClienteAdmin())),
    Promise.resolve().then(() => procesoDiarioAvisos(crearClienteAdmin())),
  ]);
  if (nucleos.status === "rejected") console.error("[nucleos] proceso diario:", nucleos.reason);
  if (objetivos.status === "rejected") console.error("[objetivos] proceso diario:", objetivos.reason);
  if (avisos.status === "rejected") console.error("[avisos] proceso diario:", avisos.reason);
  // Datos nuevos del día: la caché de "Dentro del nicho" se vuelve a armar en el próximo pedido.
  revalidateTag("nichos", "max");
  const ok = nucleos.status === "fulfilled" || objetivos.status === "fulfilled";
  return NextResponse.json(
    {
      nucleos: nucleos.status === "fulfilled" ? nucleos.value : { error: "Falló; ver el registro del servidor." },
      objetivos: objetivos.status === "fulfilled" ? objetivos.value : { error: "Falló; ver el registro del servidor." },
      avisos: avisos.status === "fulfilled" ? avisos.value : { error: "Falló; ver el registro del servidor." },
    },
    { status: ok ? 200 : 500, headers: { "Cache-Control": "no-store" } },
  );
}
