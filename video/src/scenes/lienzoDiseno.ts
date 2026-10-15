import { COLOR, FUENTE } from "../brand/tokens";
import { curvaMarca, mezcla, tramo } from "./comun";

/**
 * "02 · Diseño": una herramienta de diseño de interfaces dibujada en un
 * <canvas> 2D (no hay stock de diseño de interfaces que sirva). Se arma el
 * tablero de Yunque: el cursor agarra una tarjeta mal ubicada, la arrastra
 * con guías y medidas hasta que encaja, le pone el borde acero de la
 * paleta y después estira un botón. Todo con los colores de la marca.
 *
 * Es una función del segundo t: cada cuadro se dibuja de cero.
 */

export const LIENZO = { ancho: 2560, alto: 1440 };

const plex = (px: number, bold = false) => `${bold ? 700 : 400} ${px}px "${FUENTE.plex.familia}"`;

type Caja = { x: number; y: number; w: number; h: number };

// El área de trabajo y la mesa (el tablero que se diseña).
const PANEL_IZQ = 380;
const PANEL_DER = 2180;
const BARRA = 72;
const MESA: Caja = { x: 560, y: 306, w: 1440, h: 900 };

const TARJETA_A: Caja = { x: MESA.x + 240, y: MESA.y + 216, w: 360, h: 290 };
const DESTINO_B: Caja = { x: MESA.x + 624, y: MESA.y + 216, w: 360, h: 290 };
const TARJETA_C: Caja = { x: MESA.x + 1008, y: MESA.y + 216, w: 392, h: 290 };
const TABLA: Caja = { x: MESA.x + 240, y: MESA.y + 530, w: 1160, h: 330 };
const INICIO_B = { x: DESTINO_B.x + 170, y: DESTINO_B.y + 300 };
const BOTON = { x: MESA.x + 240, y: MESA.y + 128, h: 56 };

const PALETA = [COLOR.negro, COLOR.profundo, COLOR.acero, COLOR.plata, COLOR.blanco];
const SWATCH = { x: PANEL_DER + 32, y: 900, lado: 44, paso: 60 };

/**
 * El recorrido del cursor: [segundo, x, y]. Mientras arrastra la tarjeta
 * (0,88–2,6 s) y mientras estira el botón (desde 4,3 s) sigue a lo que
 * arrastra.
 */
const CURSOR: [number, number, number][] = [
  [0, 2300, 1500],
  [0.88, INICIO_B.x + 200, INICIO_B.y + 60],
  [2.6, DESTINO_B.x + 200, DESTINO_B.y + 60],
  [3.3, SWATCH.x + 2 * SWATCH.paso + 22, SWATCH.y + 22],
  [3.6, SWATCH.x + 2 * SWATCH.paso + 22, SWATCH.y + 22],
  [4.3, BOTON.x + 262, BOTON.y + 28],
  [9, BOTON.x + 262, BOTON.y + 28],
];
const CLICS = [0.9, 3.4, 4.3];

function posicionCursor(t: number): [number, number] {
  let i = 0;
  while (i < CURSOR.length - 2 && t >= CURSOR[i + 1][0]) i++;
  const [t0, x0, y0] = CURSOR[i];
  const [t1, x1, y1] = CURSOR[i + 1];
  const k = curvaMarca(tramo(t, t0, t1));
  return [mezcla(x0, x1, k), mezcla(y0, y1, k)];
}

function rect(ctx: CanvasRenderingContext2D, c: Caja, radio = 0) {
  ctx.beginPath();
  ctx.roundRect(c.x, c.y, c.w, c.h, radio);
}

function texto(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, fuente: string, color: string, espacio = 0) {
  ctx.font = fuente;
  ctx.fillStyle = color;
  ctx.letterSpacing = `${espacio}px`;
  ctx.fillText(s, x, y);
  ctx.letterSpacing = "0px";
}

function barra(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, alfa = 1) {
  ctx.globalAlpha = alfa;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;
}

function tarjeta(ctx: CanvasRenderingContext2D, c: Caja, borde: number) {
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = COLOR.profundo;
  rect(ctx, c, 10);
  ctx.fill();
  ctx.globalAlpha = 1;
  if (borde > 0) {
    ctx.globalAlpha = borde;
    ctx.strokeStyle = COLOR.acero;
    ctx.lineWidth = 2;
    rect(ctx, { x: c.x + 1, y: c.y + 1, w: c.w - 2, h: c.h - 2 }, 9);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function seleccion(ctx: CanvasRenderingContext2D, c: Caja, medida: string) {
  ctx.strokeStyle = COLOR.blanco;
  ctx.lineWidth = 2;
  ctx.strokeRect(c.x - 1, c.y - 1, c.w + 2, c.h + 2);
  const lado = 14;
  for (const [x, y] of [
    [c.x, c.y],
    [c.x + c.w, c.y],
    [c.x, c.y + c.h],
    [c.x + c.w, c.y + c.h],
  ]) {
    ctx.fillStyle = COLOR.negro;
    ctx.fillRect(x - lado / 2, y - lado / 2, lado, lado);
    ctx.strokeRect(x - lado / 2, y - lado / 2, lado, lado);
  }
  ctx.font = plex(20);
  const w = ctx.measureText(medida).width + 24;
  ctx.fillStyle = COLOR.blanco;
  rect(ctx, { x: c.x + c.w / 2 - w / 2, y: c.y + c.h + 14, w, h: 34 }, 4);
  ctx.fill();
  texto(ctx, medida, c.x + c.w / 2 - w / 2 + 12, c.y + c.h + 38, plex(20), COLOR.negro);
}

function guia(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, alfa: number) {
  ctx.globalAlpha = alfa;
  ctx.strokeStyle = COLOR.blanco;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

function medidaEntre(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, alfa: number) {
  ctx.globalAlpha = alfa;
  ctx.strokeStyle = COLOR.blanco;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();
  const s = String(Math.round(x1 - x0));
  ctx.font = plex(18);
  const w = ctx.measureText(s).width + 16;
  ctx.fillStyle = COLOR.blanco;
  rect(ctx, { x: (x0 + x1) / 2 - w / 2, y: y - 36, w, h: 28 }, 4);
  ctx.fill();
  texto(ctx, s, (x0 + x1) / 2 - w / 2 + 8, y - 16, plex(18), COLOR.negro);
  ctx.globalAlpha = 1;
}

function cursor(ctx: CanvasRenderingContext2D, x: number, y: number, presion: number) {
  const e = 1.35 * (1 - 0.1 * presion);
  const flecha = [
    [0, 0],
    [0, 34],
    [9, 26],
    [15, 40],
    [21, 37],
    [15, 24],
    [27, 24],
  ];
  ctx.beginPath();
  flecha.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(x + px * e, y + py * e) : ctx.lineTo(x + px * e, y + py * e)));
  ctx.closePath();
  ctx.fillStyle = COLOR.blanco;
  ctx.fill();
  ctx.strokeStyle = COLOR.negro;
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

function campo(ctx: CanvasRenderingContext2D, etiqueta: string, valor: string, x: number, y: number, w: number) {
  texto(ctx, etiqueta, x, y + 34, plex(20), COLOR.acero);
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = COLOR.profundo;
  rect(ctx, { x: x + 34, y, w: w - 34, h: 48 }, 6);
  ctx.fill();
  ctx.globalAlpha = 1;
  texto(ctx, valor, x + 50, y + 33, plex(22), COLOR.blanco);
}

export function dibujarDiseno(ctx: CanvasRenderingContext2D, t: number) {
  const { ancho, alto } = LIENZO;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = COLOR.negro;
  ctx.fillRect(0, 0, ancho, alto);

  // La mesa de trabajo: grilla de puntos.
  ctx.fillStyle = COLOR.profundo;
  for (let x = PANEL_IZQ + 16; x < PANEL_DER; x += 32) {
    for (let y = BARRA + 16; y < alto; y += 32) ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
  }

  // Lo que pasa en la línea de tiempo.
  const arrastre = curvaMarca(tramo(t, 0.95, 2.15));
  const encaje = tramo(t, 2.1, 2.2);
  const bx = mezcla(INICIO_B.x, DESTINO_B.x + 6, arrastre) + (DESTINO_B.x - (DESTINO_B.x + 6)) * encaje;
  const by = mezcla(INICIO_B.y, DESTINO_B.y + 4, arrastre) + (DESTINO_B.y - (DESTINO_B.y + 4)) * encaje;
  const tarjetaB: Caja = { x: bx, y: by, w: DESTINO_B.w, h: DESTINO_B.h };
  const bordeB = tramo(t, 3.4, 3.6);
  const anchoBoton = mezcla(260, 320, curvaMarca(tramo(t, 4.3, 4.95)));
  const seleccionB = t >= 0.9 && t < 4.3;
  const seleccionBoton = t >= 4.3;
  const guias = Math.min(tramo(t, 1.55, 1.75), 1 - tramo(t, 2.45, 2.65));

  // El tablero que se está diseñando.
  texto(ctx, "Tablero · escritorio", MESA.x, MESA.y - 18, plex(20), COLOR.acero);
  ctx.fillStyle = COLOR.negro;
  ctx.fillRect(MESA.x, MESA.y, MESA.w, MESA.h);
  ctx.strokeStyle = COLOR.profundo;
  ctx.lineWidth = 2;
  ctx.strokeRect(MESA.x, MESA.y, MESA.w, MESA.h);
  barra(ctx, MESA.x, MESA.y, 200, MESA.h, COLOR.profundo, 0.45);
  for (let i = 0; i < 7; i++) {
    barra(ctx, MESA.x + 28, MESA.y + 100 + i * 52, 14, 14, COLOR.acero, i === 0 ? 1 : 0.5);
    barra(ctx, MESA.x + 56, MESA.y + 101 + i * 52, 88 - (i % 3) * 14, 12, COLOR.acero, i === 0 ? 0.9 : 0.4);
  }
  texto(ctx, "Buenas tardes.", MESA.x + 240, MESA.y + 92, plex(44, true), COLOR.blanco);

  ctx.fillStyle = COLOR.blanco;
  rect(ctx, { x: BOTON.x, y: BOTON.y, w: anchoBoton, h: BOTON.h }, 8);
  ctx.fill();
  texto(ctx, "Nueva venta", BOTON.x + 28, BOTON.y + 36, plex(22, true), COLOR.negro);
  ctx.strokeStyle = COLOR.acero;
  ctx.lineWidth = 2;
  rect(ctx, { x: BOTON.x + anchoBoton + 20, y: BOTON.y, w: 300, h: BOTON.h }, 8);
  ctx.stroke();
  texto(ctx, "Nuevo presupuesto", BOTON.x + anchoBoton + 46, BOTON.y + 36, plex(22), COLOR.blanco);

  tarjeta(ctx, TARJETA_A, 0);
  texto(ctx, "VENTAS HOY", TARJETA_A.x + 28, TARJETA_A.y + 48, plex(18), COLOR.acero, 3.6);
  texto(ctx, "$ 3,1 M", TARJETA_A.x + 28, TARJETA_A.y + 136, plex(64, true), COLOR.blanco);
  texto(ctx, "+7,2 % vs la semana pasada", TARJETA_A.x + 28, TARJETA_A.y + 180, plex(18), COLOR.acero);
  for (let i = 0; i < 2; i++) barra(ctx, TARJETA_A.x + 28, TARJETA_A.y + 216 + i * 30, 300 - i * 90, 10, COLOR.acero, 0.35);

  tarjeta(ctx, TARJETA_C, 0);
  texto(ctx, "ACTIVIDAD", TARJETA_C.x + 28, TARJETA_C.y + 48, plex(18), COLOR.acero, 3.6);
  for (let i = 0; i < 5; i++) {
    barra(ctx, TARJETA_C.x + 28, TARJETA_C.y + 86 + i * 40, 60, 10, COLOR.acero, 0.5);
    barra(ctx, TARJETA_C.x + 108, TARJETA_C.y + 86 + i * 40, 240 - (i % 2) * 70, 10, COLOR.acero, 0.3);
  }

  tarjeta(ctx, TABLA, 0);
  texto(ctx, "INVENTARIO", TABLA.x + 28, TABLA.y + 48, plex(18), COLOR.acero, 3.6);
  for (let i = 0; i < 6; i++) {
    const y = TABLA.y + 92 + i * 40;
    barra(ctx, TABLA.x + 28, y, 420 - (i % 3) * 60, 10, COLOR.acero, 0.35);
    barra(ctx, TABLA.x + 640, y, 160, 10, COLOR.acero, 0.25);
    barra(ctx, TABLA.x + 1000, y, 120, 10, COLOR.acero, 0.35);
    barra(ctx, TABLA.x + 28, y + 24, TABLA.w - 56, 1.5, COLOR.profundo, 1);
  }

  // Las guías mientras se acerca al lugar.
  if (guias > 0) {
    guia(ctx, DESTINO_B.x, MESA.y + 10, DESTINO_B.x, MESA.y + MESA.h - 10, guias * 0.8);
    guia(ctx, MESA.x + 210, DESTINO_B.y, MESA.x + MESA.w - 10, DESTINO_B.y, guias * 0.8);
    medidaEntre(ctx, TARJETA_A.x + TARJETA_A.w, tarjetaB.x, tarjetaB.y + tarjetaB.h / 2, guias);
  }

  // La tarjeta que se mueve, encima de todo.
  tarjeta(ctx, tarjetaB, bordeB);
  texto(ctx, "PARA ATENDER", tarjetaB.x + 28, tarjetaB.y + 48, plex(18), COLOR.acero, 3.6);
  const filas = ["Sin stock", "Bajo el mínimo", "Por vencer", "Para retirar"];
  filas.forEach((fila, i) => {
    const y = tarjetaB.y + 90 + i * 44;
    barra(ctx, tarjetaB.x + 28, y - 13, 12, 12, i < 2 ? COLOR.blanco : COLOR.acero, i < 2 ? 0.9 : 0.6);
    texto(ctx, fila, tarjetaB.x + 54, y, plex(20), COLOR.blanco);
    texto(ctx, String([5, 22, 3, 4][i]), tarjetaB.x + tarjetaB.w - 56, y, plex(20), COLOR.acero);
  });

  if (seleccionB) seleccion(ctx, tarjetaB, `${tarjetaB.w} × ${tarjetaB.h}`);
  if (seleccionBoton) seleccion(ctx, { x: BOTON.x, y: BOTON.y, w: anchoBoton, h: BOTON.h }, `${Math.round(anchoBoton)} × ${BOTON.h}`);

  // Barra superior.
  barra(ctx, 0, 0, ancho, BARRA, COLOR.profundo, 0.6);
  texto(ctx, "Quvant  /  Yunque  /  Tablero", 32, 46, plex(22), COLOR.acero);
  for (let i = 0; i < 5; i++) {
    const x = ancho / 2 - 150 + i * 64;
    ctx.strokeStyle = COLOR.acero;
    ctx.lineWidth = 2;
    if (i === 0) barra(ctx, x, 22, 28, 28, COLOR.blanco, 1);
    else if (i === 2) {
      ctx.beginPath();
      ctx.arc(x + 14, 36, 14, 0, Math.PI * 2);
      ctx.stroke();
    } else ctx.strokeRect(x, 22, 28, 28);
  }
  texto(ctx, "100 %", ancho - 110, 46, plex(22), COLOR.acero);

  // Panel de capas.
  barra(ctx, 0, BARRA, PANEL_IZQ, alto - BARRA, COLOR.profundo, 0.35);
  texto(ctx, "CAPAS", 32, BARRA + 62, plex(18), COLOR.acero, 3.6);
  const capas = ["Tablero", "Encabezado", "Botón · Nueva venta", "Tarjeta · Ventas", "Tarjeta · Para atender", "Tarjeta · Actividad", "Tabla · Inventario"];
  const elegida = seleccionBoton ? 2 : seleccionB ? 4 : -1;
  capas.forEach((capa, i) => {
    const y = BARRA + 110 + i * 52;
    if (i === elegida) barra(ctx, 12, y - 32, PANEL_IZQ - 24, 46, COLOR.profundo, 1);
    const sangria = i === 0 ? 32 : 60;
    ctx.strokeStyle = i === elegida ? COLOR.blanco : COLOR.acero;
    ctx.lineWidth = 2;
    ctx.strokeRect(sangria, y - 20, 14, 14);
    texto(ctx, capa, sangria + 30, y - 6, plex(21), i === elegida ? COLOR.blanco : COLOR.acero);
  });

  // Panel de diseño, con los valores de lo seleccionado.
  barra(ctx, PANEL_DER, BARRA, ancho - PANEL_DER, alto - BARRA, COLOR.profundo, 0.35);
  const x0 = PANEL_DER + 32;
  texto(ctx, "DISEÑO", x0, BARRA + 62, plex(18), COLOR.acero, 3.6);
  const sel = seleccionBoton
    ? { x: BOTON.x, y: BOTON.y, w: anchoBoton, h: BOTON.h }
    : seleccionB
      ? tarjetaB
      : null;
  const valor = (n: number | undefined) => (n === undefined ? "–" : String(Math.round(n)));
  campo(ctx, "X", valor(sel ? sel.x - MESA.x : undefined), x0, BARRA + 100, 150);
  campo(ctx, "Y", valor(sel ? sel.y - MESA.y : undefined), x0 + 168, BARRA + 100, 150);
  campo(ctx, "W", valor(sel?.w), x0, BARRA + 168, 150);
  campo(ctx, "H", valor(sel?.h), x0 + 168, BARRA + 168, 150);
  texto(ctx, "Radio", x0, BARRA + 290, plex(20), COLOR.acero);
  texto(ctx, sel ? "8" : "–", x0 + 200, BARRA + 290, plex(22), COLOR.blanco);
  texto(ctx, "RELLENO", x0, BARRA + 380, plex(18), COLOR.acero, 3.6);
  barra(ctx, x0, BARRA + 404, 36, 36, COLOR.profundo, 1);
  ctx.strokeStyle = COLOR.acero;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x0, BARRA + 404, 36, 36);
  texto(ctx, COLOR.profundo, x0 + 54, BARRA + 430, plex(21), COLOR.blanco);
  texto(ctx, "BORDE", x0, BARRA + 510, plex(18), COLOR.acero, 3.6);
  const conBorde = seleccionB && bordeB > 0.5;
  barra(ctx, x0, BARRA + 534, 36, 36, conBorde ? COLOR.acero : COLOR.negro, 1);
  ctx.strokeRect(x0, BARRA + 534, 36, 36);
  texto(ctx, conBorde ? `${COLOR.acero} · 1 px` : "Ninguno", x0 + 54, BARRA + 560, plex(21), COLOR.blanco);
  texto(ctx, "PALETA", x0, SWATCH.y - 26, plex(18), COLOR.acero, 3.6);
  PALETA.forEach((color, i) => {
    const x = SWATCH.x + i * SWATCH.paso;
    barra(ctx, x, SWATCH.y, SWATCH.lado, SWATCH.lado, color, 1);
    ctx.strokeStyle = COLOR.acero;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, SWATCH.y, SWATCH.lado, SWATCH.lado);
    if (i === 2 && t >= 3.4) {
      ctx.strokeStyle = COLOR.blanco;
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 6, SWATCH.y - 6, SWATCH.lado + 12, SWATCH.lado + 12);
    }
  });
  texto(ctx, "TIPOGRAFÍA", x0, SWATCH.y + 120, plex(18), COLOR.acero, 3.6);
  texto(ctx, FUENTE.plex.familia, x0, SWATCH.y + 160, plex(21), COLOR.blanco);
  texto(ctx, "Bold · 44", x0, SWATCH.y + 196, plex(21), COLOR.acero);

  // El cursor, encima de todo.
  const presion = Math.max(0, ...CLICS.map((c) => 1 - Math.abs(t - c) / 0.12));
  const arrastrando = t >= 0.9 && t < 2.3 ? 1 : 0;
  const [cx, cy]: [number, number] =
    t >= 0.88 && t < 2.6
      ? [bx + 200, by + 60]
      : t >= 4.3
        ? [BOTON.x + anchoBoton + 2, BOTON.y + 28]
        : posicionCursor(t);
  cursor(ctx, cx, cy, Math.max(presion, arrastrando));
}
