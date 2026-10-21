import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { accionesQueCoinciden, agregarReciente, buscarEnCharlas, comoVisita, interpretar, normalizar, paginasQueCoinciden, unir, type Reciente, type Resultado } from "./buscador";

const ACCIONES = [
  { id: "cobro", titulo: "Cargar cobro", frases: ["cargar cobro", "nuevo cobro"], enlace: "/panel/objetivos/facturacion#cargar-cobro" },
  { id: "objetivo", titulo: "Nuevo objetivo", frases: ["nuevo objetivo", "crear objetivo"], enlace: "/panel/objetivos/nueva" },
  { id: "cerrar", titulo: "Cerrar período", frases: ["cerrar periodo"], enlace: "/panel/objetivos#cerrar-periodo" },
];

describe("buscador", () => {
  it("normaliza tildes y mayúsculas", () => {
    assert.equal(normalizar("  Ferretería   NORTE "), "ferreteria norte");
  });

  it("entiende “nueva visita a…” e “ir a…”", () => {
    assert.deepEqual(interpretar("Nueva visita a Ferretería Norte"), { tipo: "visita", resto: "ferreteria norte" });
    assert.deepEqual(interpretar("visita al kiosco"), { tipo: "visita", resto: "kiosco" });
    assert.deepEqual(interpretar("ir a Industria"), { tipo: "ir", resto: "industria" });
    assert.deepEqual(interpretar("ferreteria"), { tipo: "texto", resto: "ferreteria" });
  });

  it("las acciones coinciden por el comienzo de cada palabra, con o sin tildes", () => {
    assert.equal(accionesQueCoinciden("carg cob", ACCIONES)[0]?.id, "cobro");
    assert.equal(accionesQueCoinciden("cerrar período", ACCIONES)[0]?.id, "cerrar");
    assert.equal(accionesQueCoinciden("objetivo", ACCIONES)[0]?.id, "objetivo");
    assert.equal(accionesQueCoinciden("x", ACCIONES).length, 0);
  });

  it("las páginas, por nombre o por sus claves", () => {
    const paginas = [{ ruta: "/panel/bitacora", nombre: "Bitácora", claves: ["historial", "cambios"] }];
    assert.equal(paginasQueCoinciden("bitacora", paginas)[0]?.enlace, "/panel/bitacora");
    assert.equal(paginasQueCoinciden("histo", paginas)[0]?.enlace, "/panel/bitacora");
  });

  it("busca en las charlas del chat", () => {
    const charlas = [
      { id: "a", nombre: "Ana", empresa: "Kiosco Sol", rubro: "kioscos", necesidad: "sistema", ultimo: "Quiero precios", actualizada: 2 },
      { id: "b", nombre: "Beto", empresa: null, rubro: null, necesidad: null, ultimo: "hola", actualizada: 1 },
    ];
    const r = buscarEnCharlas("kiosco sol", charlas);
    assert.equal(r.length, 1);
    assert.equal(r[0].enlace, "/panel/mensajes?c=a");
  });

  it("une sin repetir y “nueva visita” abre el formulario del local", () => {
    const local: Resultado = { tipo: "local", id: "1", titulo: "Ferretería Norte", contexto: "", enlace: "/panel/mapa?local=1", nicho: "industria", puntaje: 0.8 };
    const nicho: Resultado = { ...local, tipo: "nicho", enlace: "/panel/nichos/industria", puntaje: 0.5 };
    assert.equal(unir([[local], [local, nicho]]).length, 2);
    assert.deepEqual(comoVisita([local, nicho]).map((r) => r.enlace), ["/panel/mapa?local=1&visita=si"]);
  });

  it("recientes: sin repetir y con tope", () => {
    const r = (n: number) => ({ tipo: "local" as const, titulo: `L${n}`, contexto: "", enlace: `/l/${n}`, nicho: null });
    let lista: Reciente[] = [r(1), r(2)];
    lista = agregarReciente(lista, r(2));
    assert.deepEqual(lista.map((x) => x.titulo), ["L2", "L1"]);
    for (let i = 3; i < 15; i++) lista = agregarReciente(lista, r(i));
    assert.equal(lista.length, 8);
  });
});
