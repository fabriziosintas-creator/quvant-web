import type { NextRequest } from "next/server";
import { hoyEnBuenosAires } from "@/componentes/panel/formato";
import { CUENTA, PANEL_ADMIN } from "@/datos/textos";
import { anotarExportacion } from "@/servidor/bitacora/datos";
import { adminDelPedido } from "@/servidor/panel/acceso";
import { armarCsv } from "@/servidor/panel/celdaCsv";
import { cargarNichos, leerFiltros, todosLosRegistros } from "@/servidor/panel/datos";

/**
 * Los registrados en CSV, con el filtro de la pantalla (para campañas por
 * rubro). Pensado para Excel en castellano (ver celdaCsv): separador ";",
 * BOM para los acentos y nada que Excel tome como fórmula.
 */

export async function GET(pedido: NextRequest) {
  const admin = await adminDelPedido();
  if (!admin) return new Response("Sin permiso", { status: 401 });

  const filtros = leerFiltros(Object.fromEntries(pedido.nextUrl.searchParams));
  await anotarExportacion(admin.supabase, "registros", Object.fromEntries(pedido.nextUrl.searchParams));
  const [filas, nichos] = await Promise.all([todosLosRegistros(admin.supabase, filtros), cargarNichos(admin.supabase)]);
  const C = PANEL_ADMIN.resumen.columnas;
  const si = PANEL_ADMIN.resumen.filtros.si;
  const no = PANEL_ADMIN.resumen.filtros.no;

  const lineas = [
    [C.fecha, C.nombre, "Apellido", C.email, C.nicho, C.objetivo, C.empresa, C.ciudad, C.telefono, C.novedades, C.confirmado, C.origen],
    ...filas.map((f) => [
      f.creado_en,
      f.nombre,
      f.apellido,
      f.email,
      f.nicho_id === "otro" && f.nicho_otro ? `Otro: ${f.nicho_otro}` : (nichos.find((n) => n.id === f.nicho_id)?.nombre ?? f.nicho_id),
      CUENTA.objetivos.find((o) => o.id === f.objetivo_id)?.texto ?? f.objetivo_id,
      f.empresa,
      f.ciudad,
      f.telefono,
      f.acepta_novedades ? si : no,
      f.email_confirmado_en ? si : no,
      f.origen,
    ]),
  ];
  const csv = armarCsv(lineas);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registros-quvant-${hoyEnBuenosAires()}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
