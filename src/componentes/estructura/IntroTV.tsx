"use client";

import { useEffect, useRef } from "react";

/**
 * La intro de la portada: QUVANT aparece como en una tele vieja, en blanco
 * y negro. Se enciende el tubo (una línea que se abre), hay estática gris
 * y la palabra se ve borrosa, con fantasma, yéndose de costado y
 * cortándose; de golpe engancha la señal, queda nítida y blanca, crece y
 * viaja hasta el título real de la portada mientras la estática se va.
 *
 * Es un shader GLSL (WebGL 2) a pantalla completa: se dibuja en tiempo
 * real, nítido en cualquier pantalla, sin video que descargar.
 *
 * Quién decide si corre: el script de <head> (introDecision.ts, en
 * app/layout.tsx), antes de que se pinte nada, marca <html data-intro="si">
 * solo la primera vez por visita, en la portada, con WebGL, en vista 3D y
 * sin "menos movimiento". Así no se ve un parpadeo de la página antes de
 * la intro. Un clic, una tecla, la rueda o un toque la adelantan al final.
 * Al terminar avisa con el evento "quvant:intro-fin" (el texto tipeado de
 * la portada lo espera). El fondo negro tapa la página hasta el primer
 * cuadro del shader; cuando <html> deja de tener data-intro="si", el CSS
 * la oculta (y a los 8 s se oculta sola pase lo que pase).
 */

const VERTICE = `#version 300 es
in vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAGMENTO = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uT;
uniform sampler2D uTexto;
uniform vec4 uRect;
uniform float uEncendido, uSenal, uDesvio, uBorroso, uVisible, uFondo, uFlash, uTextoAlfa;
out vec4 salida;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }

float texto(vec2 px){
  vec2 q = (px - uRect.xy) / uRect.zw;
  if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) return 0.0;
  return texture(uTexto, vec2(q.x, 1.0 - q.y)).a;
}

void main(){
  vec2 px = gl_FragCoord.xy;
  vec2 uv = px / uRes;
  float ruido = 1.0 - uSenal;
  float cuadro = floor(uT * 24.0);

  // El tubo se enciende: una línea que se abre de arriba a abajo.
  float abre = smoothstep(0.0, 1.0, uEncendido);
  float media = mix(0.0015, 0.5, abre * abre);
  float dentro = 1.0 - smoothstep(media - 0.002, media + 0.002, abs(uv.y - 0.5));
  float lineaEncendido = (1.0 - abre) * exp(-abs(uv.y - 0.5) * 380.0) * 2.5;

  // Bandas que tironean de costado y una franja clara que baja.
  float banda = floor(uv.y * 48.0);
  float tiron = (hash(vec2(banda, cuadro)) - 0.5) * 0.07 * ruido * step(0.7, hash(vec2(cuadro, banda * 0.37)));
  float franjaY = 1.0 - fract(uT * 0.45);
  float franja = exp(-pow((uv.y - franjaY) * 9.0, 2.0)) * ruido;
  float desplazo = (uDesvio + tiron + franja * 0.015) * uRes.x;

  // La palabra: borrosa y con fantasma mientras no hay señal.
  float a = 0.0;
  for (int i = -3; i <= 3; i++) {
    a += texto(px + vec2(desplazo + float(i) * uBorroso * uRes.x, 0.0));
  }
  a /= 7.0;
  float fantasma = texto(px + vec2(desplazo + 0.02 * uRes.x * ruido, 0.0)) * 0.45 * ruido;
  float letra = clamp(a + fantasma, 0.0, 1.0) * uVisible;

  // La estática: granos de 2 px que cambian en cada cuadro, barrido y viñeta.
  float grano = hash(floor(px / 2.0) + vec2(cuadro * 13.1, cuadro * 7.7));
  vec3 fondo = vec3(0.05) + vec3(grano) * (0.42 * ruido + 0.02) + franja * 0.12;
  fondo *= mix(1.0, 0.82 + 0.18 * sin(px.y * 1.5708), ruido);
  vec2 c = uv - 0.5;
  fondo *= 1.0 - dot(c, c) * 0.9;
  fondo += uFlash * 0.35;
  // Fuera de la parte encendida, el tubo está apagado: negro (y la línea que se abre).
  fondo = mix(vec3(0.02) + lineaEncendido, fondo + lineaEncendido, dentro);

  // De gris tele a blanco de la marca cuando engancha.
  vec3 tinta = mix(vec3(0.72) * (0.85 + 0.15 * grano), vec3(0.925, 0.925, 0.933), uSenal);

  float alfaFondo = uFondo;
  float alfaLetra = letra * uTextoAlfa * dentro;
  vec3 color = tinta * alfaLetra + fondo * alfaFondo * (1.0 - alfaLetra);
  salida = vec4(color, alfaLetra + alfaFondo * (1.0 - alfaLetra));
}`;

/** Los tiempos de la intro, en segundos. */
const T = { encendido: 0.38, busqueda: 1.55, enganche: 1.72, crecer: 2.0, asentar: 2.6, fin: 2.8 };

const limitar = (x: number) => Math.min(1, Math.max(0, x));
const suave = (x: number) => x * x * (3 - 2 * x);
const entradaSalida = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const conRebote = (x: number) => 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2);
const azar = (n: number) => {
  const s = Math.sin(n * 91.3) * 437.1;
  return s - Math.floor(s);
};

/**
 * Si la portada se desmonta a mitad de la intro, se da por terminada; pero
 * en desarrollo React monta los efectos dos veces (modo estricto) y el
 * primer "desmontaje" no es real: el segundo montaje cancela este aviso.
 */
let finPendiente: ReturnType<typeof setTimeout> | null = null;

function terminar() {
  const raiz = document.documentElement;
  if (raiz.dataset.intro === "si") raiz.dataset.intro = "lista";
  try {
    sessionStorage.setItem("quvant-intro", "vista");
  } catch {
    // Sin almacenamiento: la intro puede volver a salir en otra visita, nada más.
  }
  window.dispatchEvent(new Event("quvant:intro-fin"));
}

/** Dibuja QUVANT con la misma letra, cuerpo y espaciado que el título real. */
function texturaDelTitulo(titulo: HTMLElement, escala: number) {
  const rango = document.createRange();
  rango.selectNodeContents(titulo);
  const caja = rango.getBoundingClientRect();
  const estilo = getComputedStyle(titulo);
  const cuerpo = parseFloat(estilo.fontSize) * escala;
  const espaciado = (parseFloat(estilo.letterSpacing) || 0) * escala;
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.ceil(caja.width * escala);
  lienzo.height = Math.ceil(caja.height * escala);
  const ctx = lienzo.getContext("2d")!;
  ctx.font = `${estilo.fontWeight} ${cuerpo}px ${estilo.fontFamily}`;
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "alphabetic";
  // La caja del rango es el área de la letra (de su ascendente a su
  // descendente), no la línea: la línea base queda a la altura del ascendente.
  const linea = ctx.measureText("Q").fontBoundingBoxAscent ?? cuerpo * 0.8;
  let x = 0;
  for (const letra of titulo.textContent ?? "") {
    ctx.fillText(letra, x, linea);
    x += ctx.measureText(letra).width + espaciado;
  }
  return { lienzo, caja };
}

export function IntroTV() {
  const capa = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (finPendiente) {
      clearTimeout(finPendiente);
      finPendiente = null;
    }
    const raiz = document.documentElement;
    if (raiz.dataset.intro !== "si") {
      terminar();
      return;
    }
    const canvas = lienzo.current;
    const titulo = document.querySelector<HTMLElement>("[data-titulo-portada]");
    const gl = canvas?.getContext("webgl2", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!canvas || !titulo || !gl) {
      terminar();
      return;
    }
    const soltar = () => gl.getExtension("WEBGL_lose_context")?.loseContext();

    let cancelado = false;
    let cuadro = 0;
    let adelantar = false;
    const alAdelantar = () => {
      adelantar = true;
    };
    const eventos = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    for (const evento of eventos) window.addEventListener(evento, alAdelantar, { passive: true });

    const compilar = (tipo: number, fuente: string) => {
      const sombreador = gl.createShader(tipo)!;
      gl.shaderSource(sombreador, fuente);
      gl.compileShader(sombreador);
      if (!gl.getShaderParameter(sombreador, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sombreador) ?? "shader");
      return sombreador;
    };

    const arrancar = async () => {
      // La letra del título tiene que estar cargada para dibujarla igual.
      await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 900))]);
      if (cancelado) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const ancho = window.innerWidth;
      const alto = window.innerHeight;
      canvas.width = Math.round(ancho * dpr);
      canvas.height = Math.round(alto * dpr);

      const programa = gl.createProgram()!;
      gl.attachShader(programa, compilar(gl.VERTEX_SHADER, VERTICE));
      gl.attachShader(programa, compilar(gl.FRAGMENT_SHADER, FRAGMENTO));
      gl.linkProgram(programa);
      if (!gl.getProgramParameter(programa, gl.LINK_STATUS)) throw new Error("programa");
      gl.useProgram(programa);

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const aPos = gl.getAttribLocation(programa, "aPos");
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      // La palabra, a un poco más de resolución: crece antes de asentarse.
      const { lienzo: textura, caja } = texturaDelTitulo(titulo, dpr * 1.3);
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textura);

      const u = (nombre: string) => gl.getUniformLocation(programa, nombre);
      const uni = {
        res: u("uRes"), t: u("uT"), rect: u("uRect"), encendido: u("uEncendido"), senal: u("uSenal"),
        desvio: u("uDesvio"), borroso: u("uBorroso"), visible: u("uVisible"), fondo: u("uFondo"),
        flash: u("uFlash"), textoAlfa: u("uTextoAlfa"),
      };
      gl.uniform2f(uni.res, canvas.width, canvas.height);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);

      // Dónde está la palabra: al centro (y un poco más grande al enganchar) y, al final, sobre el título.
      // En el celular el título ya ocupa casi todo el ancho: al crecer no puede salirse de la pantalla.
      const factorMaximo = Math.min(1.2, (ancho * 0.94) / caja.width);
      const rectCentro = (factor: number) => {
        const w = caja.width * Math.min(factor, factorMaximo);
        const h = caja.height * Math.min(factor, factorMaximo);
        return [(ancho - w) / 2, (alto - h) / 2, w, h];
      };
      const rectTitulo = [caja.left, caja.top, caja.width, caja.height];
      const mezclar = (a: number[], b: number[], k: number) => a.map((v, i) => v + (b[i] - v) * k);

      let inicio = performance.now();
      const paso = (ahora: number) => {
        if (cancelado) return;
        let t = (ahora - inicio) / 1000;
        // Adelantar: salta al enganche (queda poco más de medio segundo).
        if (adelantar && t < T.crecer) {
          inicio = ahora - T.crecer * 1000;
          t = T.crecer;
        }
        adelantar = false;

        const encendido = limitar(t / T.encendido);
        const enganchada = t >= T.busqueda;
        const senal = enganchada
          ? suave(limitar((t - T.busqueda) / (T.enganche - T.busqueda)))
          : azar(Math.floor(t * 9)) > 0.84 ? 0.35 : 0;
        const ruido = 1 - senal;
        const desvio = ruido * (0.05 * Math.sin(t * 4.7) + 0.025 * Math.sin(t * 11.3 + 1));
        const visible = enganchada ? 1 : limitar((t - 0.25) / 0.6) * (azar(Math.floor(t * 14) + 3) > 0.8 ? 0.25 : 0.9);
        const flash = enganchada ? 1 - limitar((t - T.busqueda) / 0.25) : 0;

        let rect: number[];
        if (t < T.enganche) rect = rectCentro(0.92);
        else if (t < T.crecer) rect = rectCentro(0.92 + 0.28 * conRebote(limitar((t - T.enganche) / (T.crecer - T.enganche))));
        else rect = mezclar(rectCentro(1.2), rectTitulo, entradaSalida(limitar((t - T.crecer) / (T.asentar - T.crecer))));
        const fondo = t < T.crecer ? 1 : 1 - entradaSalida(limitar((t - T.crecer) / (T.asentar - T.crecer)));
        const textoAlfa = 1 - limitar((t - T.asentar) / (T.fin - T.asentar));

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(uni.t, t);
        // El shader cuenta desde abajo y en píxeles físicos.
        gl.uniform4f(uni.rect, rect[0] * dpr, (alto - rect[1] - rect[3]) * dpr, rect[2] * dpr, rect[3] * dpr);
        gl.uniform1f(uni.encendido, encendido);
        gl.uniform1f(uni.senal, senal);
        gl.uniform1f(uni.desvio, desvio);
        gl.uniform1f(uni.borroso, 0.008 * ruido);
        gl.uniform1f(uni.visible, visible);
        gl.uniform1f(uni.fondo, fondo);
        gl.uniform1f(uni.flash, flash);
        gl.uniform1f(uni.textoAlfa, textoAlfa);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        // Ya dibuja el shader: el negro de espera deja de tapar.
        capa.current?.setAttribute("data-dibujando", "");
        // El título real aparece recién cuando la palabra de la intro aterrizó encima.
        if (t >= T.asentar) titulo.setAttribute("data-aterrizo", "");

        if (t >= T.fin) {
          terminar();
          soltar();
          return;
        }
        cuadro = requestAnimationFrame(paso);
      };
      cuadro = requestAnimationFrame(paso);
    };

    arrancar().catch((error) => {
      console.error("[intro] No se pudo dibujar:", error);
      terminar();
    });

    return () => {
      cancelado = true;
      cancelAnimationFrame(cuadro);
      for (const evento of eventos) window.removeEventListener(evento, alAdelantar);
      finPendiente = setTimeout(() => {
        finPendiente = null;
        if (raiz.dataset.intro === "si") terminar();
      }, 0);
    };
  }, []);

  return (
    <div ref={capa} aria-hidden className="intro-tv fixed inset-0 z-[95]">
      <canvas ref={lienzo} className="absolute inset-0 size-full" />
    </div>
  );
}
