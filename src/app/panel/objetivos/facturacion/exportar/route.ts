import type { NextRequest } from "next/server";
import { hoyEnBuenosAires } from "@/componentes/panel/formato";
import { PANEL_ADMIN } from "@/datos/textos";
import { limitesDelMes } from "@/objetivos/fechas";
import { anotarExportacion } from "@/servidor/bitacora/datos";
import { adminDelPedido } from "@/servidor/panel/acceso";

/**
 * Los cobros del mes en CSV, para el contador. Igual que la exportación de
 * registrados: separador ";", BOM para Excel en castellano y las celdas que
 * empiezan con = + - @ protegidas para que no se tomen como fórmulas.
 */

const celda = (valor: unknown) => {
  let texto = valor === null || valor === undefined ? "" : String(valor);
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
};

export async function GET(pedido: NextRequest) {
  const admin = await adminDelPedido();
  if (!admin) return new Response("Sin permiso", { status: 401 });
  const parametro = pedido.nextUrl.searchParams.get("mes") ?? "";
  await anotarExportacion(admin.supabase, "facturacion", { mes: parametro });
  const mes = /^\d{4}-\d{2}$/.test(parametro) ? parametro : hoyEnBuenosAires().slice(0, 7);
  const { desde, hasta } = limitesDelMes(`${mes}-01`);
  const { data, error } = await admin.supabase.from("cobros_quvant").select("*").gte("fecha", desde).lte("fecha", hasta).eq("es_prueba", false).order("fecha");
  if (error) return new Response("No se pudo exportar", { status: 500 });

  const F = PANEL_ADMIN.objetivos.facturacion;
  const lineas = [
    [F.fecha, F.cliente, F.tipo, "Rubro", "Monto ARS", F.iva, F.cobrado, "Factura", F.nota],
    ...(data ?? []).map((c) => [
      c.fecha,
      c.cliente,
      F.tipos[c.tipo as keyof typeof F.tipos] ?? c.tipo,
      c.nicho_id ?? "",
      Number(c.monto_ars).toFixed(2).replace(".", ","),
      c.iva_incluido ? "Sí" : "No",
      c.cobrado ? "Sí" : "No",
      c.factura ?? "",
      c.nota ?? "",
    ]),
  ];
  const csv = "﻿" + lineas.map((fila) => fila.map(celda).join(";")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="quvant-cobros-${mes}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
