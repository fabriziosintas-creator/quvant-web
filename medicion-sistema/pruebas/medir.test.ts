import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EVENTOS, FUNCIONES_CLAVE, PLANTILLAS, VERSION_CATALOGO, funcionesClaveDe } from "../catalogo";
import { Cola, almacenEnMemoria } from "../cola";
import { Medicion, type Contexto, type Enviador } from "../medir";
import { anonimoDe, seudonimo } from "../seudonimo";

const CONTEXTO: Contexto = {
  organizacionId: "org-1",
  plantilla: "industria",
  sucursalId: "suc-1",
  rol: "caja",
  dispositivo: "computadora",
  versionApp: "1.0.0",
  compartirMetricas: true,
  prueba: false,
  seudonimo: "u_abc",
};

function armar(opciones: { conexion?: boolean; falla?: boolean } = {}) {
  const enviados: Parameters<Enviador>[0][] = [];
  const avisos: string[] = [];
  let conexion = opciones.conexion ?? true;
  const medicion = new Medicion({
    enviador: async (evento) => {
      if (opciones.falla) throw new Error("PostHog caído");
      enviados.push(evento);
    },
    almacen: almacenEnMemoria(),
    hayConexion: () => conexion,
    avisar: (m) => avisos.push(m),
    ahora: () => new Date("2026-10-20T12:00:00Z"),
  });
  medicion.fijarContexto(CONTEXTO);
  return { medicion, enviados, avisos, conectar: (si: boolean) => (conexion = si) };
}

const esperar = () => new Promise((r) => setTimeout(r, 0));

describe("catálogo", () => {
  it("todo evento tiene módulo, descripción y propiedades con tipos válidos", () => {
    for (const [nombre, def] of Object.entries(EVENTOS)) {
      assert.match(nombre, /^[a-z]+(_[a-z]+)*$/, `${nombre}: minúscula y guion bajo`);
      assert.ok(def.descripcion.length > 10, `${nombre}: sin descripción`);
      for (const [prop, tipo] of Object.entries(def.propiedades)) {
        assert.ok(tipo === "booleano" || tipo === "contador" || ("opciones" in tipo && tipo.opciones.length > 0), `${nombre}.${prop}: tipo inválido`);
      }
    }
  });
  it("no hay propiedades de texto libre (privacidad) ni de integraciones emuladas", () => {
    const nombres = Object.keys(EVENTOS).join(" ");
    for (const prohibido of ["arca", "mercado_pago", "whatsapp", "sincroniz", "factura"]) assert.ok(!nombres.includes(prohibido), `evento de integración emulada: ${prohibido}`);
    for (const [nombre, def] of Object.entries(EVENTOS)) {
      for (const [prop, tipo] of Object.entries(def.propiedades)) {
        // Un contador o una lista cerrada nunca es un dato del negocio; lo que se controla es que no haya texto libre.
        assert.ok(tipo === "booleano" || tipo === "contador" || "opciones" in tipo, `${nombre}.${prop}: tipo libre`);
        for (const sospechosa of ["monto", "importe", "nombre", "email", "telefono", "cuit", "texto", "nota", "direccion", "cliente_final"]) {
          assert.ok(!prop.includes(sospechosa), `${nombre}.${prop} parece un dato del negocio`);
        }
      }
    }
  });
  it("las funciones clave apuntan a eventos de su plantilla", () => {
    for (const plantilla of PLANTILLAS) {
      for (const f of FUNCIONES_CLAVE[plantilla]) {
        const def = EVENTOS[f.evento];
        assert.ok(def.plantillas === "todas" || (def.plantillas as readonly string[]).includes(plantilla), `${plantilla}: ${f.id} usa ${f.evento}, que no existe ahí`);
      }
    }
    assert.ok(FUNCIONES_CLAVE.industria.length >= 5 && FUNCIONES_CLAVE.industria.length <= 8);
    assert.ok(FUNCIONES_CLAVE.gimnasios.length >= 5 && FUNCIONES_CLAVE.gimnasios.length <= 8);
  });
  it("las funciones condicionales se filtran por módulos activos", () => {
    const sinTaller = funcionesClaveDe("industria", ["mostrador", "inventario", "compras", "clientes", "usuarios", "precios", "presupuestos"]);
    assert.ok(!sinTaller.some((f) => f.id === "servicio_tecnico"));
    assert.ok(funcionesClaveDe("industria").some((f) => f.id === "servicio_tecnico"));
  });
});

describe("medir()", () => {
  it("manda un evento válido con las propiedades comunes y la versión del catálogo", async () => {
    const { medicion, enviados } = armar();
    assert.equal(medicion.medir("venta_confirmada", { sin_conexion: false, lista_precios: "gremio", cantidad_items: 3 }), true);
    await esperar();
    assert.equal(enviados.length, 1);
    const e = enviados[0];
    assert.equal(e.nombre, "venta_confirmada");
    assert.equal(e.distinctId, "u_abc");
    assert.equal(e.hora.toISOString(), "2026-10-20T12:00:00.000Z");
    assert.deepEqual(
      { ...e.propiedades },
      {
        organizacion_id: "org-1", plantilla: "industria", sucursal_id: "suc-1", rol: "caja", dispositivo: "computadora",
        version_app: "1.0.0", version_catalogo: VERSION_CATALOGO, prueba: false, modulo: "mostrador",
        sin_conexion: false, lista_precios: "gremio", cantidad_items: 3,
      },
    );
  });
  it("rechaza eventos fuera del catálogo o de otra plantilla", async () => {
    const { medicion, enviados, avisos } = armar();
    assert.equal((medicion as unknown as { medir: (n: string) => boolean }).medir("venta_con_monto"), false);
    assert.equal(medicion.medir("socio_alta"), false); // de gimnasios
    await esperar();
    assert.equal(enviados.length, 0);
    assert.equal(avisos.length, 2);
  });
  it("descarta propiedades que no están en el catálogo y rechaza tipos inválidos", async () => {
    const { medicion, enviados, avisos } = armar();
    const extra = { cantidad_precios: 120, con_vista_previa: true, monto_total: 150000, nombre_producto: "Taladro" } as unknown as Parameters<typeof medicion.medir<"aumento_masivo_aplicado">>[1];
    assert.equal(medicion.medir("aumento_masivo_aplicado", extra), true);
    await esperar();
    assert.ok(!("monto_total" in enviados[0].propiedades) && !("nombre_producto" in enviados[0].propiedades));
    assert.equal(avisos.filter((a) => a.includes("se descarta")).length, 2);
    assert.equal(medicion.medir("caja_cerrada", { cantidad_ventas: -1 }), false);
    assert.equal(medicion.medir("venta_confirmada", { sin_conexion: "si", lista_precios: "gremio", cantidad_items: 1 } as never), false);
    assert.equal(medicion.medir("venta_confirmada", { sin_conexion: true, lista_precios: "vip", cantidad_items: 1 } as never), false);
  });
  it("con 'Compartir métricas' apagado no sale nada ni queda nada en la cola", async () => {
    const { medicion, enviados, conectar } = armar();
    medicion.fijarContexto({ ...CONTEXTO, compartirMetricas: false });
    conectar(false);
    assert.equal(medicion.medir("caja_abierta"), false);
    assert.equal(medicion.pendientes(), 0);
    conectar(true);
    assert.equal(medicion.medir("caja_abierta"), false);
    await esperar();
    assert.equal(enviados.length, 0);
  });
  it("sin conexión encola con la hora original y sale al volver, marcado sin_conexion", async () => {
    const { medicion, enviados, conectar } = armar({ conexion: false });
    assert.equal(medicion.medir("venta_confirmada", { sin_conexion: true, lista_precios: "minorista", cantidad_items: 2 }), true);
    assert.equal(medicion.pendientes(), 1);
    assert.equal(enviados.length, 0);
    conectar(true);
    assert.equal(await medicion.vaciarCola(), 1);
    assert.equal(enviados.length, 1);
    assert.equal(enviados[0].hora.toISOString(), "2026-10-20T12:00:00.000Z");
    assert.equal(enviados[0].propiedades.sin_conexion, true);
    assert.equal(medicion.pendientes(), 0);
  });
  it("si PostHog falla, el evento vuelve a la cola y la app sigue", async () => {
    const { medicion } = armar({ falla: true });
    assert.equal(medicion.medir("caja_abierta"), true);
    await esperar();
    assert.equal(medicion.pendientes(), 1);
    assert.equal(await medicion.vaciarCola(), 0);
    assert.equal(medicion.pendientes(), 1);
  });
  it("las organizaciones de prueba salen marcadas y sin seudónimo va la organización", async () => {
    const { medicion, enviados } = armar();
    medicion.fijarContexto({ ...CONTEXTO, prueba: true, seudonimo: undefined });
    medicion.medir("sesion_iniciada");
    await esperar();
    assert.equal(enviados[0].propiedades.prueba, true);
    assert.equal(enviados[0].distinctId, anonimoDe("org-1"));
  });
  it("un contexto inválido apaga la medición y avisa", () => {
    const { medicion, avisos } = armar();
    medicion.fijarContexto({ ...CONTEXTO, rol: "gerente" as never });
    assert.equal(medicion.medir("caja_abierta"), false);
    assert.ok(avisos.some((a) => a.includes("rol desconocido")));
  });
});

describe("cola y seudónimo", () => {
  it("la cola conserva el orden y respeta el límite", () => {
    const cola = new Cola(almacenEnMemoria());
    for (let i = 0; i < 520; i++) cola.encolar({ evento: `e${i}`, propiedades: {}, hora: "2026-01-01T00:00:00Z", distinctId: "x" });
    assert.equal(cola.pendientes(), 500);
  });
  it("el seudónimo es estable, no contiene el id y exige sal", async () => {
    const a = await seudonimo("usuario-42", "una-sal-secreta-larga");
    const b = await seudonimo("usuario-42", "una-sal-secreta-larga");
    const c = await seudonimo("usuario-42", "otra-sal-secreta-larga");
    assert.equal(a, b);
    assert.notEqual(a, c);
    assert.ok(!a.includes("usuario-42") && a.startsWith("u_"));
    await assert.rejects(() => seudonimo("usuario-42", "corta"));
  });
});
