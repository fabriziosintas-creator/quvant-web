import type { NextRequest } from "next/server";
import { describir, lineasDe } from "@/bitacora/bitacora";
import { TEXTOS_BITACORA } from "@/componentes/panel/bitacora/textos";
import { PANEL_ADMIN } from "@/datos/textos";
import { diaBA } from "@/objetivos/fechas";
import { anotarExportacion, cargarBitacora, leerFiltrosBitacora } from "@/servidor/bitacora/datos";
import { adminDelPedido } from "@/servidor/panel/acceso";

/** La bitácora con el filtro de la pantalla, en CSV (";", BOM y celdas protegidas, como las otras exportaciones). */
const celda = (valor: unknown) => {
  let texto = valor === null || valor === undefined ? "" : String(valor);
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
};

export async function GET(pedido: NextRequest) {
  const admin = await adminDelPedido();
  if (!admin) return new Response("Sin permiso", { status: 401 });
  const filtros = leerFiltrosBitacora(Object.fromEntries(pedido.nextUrl.searchParams));
  const datos = await cargarBitacora(admin.supabase, { ...filtros, antes: null }, 5000);
  if (!datos) return new Response("Falta la bitácora", { status: 503 });
  await anotarExportacion(admin.supabase, "bitacora", { ...filtros, antes: null });
  const B = PANEL_ADMIN.bitacora;
  const lineas = [
    ["Fecha", "Quién", "Acción", "Tabla", "Registro", "Qué pasó", "Detalle"],
    ...datos.entradas.map((e) => {
      const nombre = e.quien ? (datos.nombres[e.quien] ?? null) : null;
      return [
        new Date(e.creadoEn).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }),
        nombre ?? B.sistema,
        B.acciones[e.accion],
        e.tabla,
        e.registroId,
        describir(e, nombre, TEXTOS_BITACORA),
        lineasDe(e, TEXTOS_BITACORA)
          .map((l) => (l.antes && l.despues ? `${l.campo}: ${l.antes} → ${l.despues}` : `${l.campo}: ${l.antes || l.despues}`))
          .join(" | "),
      ];
    }),
  ];
  return new Response("﻿" + lineas.map((f) => f.map(celda).join(";")).join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="quvant-bitacora-${diaBA(new Date())}.csv"`, "Cache-Control": "no-store" },
  });
}
