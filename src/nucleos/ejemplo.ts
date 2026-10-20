/**
 * Datos de ejemplo de la sección Núcleos: clientes y uso INVENTADOS para
 * ver el panel cuando todavía no hay PostHog ni tablas aplicadas. Todos
 * marcados esPrueba y con el cartel "Datos de ejemplo" en la pantalla. Se
 * apagan solos cuando hay datos reales (ver servidor/nucleos/datos.ts).
 *
 * Deterministas (sin azar real): siempre se ven iguales.
 */
import type { Acompanamiento, ClienteSistema, SemanaDeUso, UsoCliente } from "./tipos";

type Perfil = "sano" | "estable" | "dejo_de_usar" | "cayo" | "nuevo" | "sin_sesiones" | "parcial";

type Ejemplo = { cliente: ClienteSistema; perfil: Perfil };

const dia = (hoy: Date, diasAtras: number) => new Date(hoy.getTime() - diasAtras * 86_400_000).toISOString().slice(0, 10);
const iso = (hoy: Date, diasAtras: number) => new Date(hoy.getTime() - diasAtras * 86_400_000).toISOString();

/** El lunes de la semana de hace n semanas. */
function lunesHace(hoy: Date, semanasAtras: number) {
  const d = new Date(hoy);
  const diaSemana = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - diaSemana - semanasAtras * 7);
  return d.toISOString().slice(0, 10);
}

export function clientesDeEjemplo(hoy = new Date()): Ejemplo[] {
  const base = (id: string, nombre: string, nucleoId: "industria" | "gimnasios", altaDias: number, responsable: "fabrizio" | "michel", extra: Partial<ClienteSistema> = {}): ClienteSistema => ({
    id: `ejemplo-${id}`,
    organizacionId: `org-ejemplo-${id}`,
    nombre,
    nucleoId,
    plantilla: nucleoId,
    alta: dia(hoy, altaDias),
    plan: "negocio",
    sucursalesContratadas: 1,
    usuariosContratados: 3,
    responsable,
    modulosActivos: [],
    esPrueba: true,
    ...extra,
  });
  return [
    { cliente: base("1", "Ferretería Industrial Norte (ejemplo)", "industria", 180, "fabrizio", { plan: "multinegocio", sucursalesContratadas: 3, usuariosContratados: 8 }), perfil: "sano" },
    { cliente: base("2", "Corralón del Oeste (ejemplo)", "industria", 150, "michel", { sucursalesContratadas: 2, usuariosContratados: 5 }), perfil: "estable" },
    { cliente: base("3", "Repuestos Avellaneda (ejemplo)", "industria", 120, "fabrizio", { modulosActivos: ["mostrador", "inventario", "compras", "precios", "presupuestos", "clientes", "usuarios"] }), perfil: "dejo_de_usar" },
    { cliente: base("4", "Maquinarias del Sur (ejemplo)", "industria", 200, "michel", { sucursalesContratadas: 2, usuariosContratados: 6 }), perfil: "cayo" },
    { cliente: base("5", "Ferretería La Plata (ejemplo)", "industria", 12, "fabrizio"), perfil: "nuevo" },
    { cliente: base("6", "Distribuidora Pampa (ejemplo)", "industria", 90, "michel", { usuariosContratados: 4 }), perfil: "sin_sesiones" },
    { cliente: base("7", "Gimnasio Centro (ejemplo)", "gimnasios", 160, "fabrizio", { usuariosContratados: 4 }), perfil: "sano" },
    { cliente: base("8", "Box Crossfit Sur (ejemplo)", "gimnasios", 100, "michel", { modulosActivos: ["socios", "accesos", "usuarios"] }), perfil: "parcial" },
    { cliente: base("9", "Estudio Pilates Flores (ejemplo)", "gimnasios", 9, "fabrizio"), perfil: "nuevo" },
  ];
}

const EVENTOS_POR_PLANTILLA = {
  industria: ["caja_cerrada", "presupuesto_convertido_en_venta", "aumento_masivo_previsualizado", "conteo_camara_cerrado", "orden_sugerida_usada", "reparacion_ingresada", "limite_cuenta_corriente_definido", "doble_factor_activado"],
  gimnasios: ["socio_alta", "cuota_registrada", "acceso_validado", "turno_reservado", "rutina_asignada", "doble_factor_activado"],
} as const;

const MODULOS_POR_PLANTILLA = {
  industria: { mostrador: 0.55, inventario: 0.12, precios: 0.08, presupuestos: 0.1, compras: 0.07, clientes: 0.05, servicio_tecnico: 0.03 },
  gimnasios: { accesos: 0.6, socios: 0.2, clases: 0.12, rutinas: 0.08 },
} as const;

/** Un uso inventado según el perfil del cliente. */
export function usoDeEjemplo(cliente: ClienteSistema, perfil: Perfil, hoy = new Date()): UsoCliente {
  const plantilla = cliente.plantilla === "gimnasios" ? "gimnasios" : "industria";
  const semanas: SemanaDeUso[] = [];
  const semanasDeAlta = Math.max(0, Math.floor((hoy.getTime() - new Date(cliente.alta).getTime()) / (7 * 86_400_000)));
  const cuantas = Math.min(12, semanasDeAlta + 1);
  const basePorSemana = plantilla === "gimnasios" ? 420 : 160;

  for (let i = cuantas - 1; i >= 0; i--) {
    // i = 0 es la semana actual.
    let factor = 1;
    if (perfil === "sano") factor = 1 + (cuantas - 1 - i) * 0.03;
    if (perfil === "estable") factor = 1 + ((i * 7) % 3) * 0.02;
    if (perfil === "dejo_de_usar") factor = 0.9;
    if (perfil === "cayo") factor = i <= 1 ? 0.35 : 1;
    if (perfil === "nuevo") factor = 0.3 + (cuantas - 1 - i) * 0.2;
    if (perfil === "sin_sesiones") factor = i === 0 ? 0 : i === 1 ? 0.2 : 0.8;
    if (perfil === "parcial") factor = 0.5;
    const acciones = Math.round(basePorSemana * factor * (1 + (i % 2) * 0.05));
    const porModulo: Record<string, number> = {};
    for (const [modulo, parte] of Object.entries(MODULOS_POR_PLANTILLA[plantilla])) {
      const apagado = (perfil === "dejo_de_usar" && modulo === "compras" && i <= 2) || (perfil === "parcial" && (modulo === "clases" || modulo === "rutinas"));
      porModulo[modulo] = apagado ? 0 : Math.round(acciones * parte);
    }
    const activos = acciones === 0 ? 0 : Math.min(6, 3 + Math.round(factor * 3));
    semanas.push({
      inicio: lunesHace(hoy, i),
      diasActivos: activos,
      acciones,
      accionesPorModulo: porModulo,
      usuariosActivos: acciones === 0 ? 0 : Math.max(1, Math.min(cliente.usuariosContratados, Math.round(cliente.usuariosContratados * Math.min(1, factor)))),
      sucursalesActivas: acciones === 0 ? 0 : perfil === "cayo" ? 1 : cliente.sucursalesContratadas,
      accionesPrincipales: Math.round(acciones * (plantilla === "gimnasios" ? 0.6 : 0.5)),
      sesiones: activos * 2,
    });
  }

  const eventos: UsoCliente["eventos"] = {};
  const lista = EVENTOS_POR_PLANTILLA[plantilla];
  lista.forEach((evento, indice) => {
    const semanasUsadas = Math.max(0, cuantas - indice);
    if (perfil === "nuevo" && indice > 1) return; // Recién empieza: solo las dos primeras.
    if (perfil === "parcial" && indice >= 3) return; // No usa clases ni rutinas ni doble factor.
    if (perfil === "estable" && indice >= 6) return; // Nunca activó cuentas corrientes ni doble factor.
    if (perfil === "cayo" && indice >= 5) return;
    let ultimaHace = 1 + indice;
    if (perfil === "dejo_de_usar" && (evento === "orden_sugerida_usada" || evento === "conteo_camara_cerrado")) ultimaHace = 50;
    if (perfil === "sin_sesiones") ultimaHace = 12 + indice;
    eventos[evento] = { primera: iso(hoy, Math.min(semanasDeAlta * 7, 7 * semanasUsadas + 3)), ultima: iso(hoy, ultimaHace), semanas: Math.max(1, semanasUsadas) };
  });
  const sesionHace = perfil === "sin_sesiones" ? 12 : perfil === "nuevo" ? 1 : 0;
  eventos.sesion_iniciada = { primera: iso(hoy, semanasDeAlta * 7), ultima: iso(hoy, sesionHace), semanas: cuantas };

  const sucursales: Record<string, number> = {};
  for (let s = 1; s <= cliente.sucursalesContratadas; s++) {
    sucursales[`suc-${s}`] = perfil === "sin_sesiones" ? 0 : perfil === "cayo" && s > 1 ? 0 : 6 - (s - 1);
  }
  const roles: Record<string, number> =
    plantilla === "gimnasios"
      ? { recepcion: 1300, dueno: 140, profe: perfil === "parcial" ? 0 : 220 }
      : { caja: 480, deposito: perfil === "dejo_de_usar" ? 20 : 110, compras: perfil === "dejo_de_usar" ? 0 : 60, dueno: 90 };

  return { organizacionId: cliente.organizacionId, semanas, eventos, ultimaSesion: eventos.sesion_iniciada.ultima, actividadPorSucursal: sucursales, accionesPorRol: roles };
}

export function acompanamientosDeEjemplo(hoy = new Date()): Acompanamiento[] {
  return [
    { id: "ac-1", clienteId: "ejemplo-3", fecha: dia(hoy, 9), quien: null, tipo: "llamada", nota: "Hablamos con el encargado de compras: no sabía que las órdenes sugeridas se arman solas.", alertaId: null, esPrueba: true },
    { id: "ac-2", clienteId: "ejemplo-4", fecha: dia(hoy, 3), quien: null, tipo: "visita", nota: "Visita a la sucursal 2: cambió el encargado y nadie tiene usuario.", alertaId: null, esPrueba: true },
    { id: "ac-3", clienteId: "ejemplo-8", fecha: dia(hoy, 20), quien: null, tipo: "capacitacion", nota: "Capacitación de 40 minutos sobre turnos y rutinas con los profes.", alertaId: null, esPrueba: true },
  ];
}

/** El semáforo "de ayer" de cada cliente de ejemplo, para que se vea una alerta de cambio de color. */
export const SEMAFORO_ANTERIOR_EJEMPLO: Record<string, "verde" | "amarillo" | "rojo"> = { "ejemplo-4": "verde", "ejemplo-6": "amarillo" };
