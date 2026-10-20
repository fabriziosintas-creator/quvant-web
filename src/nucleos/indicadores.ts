/**
 * Los indicadores de cada cliente (B.3): uso semanal por módulo, funciones
 * clave sin usar, adopción, amplitud, tendencia, salud (semáforo),
 * crecimiento, embudo de activación y alertas. Funciones puras: entra el
 * uso (de PostHog o de ejemplo), sale el cálculo. Probadas en
 * indicadores.test.ts.
 */
import { EVENTOS, FUNCIONES_CLAVE, funcionesClaveDe, type Plantilla } from "../../medicion-sistema/catalogo";
import { CONFIG_ALERTAS, CONFIG_SALUD, VENTANA_FUNCION_DIAS } from "./configuracion";
import type { Alerta, AlertaNueva, ClienteSistema, FuncionClaveEvaluada, Indicadores, PasoActivacion, Semaforo, SemanaDeUso, Tendencia, UsoCliente } from "./tipos";

const DIA_MS = 86_400_000;
const diasEntre = (desde: string | Date, hasta: Date) => Math.floor((hasta.getTime() - new Date(desde).getTime()) / DIA_MS);

/** La acción principal de cada plantilla (la que cuenta como "operación"). */
export const ACCION_PRINCIPAL: Partial<Record<Plantilla, string>> = { industria: "venta_confirmada", gimnasios: "acceso_validado" };

/** Las funciones "avanzadas" del embudo: cualquier función clave que no sea la acción principal ni la sesión. */
const esAvanzada = (evento: string, plantilla: Plantilla) => evento !== ACCION_PRINCIPAL[plantilla] && evento !== "sesion_iniciada";

export function evaluarFuncionesClave(cliente: ClienteSistema, uso: UsoCliente, hoy: Date): FuncionClaveEvaluada[] {
  const modulos = cliente.modulosActivos.length > 0 ? cliente.modulosActivos : undefined;
  return funcionesClaveDe(cliente.plantilla, modulos).map((f) => {
    const registro = uso.eventos[f.evento];
    const ventana = VENTANA_FUNCION_DIAS[f.frecuencia];
    let estado: FuncionClaveEvaluada["estado"] = "sin_usar";
    if (registro) {
      const hace = diasEntre(registro.ultima, hoy);
      if (hace <= ventana) estado = "usada";
      else if (registro.semanas >= CONFIG_ALERTAS.semanasParaDejoDeUsar) estado = "dejo_de_usar";
      else estado = "sin_usar";
    }
    return { id: f.id, nombre: f.nombre, evento: f.evento, frecuencia: f.frecuencia, porQueImporta: f.porQueImporta, estado, ultimaVez: registro?.ultima ?? null };
  });
}

export const adopcionDe = (funciones: FuncionClaveEvaluada[]) =>
  funciones.length === 0 ? 0 : funciones.filter((f) => f.estado === "usada").length / funciones.length;

const ultimas = (semanas: SemanaDeUso[], n: number) => semanas.slice(-n);
const promedio = (valores: number[]) => (valores.length === 0 ? 0 : valores.reduce((a, b) => a + b, 0) / valores.length);

export function tendenciaDe(semanas: SemanaDeUso[]): Tendencia {
  if (semanas.length < 2) return { direccion: "estable", porcentaje: 0 };
  const actual = semanas[semanas.length - 1].acciones;
  const anteriores = ultimas(semanas.slice(0, -1), 4).map((s) => s.acciones);
  const base = promedio(anteriores);
  if (base === 0) return actual > 0 ? { direccion: "sube", porcentaje: 100 } : { direccion: "estable", porcentaje: 0 };
  const cambio = (actual - base) / base;
  const porcentaje = Math.round(cambio * 100);
  if (cambio > CONFIG_SALUD.umbralTendencia) return { direccion: "sube", porcentaje };
  if (cambio < -CONFIG_SALUD.umbralTendencia) return { direccion: "baja", porcentaje };
  return { direccion: "estable", porcentaje };
}

export function amplitudDe(cliente: ClienteSistema, semanas: SemanaDeUso[]) {
  const ultima = semanas[semanas.length - 1];
  if (!ultima) return { usuarios: 0, sucursales: 0 };
  return {
    usuarios: Math.min(1, ultima.usuariosActivos / Math.max(1, cliente.usuariosContratados)),
    sucursales: Math.min(1, ultima.sucursalesActivas / Math.max(1, cliente.sucursalesContratadas)),
  };
}

export function saludDe(partes: { diasActivos4Semanas: number; adopcion: number; amplitud: { usuarios: number; sucursales: number }; tendencia: Tendencia }): number {
  const { pesos, diasActivosMaximo, puntajeTendencia } = CONFIG_SALUD;
  const dias = Math.min(1, partes.diasActivos4Semanas / diasActivosMaximo);
  const amplitud = (partes.amplitud.usuarios + partes.amplitud.sucursales) / 2;
  const puntaje = dias * pesos.diasActivos + partes.adopcion * pesos.adopcion + amplitud * pesos.amplitud + puntajeTendencia[partes.tendencia.direccion] * pesos.tendencia;
  return Math.round(puntaje * 100);
}

export function semaforoDe(salud: number | null, semanasDeAlta: number): Semaforo {
  if (semanasDeAlta < CONFIG_SALUD.semanasDeArranque || salud === null) return "arranque";
  if (salud >= CONFIG_SALUD.semaforo.verde) return "verde";
  if (salud >= CONFIG_SALUD.semaforo.amarillo) return "amarillo";
  return "rojo";
}

/** Crecimiento de la actividad: últimas 4 semanas contra las 4 anteriores (0.25 = +25 %). */
export function crecimientoDe(semanas: SemanaDeUso[]) {
  const recientes = ultimas(semanas, 4);
  const previas = ultimas(semanas.slice(0, -4), 4);
  const cambio = (f: (s: SemanaDeUso) => number) => {
    const a = recientes.reduce((t, s) => t + f(s), 0);
    const b = previas.reduce((t, s) => t + f(s), 0);
    if (b === 0) return a > 0 ? 1 : 0;
    return (a - b) / b;
  };
  const operaciones = cambio((s) => s.accionesPrincipales);
  const usuarios = cambio((s) => s.usuariosActivos);
  const sucursales = cambio((s) => s.sucursalesActivas);
  return { operaciones, usuarios, sucursales, total: (operaciones + usuarios + sucursales) / 3 };
}

export function calcularIndicadores(cliente: ClienteSistema, uso: UsoCliente, hoy = new Date()): Indicadores {
  const semanas = ultimas(uso.semanas, 12);
  const funcionesClave = evaluarFuncionesClave(cliente, uso, hoy);
  const adopcion = adopcionDe(funcionesClave);
  const amplitud = amplitudDe(cliente, semanas);
  const tendencia = tendenciaDe(semanas);
  const diasActivos4Semanas = ultimas(semanas, 4).reduce((t, s) => t + s.diasActivos, 0);
  const semanasDeAlta = diasEntre(cliente.alta, hoy) / 7;
  const enArranque = semanasDeAlta < CONFIG_SALUD.semanasDeArranque;
  const salud = enArranque ? null : saludDe({ diasActivos4Semanas, adopcion, amplitud, tendencia });
  return {
    organizacionId: cliente.organizacionId,
    calculadoEn: hoy.toISOString(),
    semanas,
    funcionesClave,
    adopcion,
    amplitud,
    tendencia,
    diasActivos4Semanas,
    salud,
    semaforo: semaforoDe(salud, semanasDeAlta),
    crecimiento: crecimientoDe(semanas),
    actividadPorSucursal: uso.actividadPorSucursal,
    accionesPorRol: uso.accionesPorRol,
    ultimaSesion: uso.ultimaSesion,
  };
}

/** En qué paso del embudo de activación está el cliente. */
export function pasoActivacion(cliente: ClienteSistema, uso: UsoCliente): PasoActivacion {
  const principal = ACCION_PRINCIPAL[cliente.plantilla];
  const estable = uso.semanas.length >= 4 && ultimas(uso.semanas, 4).every((s) => s.diasActivos > 0);
  if (estable) return "uso_semanal_estable";
  const avanzada = FUNCIONES_CLAVE[cliente.plantilla].some((f) => esAvanzada(f.evento, cliente.plantilla) && uso.eventos[f.evento]);
  if (avanzada) return "primera_funcion_avanzada";
  if (principal && uso.eventos[principal]) return "primera_accion_principal";
  if (uso.eventos.sesion_iniciada || uso.ultimaSesion) return "primera_sesion";
  return "alta";
}

const diasHabilesDesde = (desde: string, hasta: Date) => {
  let dias = 0;
  for (let t = new Date(desde).getTime() + DIA_MS; t <= hasta.getTime(); t += DIA_MS) {
    const d = new Date(t).getUTCDay();
    if (d !== 0 && d !== 6) dias++;
  }
  return dias;
};

/**
 * Las alertas que corresponden hoy. No repite una alerta del mismo tipo (y
 * función) que ya esté abierta: `abiertas` son las del cliente en estado
 * nueva o vista. `anterior` es la foto de ayer, para el cambio de semáforo.
 */
export function generarAlertas(
  cliente: ClienteSistema,
  uso: UsoCliente,
  indicadores: Indicadores,
  abiertas: Pick<Alerta, "tipo" | "funcionClave">[],
  anterior: { semaforo: Semaforo } | null,
  hoy = new Date(),
): AlertaNueva[] {
  const nuevas: AlertaNueva[] = [];
  const yaAbierta = (tipo: AlertaNueva["tipo"], funcion: string | null = null) => abiertas.some((a) => a.tipo === tipo && (a.funcionClave ?? null) === funcion);
  const sumar = (alerta: AlertaNueva) => {
    if (!yaAbierta(alerta.tipo, alerta.funcionClave)) nuevas.push(alerta);
  };
  const diasDeAlta = diasEntre(cliente.alta, hoy);

  for (const f of indicadores.funcionesClave) {
    if (f.estado === "dejo_de_usar") {
      sumar({ tipo: "dejo_de_usar", gravedad: "amarilla", funcionClave: f.id, detalle: { funcion: f.nombre, ultimaVez: f.ultimaVez ?? "" } });
    }
    if (f.estado === "sin_usar" && !f.ultimaVez && diasDeAlta >= CONFIG_ALERTAS.diasParaNuncaUso) {
      sumar({ tipo: "nunca_uso", gravedad: "amarilla", funcionClave: f.id, detalle: { funcion: f.nombre, diasDeAlta } });
    }
  }

  if (indicadores.tendencia.direccion === "baja" && indicadores.tendencia.porcentaje <= -CONFIG_ALERTAS.caidaActividad * 100) {
    sumar({ tipo: "cayo_actividad", gravedad: "roja", funcionClave: null, detalle: { porcentaje: indicadores.tendencia.porcentaje } });
  }

  const activas = Object.values(uso.actividadPorSucursal).filter((dias) => dias > 0).length;
  if (cliente.sucursalesContratadas > activas && diasDeAlta >= CONFIG_ALERTAS.diasSucursalSinActividad) {
    sumar({ tipo: "sucursal_sin_actividad", gravedad: "amarilla", funcionClave: null, detalle: { contratadas: cliente.sucursalesContratadas, activas } });
  }

  const orden: Semaforo[] = ["verde", "amarillo", "rojo"];
  if (anterior && orden.includes(anterior.semaforo) && orden.includes(indicadores.semaforo) && orden.indexOf(indicadores.semaforo) > orden.indexOf(anterior.semaforo)) {
    sumar({ tipo: "bajo_semaforo", gravedad: indicadores.semaforo === "rojo" ? "roja" : "amarilla", funcionClave: null, detalle: { de: anterior.semaforo, a: indicadores.semaforo } });
  }

  if (uso.ultimaSesion && diasHabilesDesde(uso.ultimaSesion, hoy) >= CONFIG_ALERTAS.diasHabilesSinSesion) {
    sumar({ tipo: "sin_sesiones", gravedad: "roja", funcionClave: null, detalle: { ultimaSesion: uso.ultimaSesion } });
  }

  return nuevas;
}

/** Para mostrar: cuántas acciones hubo por módulo en las últimas 8 semanas (módulos del catálogo, en orden). */
export function usoPorModulo(semanas: SemanaDeUso[]) {
  const modulos = new Set<string>();
  for (const s of ultimas(semanas, 8)) for (const m of Object.keys(s.accionesPorModulo)) modulos.add(m);
  const orden = Object.values(EVENTOS).map((e) => e.modulo);
  return [...modulos].sort((a, b) => orden.indexOf(a as never) - orden.indexOf(b as never));
}
