/**
 * npm run verificar-loop
 *
 * Comprueba que el hero-loop cierra: renderiza (en 1080p, la composición
 * HeroLoopVerificacion, que tiene un cuadro de más) los cuadros 0, 1439 y
 * 1440 y los compara con pixelmatch.
 *
 *  - 0 contra 1440: el cuadro que seguiría al último tiene que ser igual al
 *    primero. Es la prueba de que el loop es exacto. La GPU no da dos
 *    renders idénticos al píxel (antialias, bloom): el cuadro 0 se dibuja
 *    dos veces y esa diferencia es la base; 0 contra 1440 no puede pasarla
 *    por más de 0,05 %.
 *  - 0 contra 1439: el último cuadro real contra el primero (lo que pide el
 *    brief): menos de 0,5 % de diferencia, o sea, que el salto del loop no
 *    se nota.
 *
 * Deja los cuadros y los mapas de diferencias en out/revision/loop-*.png.
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const SALIDA = path.join("out", "revision");
const CUADROS = [0, 1439, 1440];
const LIMITE = 0.5;

function renderizar(cuadro: number, sufijo = "") {
  const archivo = path.join(SALIDA, `loop-${cuadro}${sufijo}.png`);
  execSync(
    `npx remotion still src/index.ts HeroLoopVerificacion ${archivo} --frame=${cuadro} --gl=angle --log=error`,
    { stdio: "inherit" },
  );
  return PNG.sync.read(readFileSync(archivo));
}

function comparar(a: PNG, b: PNG, nombre: string) {
  const { width, height } = a;
  const diferencia = new PNG({ width, height });
  const distintos = pixelmatch(a.data, b.data, diferencia.data, width, height, { threshold: 0.1 });
  writeFileSync(path.join(SALIDA, `loop-diferencia-${nombre}.png`), PNG.sync.write(diferencia));
  return (distintos / (width * height)) * 100;
}

function main() {
  const [primero, ultimo, siguiente] = CUADROS.map((c) => renderizar(c));
  const otraVez = renderizar(0, "-otra-vez");
  const ruido = comparar(primero, otraVez, "0-0");
  const exacto = comparar(primero, siguiente, "0-1440");
  const costura = comparar(primero, ultimo, "0-1439");
  console.log(`cuadro 0 contra sí mismo (ruido de la GPU): ${ruido.toFixed(3)} %`);
  console.log(`cuadro 0 contra 1440 (loop exacto):         ${exacto.toFixed(3)} %`);
  console.log(`cuadro 0 contra 1439 (la costura):          ${costura.toFixed(3)} %`);
  const bien = exacto <= ruido + 0.05 && costura < LIMITE;
  console.log(bien ? "El loop cierra." : "El loop NO cierra: revisar.");
  process.exit(bien ? 0 : 1);
}

main();
