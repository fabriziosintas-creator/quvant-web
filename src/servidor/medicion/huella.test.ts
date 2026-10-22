import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { diaEnBuenosAires, huellaDelDia, ipDelPedido } from "./huella";

const CLAVE = "clave-de-prueba";
const CHROME = "Mozilla/5.0 Chrome/140";

describe("huella del día", () => {
  it("la misma conexión, el mismo día, da la misma huella (32 caracteres hexadecimales)", () => {
    const a = huellaDelDia("181.1.2.3", CHROME, "2026-10-22", CLAVE);
    assert.equal(a, huellaDelDia("181.1.2.3", CHROME, "2026-10-22", CLAVE));
    assert.match(a ?? "", /^[0-9a-f]{32}$/);
  });

  it("cambia de un día para otro, con otro navegador o con otra IP", () => {
    const base = huellaDelDia("181.1.2.3", CHROME, "2026-10-22", CLAVE);
    assert.notEqual(base, huellaDelDia("181.1.2.3", CHROME, "2026-10-23", CLAVE));
    assert.notEqual(base, huellaDelDia("181.1.2.3", "Mozilla/5.0 Firefox/141", "2026-10-22", CLAVE));
    assert.notEqual(base, huellaDelDia("181.1.2.4", CHROME, "2026-10-22", CLAVE));
  });

  it("no guarda la IP ni se puede leer en la huella", () => {
    const h = huellaDelDia("181.1.2.3", CHROME, "2026-10-22", CLAVE) ?? "";
    assert.ok(!h.includes("181"));
  });

  it("sin IP o sin clave, no hay huella", () => {
    assert.equal(huellaDelDia("", CHROME, "2026-10-22", CLAVE), null);
    assert.equal(huellaDelDia("181.1.2.3", CHROME, "2026-10-22", undefined), null);
  });

  it("toma la primera IP de x-forwarded-for y el día en Buenos Aires", () => {
    assert.equal(ipDelPedido(new Headers({ "x-forwarded-for": "181.1.2.3, 10.0.0.1" })), "181.1.2.3");
    assert.equal(ipDelPedido(new Headers({ "x-real-ip": "200.5.6.7" })), "200.5.6.7");
    assert.equal(ipDelPedido(new Headers()), "");
    // 02:00 UTC del 23 son las 23:00 del 22 en Buenos Aires.
    assert.equal(diaEnBuenosAires(new Date("2026-10-23T02:00:00Z")), "2026-10-22");
  });
});
