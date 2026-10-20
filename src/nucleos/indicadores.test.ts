import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CONFIG_SALUD } from "./configuracion";
import { calcularIndicadores, evaluarFuncionesClave, generarAlertas, pasoActivacion, saludDe, semaforoDe, tendenciaDe } from "./indicadores";
import type { ClienteSistema, SemanaDeUso, UsoCliente } from "./tipos";

const HOY = new Date("2026-10-20T12:00:00Z");
const iso = (diasAtras: number) => new Date(HOY.getTime() - diasAtras * 86_400_000).toISOString();
const dia = (diasAtras: number) => iso(diasAtras).slice(0, 10);

const CLIENTE: ClienteSistema = {
  id: "c1",
  organizacionId: "org-1",
  nombre: "Ferretería de prueba",
  nucleoId: "industria",
  plantilla: "industria",
  alta: dia(120),
  plan: "negocio",
  sucursalesContratadas: 2,
  usuariosContratados: 4,
  responsable: "fabrizio",
  modulosActivos: [],
  esPrueba: true,
};

function semana(inicioDiasAtras: number, acciones: number, extra: Partial<SemanaDeUso> = {}): SemanaDeUso {
  return {
    inicio: dia(inicioDiasAtras),
    diasActivos: acciones > 0 ? 6 : 0,
    acciones,
    accionesPorModulo: { mostrador: acciones },
    usuariosActivos: acciones > 0 ? 3 : 0,
    sucursalesActivas: acciones > 0 ? 2 : 0,
    accionesPrincipales: acciones,
    sesiones: acciones > 0 ? 6 : 0,
    ...extra,
  };
}

const semanasParejas = (n: number, acciones = 100) => Array.from({ length: n }, (_, i) => semana((n - 1 - i) * 7 + 6, acciones));

function uso(semanas: SemanaDeUso[], eventos: UsoCliente["eventos"] = {}, resto: Partial<UsoCliente> = {}): UsoCliente {
  return { organizacionId: "org-1", semanas, eventos, ultimaSesion: iso(0), actividadPorSucursal: { s1: 6, s2: 5 }, accionesPorRol: { caja: 400 }, ...resto };
}

describe("tendencia", () => {
  it("sube, baja o estable contra el promedio de las 4 semanas anteriores", () => {
    assert.deepEqual(tendenciaDe([...semanasParejas(4, 100), semana(6, 130)]), { direccion: "sube", porcentaje: 30 });
    assert.deepEqual(tendenciaDe([...semanasParejas(4, 100), semana(6, 50)]), { direccion: "baja", porcentaje: -50 });
    assert.equal(tendenciaDe([...semanasParejas(4, 100), semana(6, 105)]).direccion, "estable");
    assert.equal(tendenciaDe([semana(6, 10)]).direccion, "estable");
  });
});

describe("salud y semáforo", () => {
  it("puntúa con los pesos de la configuración", () => {
    const perfecta = saludDe({ diasActivos4Semanas: 24, adopcion: 1, amplitud: { usuarios: 1, sucursales: 1 }, tendencia: { direccion: "sube", porcentaje: 20 } });
    assert.equal(perfecta, 100);
    const nada = saludDe({ diasActivos4Semanas: 0, adopcion: 0, amplitud: { usuarios: 0, sucursales: 0 }, tendencia: { direccion: "baja", porcentaje: -50 } });
    assert.equal(nada, Math.round(CONFIG_SALUD.puntajeTendencia.baja * CONFIG_SALUD.pesos.tendencia * 100));
  });
  it("verde desde 70, amarillo desde 40, rojo abajo; en arranque sin semáforo", () => {
    assert.equal(semaforoDe(85, 10), "verde");
    assert.equal(semaforoDe(70, 10), "verde");
    assert.equal(semaforoDe(55, 10), "amarillo");
    assert.equal(semaforoDe(39, 10), "rojo");
    assert.equal(semaforoDe(90, 2), "arranque");
  });
});

describe("funciones clave", () => {
  it("usada dentro de la ventana de su frecuencia, sin usar si nunca, dejó de usar si la venía usando", () => {
    const evaluadas = evaluarFuncionesClave(
      CLIENTE,
      uso(semanasParejas(8), {
        caja_cerrada: { primera: iso(60), ultima: iso(1), semanas: 8 },
        conteo_camara_cerrado: { primera: iso(80), ultima: iso(30), semanas: 4 },
        orden_sugerida_usada: { primera: iso(70), ultima: iso(40), semanas: 5 },
        presupuesto_convertido_en_venta: { primera: iso(20), ultima: iso(20), semanas: 1 },
      }),
      HOY,
    );
    const por = Object.fromEntries(evaluadas.map((f) => [f.id, f.estado]));
    assert.equal(por.caja_diaria, "usada");
    assert.equal(por.conteo_camara, "usada"); // mensual: 30 días entra en la ventana de 45
    assert.equal(por.ordenes_sugeridas, "dejo_de_usar"); // semanal, 40 días, y la usó 5 semanas
    assert.equal(por.presupuestos_a_venta, "sin_usar"); // la usó una sola vez hace 20 días: no es "dejó de usar"
    assert.equal(por.doble_factor, "sin_usar");
  });
  it("las condicionales (taller) solo aplican si el cliente tiene el módulo", () => {
    const sinTaller = evaluarFuncionesClave({ ...CLIENTE, modulosActivos: ["mostrador", "inventario"] }, uso([]), HOY);
    assert.ok(!sinTaller.some((f) => f.id === "servicio_tecnico"));
  });
});

describe("indicadores completos", () => {
  it("un cliente sano queda verde con adopción y amplitud altas", () => {
    const eventos = Object.fromEntries(
      ["caja_cerrada", "presupuesto_convertido_en_venta", "aumento_masivo_previsualizado", "conteo_camara_cerrado", "orden_sugerida_usada", "reparacion_ingresada", "limite_cuenta_corriente_definido", "doble_factor_activado"].map((e) => [e, { primera: iso(90), ultima: iso(2), semanas: 10 }]),
    );
    const i = calcularIndicadores(CLIENTE, uso([...semanasParejas(11), semana(6, 110)], eventos), HOY);
    assert.equal(i.adopcion, 1);
    assert.equal(i.amplitud.sucursales, 1);
    assert.equal(i.semaforo, "verde");
    assert.ok((i.salud ?? 0) >= 90);
    assert.ok(i.crecimiento.operaciones >= 0);
  });
  it("un cliente nuevo está en arranque, sin salud", () => {
    const i = calcularIndicadores({ ...CLIENTE, alta: dia(10) }, uso(semanasParejas(2)), HOY);
    assert.equal(i.salud, null);
    assert.equal(i.semaforo, "arranque");
  });
  it("el embudo de activación avanza paso a paso", () => {
    assert.equal(pasoActivacion(CLIENTE, uso([], {}, { ultimaSesion: null })), "alta");
    assert.equal(pasoActivacion(CLIENTE, uso([], { sesion_iniciada: { primera: iso(5), ultima: iso(1), semanas: 1 } })), "primera_sesion");
    assert.equal(pasoActivacion(CLIENTE, uso([semana(6, 3)], { venta_confirmada: { primera: iso(3), ultima: iso(1), semanas: 1 } })), "primera_accion_principal");
    assert.equal(pasoActivacion(CLIENTE, uso([semana(6, 3)], { conteo_camara_cerrado: { primera: iso(3), ultima: iso(1), semanas: 1 } })), "primera_funcion_avanzada");
    assert.equal(pasoActivacion(CLIENTE, uso(semanasParejas(5))), "uso_semanal_estable");
  });
});

describe("alertas", () => {
  it("genera las seis clases sin repetir las abiertas", () => {
    const usoMalo = uso([...semanasParejas(8, 100), semana(6, 40)], {
      orden_sugerida_usada: { primera: iso(80), ultima: iso(40), semanas: 5 },
    }, { ultimaSesion: iso(10), actividadPorSucursal: { s1: 3 } });
    const indicadores = calcularIndicadores(CLIENTE, usoMalo, HOY);
    const alertas = generarAlertas(CLIENTE, usoMalo, indicadores, [], { semaforo: "verde" }, HOY);
    const tipos = alertas.map((a) => a.tipo);
    assert.ok(tipos.includes("dejo_de_usar"), "dejó de usar las órdenes sugeridas");
    assert.ok(tipos.includes("nunca_uso"), "nunca usó varias funciones a los 120 días");
    assert.ok(tipos.includes("cayo_actividad"), "cayó 60 %");
    assert.ok(tipos.includes("sucursal_sin_actividad"), "una de dos sucursales sin actividad");
    assert.ok(tipos.includes("bajo_semaforo"), "de verde a otro color");
    assert.ok(tipos.includes("sin_sesiones"), "10 días sin sesión");
    assert.equal(alertas.find((a) => a.tipo === "cayo_actividad")?.gravedad, "roja");

    const abiertas = alertas.map((a) => ({ tipo: a.tipo, funcionClave: a.funcionClave }));
    assert.equal(generarAlertas(CLIENTE, usoMalo, indicadores, abiertas, { semaforo: "verde" }, HOY).length, 0);
  });
  it("un cliente sano no genera alertas", () => {
    const eventos = Object.fromEntries(
      ["caja_cerrada", "presupuesto_convertido_en_venta", "aumento_masivo_previsualizado", "conteo_camara_cerrado", "orden_sugerida_usada", "reparacion_ingresada", "limite_cuenta_corriente_definido", "doble_factor_activado"].map((e) => [e, { primera: iso(90), ultima: iso(2), semanas: 10 }]),
    );
    const usoBueno = uso(semanasParejas(12), eventos);
    const indicadores = calcularIndicadores(CLIENTE, usoBueno, HOY);
    assert.equal(generarAlertas(CLIENTE, usoBueno, indicadores, [], { semaforo: "verde" }, HOY).length, 0);
  });
});
