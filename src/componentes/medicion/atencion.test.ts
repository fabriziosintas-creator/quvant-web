import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fraccionVista, origenDe, profundidadDe, tramoDe } from "./atencion";

const WEB = "https://www.quvant.com.ar/plataformas";

describe("de dónde vino", () => {
  it("campaña gana a todo", () => assert.equal(origenDe("https://www.google.com/", `${WEB}?utm_source=instagram`), "campana"));
  it("sin referente es directo", () => assert.equal(origenDe("", WEB), "directo"));
  it("buscadores", () => {
    assert.equal(origenDe("https://www.google.com.ar/", WEB), "buscador");
    assert.equal(origenDe("https://duckduckgo.com/", WEB), "buscador");
  });
  it("redes", () => {
    assert.equal(origenDe("https://l.instagram.com/", WEB), "red");
    assert.equal(origenDe("https://t.co/abc", WEB), "red");
    assert.equal(origenDe("https://www.linkedin.com/feed", WEB), "red");
  });
  it("desde la misma web o desde otro sitio", () => {
    assert.equal(origenDe("https://www.quvant.com.ar/", WEB), "interno");
    assert.equal(origenDe("https://algun-blog.com.ar/nota", WEB), "otro_sitio");
  });
});

describe("tiempo y profundidad", () => {
  it("tramos de tiempo", () => {
    assert.equal(tramoDe(3_000), "menos_10");
    assert.equal(tramoDe(15_000), "10_30");
    assert.equal(tramoDe(45_000), "30_90");
    assert.equal(tramoDe(200_000), "mas_90");
  });
  it("profundidad por cuartos", () => {
    assert.equal(profundidadDe(0.1), null);
    assert.equal(profundidadDe(0.3), "25");
    assert.equal(profundidadDe(0.8), "75");
    assert.equal(profundidadDe(1), "100");
  });
  it("qué parte de un bloque ya pasó por la pantalla", () => {
    assert.equal(fraccionVista(800, 1000, 800), 0);
    assert.equal(fraccionVista(300, 1000, 800), 0.5);
    assert.equal(fraccionVista(-500, 1000, 800), 1);
  });
});
