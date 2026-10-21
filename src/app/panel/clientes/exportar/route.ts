import { PANEL_ADMIN } from "@/datos/textos";
import { diaBA } from "@/objetivos/fechas";
import { cargarClientes } from "@/servidor/clientes/datos";
import { adminDelPedido } from "@/servidor/panel/acceso";

/** Los clientes del sistema en CSV (";", BOM y celdas protegidas, como las otras exportaciones). */
const celda = (valor: unknown) => {
  let texto = valor === null || valor === undefined ? "" : String(valor);
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
};

export async function GET() {
  const admin = await adminDelPedido();
  if (!admin) return new Response("Sin permiso", { status: 401 });
  const datos = await cargarClientes(admin.supabase);
  if (!datos) return new Response("Faltan las tablas de clientes", { status: 503 });
  const T = PANEL_ADMIN.clientesSistema;
  const C = T.columnas;
  const lineas = [
    [C.cliente, T.ficha.organizacion, C.nicho, C.plan, C.sucursales, T.ficha.usuarios, C.responsable, C.abono, C.alta, "Baja", T.baja.motivo, C.salud, C.metricas, T.ficha.modulos],
    ...datos.filas.map(({ sistema: s, plantilla: p, salud }) => [
      s.nombre,
      s.organizacion_id,
      s.nucleo_id,
      s.plan,
      s.sucursales_contratadas,
      s.usuarios_contratados,
      s.responsable,
      p?.abono_mensual === null || p?.abono_mensual === undefined ? "" : String(p.abono_mensual).replace(".", ","),
      s.alta,
      s.baja,
      s.motivo_baja ? T.baja.motivos[s.motivo_baja as keyof typeof T.baja.motivos] : "",
      salud,
      s.comparte_metricas ? T.comparte : T.noComparte,
      s.modulos_activos.join(" "),
    ]),
  ];
  const hoy = diaBA(new Date());
  return new Response("﻿" + lineas.map((f) => f.map(celda).join(";")).join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="quvant-clientes-${hoy}.csv"`, "Cache-Control": "no-store" },
  });
}
