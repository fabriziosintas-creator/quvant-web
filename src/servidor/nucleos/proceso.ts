import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { armarResumenAlertas } from "@/emails/nucleos";
import { calcularIndicadores, generarAlertas } from "@/nucleos/indicadores";
import type { Alerta, AlertaNueva, Semaforo } from "@/nucleos/tipos";
import { enviarEmail } from "@/servidor/emails/enviar";
import { crearClienteAdmin } from "@/supabase/admin";
import { cargarClientesReales, cargarNucleos } from "./datos";
import { leerUsoDesdePostHog, posthogConfigurado } from "./posthog";

/**
 * El proceso diario (B.2): consulta PostHog, calcula los indicadores de
 * cada cliente, guarda la foto del día en indicadores_diarios, genera las
 * alertas nuevas (sin repetir las abiertas) y, si hay alertas rojas, manda
 * el resumen por email a NUCLEOS_ALERTAS_PARA (vacío = no manda; modo
 * noche: queda armado y en modo prueba).
 *
 * Lo llama Vercel Cron (vercel.json, 07:00 de Buenos Aires = 10:00 UTC) por
 * /api/nucleos/actualizar con CRON_SECRET, y el botón "Actualizar ahora"
 * del panel. Corre con la clave secreta (no hay sesión en el cron).
 */

export type ResultadoProceso = {
  modoEjemplo: boolean;
  clientes: number;
  fotosGuardadas: number;
  alertasNuevas: number;
  alertasRojas: number;
  emailEnviado: boolean;
  detalle: string[];
};

export async function correrProcesoDiario(hoy = new Date()): Promise<ResultadoProceso> {
  const detalle: string[] = [];
  const resultado: ResultadoProceso = { modoEjemplo: false, clientes: 0, fotosGuardadas: 0, alertasNuevas: 0, alertasRojas: 0, emailEnviado: false, detalle };

  if (!posthogConfigurado()) {
    resultado.modoEjemplo = true;
    detalle.push("Sin PostHog configurado: no hay nada que calcular (el panel muestra datos de ejemplo).");
    return resultado;
  }
  const admin = crearClienteAdmin();
  const nucleos = await cargarNucleos(admin);
  const clientes = await cargarClientesReales(admin, nucleos);
  if (clientes === null) {
    resultado.modoEjemplo = true;
    detalle.push("Faltan las tablas de Núcleos: aplicar la migración 20261021140000_nucleos.sql.");
    return resultado;
  }
  resultado.clientes = clientes.length;
  if (clientes.length === 0) {
    detalle.push("No hay clientes cargados en clientes_sistema.");
    return resultado;
  }

  const usos = await leerUsoDesdePostHog(clientes.map((c) => c.organizacionId), true, hoy);
  const dia = hoy.toISOString().slice(0, 10);
  const ayer = new Date(hoy.getTime() - 86_400_000).toISOString().slice(0, 10);
  // Las tablas de Núcleos no están en los tipos generados todavía: se consultan sin tipos.
  const tabla = (nombre: string) => (admin as unknown as SupabaseClient).from(nombre);

  const { data: abiertasCrudo } = await tabla("alertas").select("cliente_id, tipo, funcion_clave").in("estado", ["nueva", "vista"]);
  const abiertasPor = new Map<string, Pick<Alerta, "tipo" | "funcionClave">[]>();
  for (const a of (abiertasCrudo ?? []) as { cliente_id: string; tipo: Alerta["tipo"]; funcion_clave: string | null }[]) {
    abiertasPor.set(a.cliente_id, [...(abiertasPor.get(a.cliente_id) ?? []), { tipo: a.tipo, funcionClave: a.funcion_clave }]);
  }
  const { data: fotosAyer } = await tabla("indicadores_diarios").select("cliente_id, semaforo").eq("dia", ayer);
  const semaforoAyer = new Map<string, Semaforo>();
  for (const f of (fotosAyer ?? []) as { cliente_id: string; semaforo: Semaforo | null }[]) if (f.semaforo) semaforoAyer.set(f.cliente_id, f.semaforo);

  const rojas: Array<{ cliente: string; alerta: AlertaNueva }> = [];
  for (const cliente of clientes) {
    const uso = usos.get(cliente.organizacionId) ?? { organizacionId: cliente.organizacionId, semanas: [], eventos: {}, ultimaSesion: null, actividadPorSucursal: {}, accionesPorRol: {} };
    const indicadores = calcularIndicadores(cliente, uso, hoy);
    const { error: errorFoto } = await tabla("indicadores_diarios").upsert(
      { cliente_id: cliente.id, dia, salud: indicadores.salud, semaforo: indicadores.semaforo, datos: indicadores },
      { onConflict: "cliente_id,dia" },
    );
    if (errorFoto) {
      detalle.push(`${cliente.nombre}: no se pudo guardar la foto (${errorFoto.message})`);
      continue;
    }
    resultado.fotosGuardadas++;

    const anterior = semaforoAyer.get(cliente.id);
    const nuevas = generarAlertas(cliente, uso, indicadores, abiertasPor.get(cliente.id) ?? [], anterior ? { semaforo: anterior } : null, hoy);
    if (nuevas.length > 0) {
      const { error } = await tabla("alertas").insert(
        nuevas.map((a) => ({ cliente_id: cliente.id, tipo: a.tipo, funcion_clave: a.funcionClave, gravedad: a.gravedad, detalle: a.detalle, es_prueba: cliente.esPrueba })),
      );
      if (error) detalle.push(`${cliente.nombre}: no se pudieron guardar las alertas (${error.message})`);
      else {
        resultado.alertasNuevas += nuevas.length;
        for (const a of nuevas) if (a.gravedad === "roja" && !cliente.esPrueba) rojas.push({ cliente: cliente.nombre, alerta: a });
      }
    }
  }
  resultado.alertasRojas = rojas.length;

  const para = (process.env.NUCLEOS_ALERTAS_PARA ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (rojas.length > 0 && para.length > 0) {
    const email = await armarResumenAlertas(rojas, dia);
    const enviado = await enviarEmail(para, email);
    resultado.emailEnviado = enviado.ok;
    if (!enviado.ok) detalle.push(`El email de alertas no salió: ${enviado.motivo}`);
  } else if (rojas.length > 0) {
    detalle.push(`${rojas.length} alertas rojas sin avisar por email: NUCLEOS_ALERTAS_PARA está vacío.`);
  }
  return resultado;
}
