import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { esHostPermitido, leerLinkLargo, leerTextoPegado, metrosEntre, nombreComparable, salirDelConsentimiento } from "./linkGoogle";

const largo = (texto: string) => leerLinkLargo(new URL(texto));

describe("leer un link largo de Google Maps", () => {
  it("toma las coordenadas del lugar (!3d!4d) antes que el centro de la pantalla (@)", () => {
    const leido = largo(
      "https://www.google.com/maps/place/Caf%C3%A9+Tortoni,+Av.+de+Mayo+825,+C1084+CABA/@-34.6088,-58.3812,17z/data=!3m1!4b1!4m6!3m5!1s0x95bccad1:0x1!8m2!3d-34.6087852!4d-58.3786617!16s%2Fg%2F1tf",
    );
    assert.equal(leido.nombre, "Café Tortoni");
    assert.equal(leido.direccion, "Av. de Mayo 825, C1084 CABA");
    assert.equal(leido.latitud, -34.6087852);
    assert.equal(leido.longitud, -58.3786617);
    assert.equal(leido.precision, "lugar");
  });

  it("sin data=, usa el centro de la pantalla", () => {
    const leido = largo("https://www.google.com/maps/place/Ferreter%C3%ADa+El+Tornillo/@-34.5801,-58.4302,18z");
    assert.equal(leido.nombre, "Ferretería El Tornillo");
    assert.equal(leido.latitud, -34.5801);
    assert.equal(leido.precision, "pantalla");
  });

  it("lee q=lat,lng", () => {
    const leido = largo("https://maps.google.com/?q=-34.6037,-58.3816");
    assert.deepEqual([leido.latitud, leido.longitud, leido.precision, leido.nombre], [-34.6037, -58.3816, "consulta", null]);
  });

  it("con q=<texto> toma el nombre y no inventa coordenadas", () => {
    const leido = largo("https://www.google.com/maps/search/?api=1&query=Gimnasio+Atlas,+Rosario");
    assert.equal(leido.nombre, "Gimnasio Atlas");
    assert.equal(leido.direccion, "Rosario");
    assert.equal(leido.latitud, null);
  });

  it("descarta coordenadas fuera de rango o 0,0", () => {
    assert.equal(largo("https://maps.google.com/?q=0,0").latitud, null);
    assert.equal(largo("https://maps.google.com/?q=95,10").latitud, null);
  });
});

describe("el texto que se pega", () => {
  it("separa el nombre que viene arriba del link corto", () => {
    const r = leerTextoPegado("Almacén Don Pepe\nCalle 7 1234, La Plata\nhttps://maps.app.goo.gl/AbCdEf123");
    assert.ok(r && "corto" in r);
    assert.equal(r.corto.hostname, "maps.app.goo.gl");
    assert.deepEqual(r.antes, ["Almacén Don Pepe", "Calle 7 1234, La Plata"]);
  });

  it("si no hay link de Google Maps, devuelve null", () => {
    assert.equal(leerTextoPegado("https://example.com/maps/place/x"), null);
    assert.equal(leerTextoPegado("solo texto"), null);
  });
});

describe("seguridad al seguir redirecciones", () => {
  it("solo permite hosts de Google", () => {
    assert.ok(esHostPermitido("maps.app.goo.gl"));
    assert.ok(esHostPermitido("www.google.com.ar"));
    assert.ok(!esHostPermitido("google.com.evil.example"));
    assert.ok(!esHostPermitido("127.0.0.1"));
  });

  it("saca el link real de la pantalla de cookies", () => {
    const real = salirDelConsentimiento(new URL("https://consent.google.com/ml?continue=https://www.google.com/maps/place/X/@-34.1,-58.2,17z&gl=AR"));
    assert.equal(real?.hostname, "www.google.com");
  });
});

describe("duplicados", () => {
  it("mide distancias cortas en metros", () => {
    const d = metrosEntre({ latitud: -34.6037, longitud: -58.3816 }, { latitud: -34.6039, longitud: -58.3816 });
    assert.ok(d > 20 && d < 25, `dio ${d}`);
  });

  it("compara nombres sin tildes ni signos", () => {
    assert.equal(nombreComparable("Ferretería  El Tornillo S.A."), nombreComparable("ferreteria el tornillo sa"));
  });
});
