import type { NextRequest } from "next/server";
import { diaBA } from "@/objetivos/fechas";
import { PANEL_ADMIN } from "@/datos/textos";
import { valorAnual } from "@/comercial/comercial";
import { aOportunidad, cargarComercial } from "@/servidor/comercial/datos";
import { anotarExportacion } from "@/servidor/bitacora/datos";
import { adminDelPedido } from "@/servidor/panel/acceso";

/** Las oportunidades en CSV, con el filtro de la lista (";", BOM y celdas protegidas, como las otras exportaciones). */
const celda = (valor: unknown) => {
  let texto = valor === null || valor === undefined ? "" : String(valor);
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
};

export async function GET(pedido: NextRequest) {
  const admin = await adminDelPedido();
  if (!admin) return new Response("Sin permiso", { status: 401 });
  const q = pedido.nextUrl.searchParams;
  await anotarExportacion(admin.supabase, "comercial", Object.fromEntries(q));
  const hoy = diaBA(new Date());
  let filas;
  try {
    filas = (await cargarComercial(admin.supabase)).filas;
  } catch {
    return new Response("No se pudo exportar", { status: 500 });
  }
  const visibles = filas.filter(
    (o) =>
      (!q.get("etapa") || o.etapa === q.get("etapa")) &&
      (!q.get("nicho") || o.nicho_id === q.get("nicho")) &&
      (!q.get("responsable") || o.responsable === q.get("responsable")) &&
      (!q.get("origen") || o.origen === q.get("origen")) &&
      (q.get("sinPaso") !== "si" || (!o.proximo_paso && !o.proximo_paso_fecha)) &&
      (q.get("vencidas") !== "si" || (!!o.proximo_paso_fecha && o.proximo_paso_fecha < hoy)),
  );
  const T = PANEL_ADMIN.comercial;
  const lineas = [
    ["Negocio", "Contacto", "Teléfono", "Email", "Rubro", "Ciudad", "Etapa", "Origen", "Responsable", "Valor anual", "Próximo paso", "Fecha", "Motivo de pérdida", "Alta"],
    ...visibles.map((o) => [
      o.negocio,
      o.contacto,
      o.telefono,
      o.email,
      o.nicho_id,
      o.ciudad,
      T.etapas[o.etapa as keyof typeof T.etapas] ?? o.etapa,
      T.origenes[o.origen as keyof typeof T.origenes] ?? o.origen,
      o.responsable,
      valorAnual(aOportunidad(o)).toFixed(2).replace(".", ","),
      o.proximo_paso,
      o.proximo_paso_fecha,
      o.motivo_perdida ? T.motivos[o.motivo_perdida as keyof typeof T.motivos] : "",
      o.creado_en.slice(0, 10),
    ]),
  ];
  return new Response("﻿" + lineas.map((f) => f.map(celda).join(";")).join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="quvant-oportunidades-${hoy}.csv"`, "Cache-Control": "no-store" },
  });
}
