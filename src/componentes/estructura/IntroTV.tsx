"use client";

import { useEffect, useRef, useState } from "react";

/**
 * El logo de la portada sintoniza como una tele vieja: QUVANT aparece en
 * su lugar, con estática gris adentro de las letras, borroso, con fantasma,
 * corriéndose de costado y cortándose en tiras; a los 1,45 s engancha la
 * señal con un destello y queda nítido. La página se ve completa desde el
 * principio: el efecto vive solo en el nombre (decisión del 19-oct-2026: a
 * pantalla completa hacía esperar; esa versión quedó en el spot).
 *
 * Es un shader GLSL (WebGL 2) en un lienzo del tamaño del título, que usa
 * la misma letra y el mismo lugar que el título real: al enganchar, el
 * título real aparece justo debajo y el lienzo se funde.
 *
 * El sonido (public/sonidos/intro-logo.mp3, una tele descompuesta: ver
 * video/scripts/sonido-intro-web.ts) se intenta al entrar, pero los
 * navegadores no dejan sonar nada antes de que la persona toque la página:
 * casi siempre corre en silencio. Tocando el logo, el efecto se repite con
 * sonido (un toque sí habilita el audio).
 *
 * Quién decide si corre al entrar: el script de <head> (introDecision.ts)
 * marca <html data-intro="si"> en cada carga de la portada, con WebGL 2, en
 * vista 3D y sin "menos movimiento". Al terminar avisa con el evento
 * "quvant:intro-fin".
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
uniform float uSenal, uDesvio, uBorroso, uVisible, uFlash, uAlfa;
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

  // Tiras horizontales que tironean de costado (la señal que no engancha).
  float tira = floor(uv.y * 9.0);
  float tiron = (hash(vec2(tira, cuadro)) - 0.5) * 0.12 * ruido * step(0.55, hash(vec2(cuadro, tira * 0.37)));
  float desplazo = (uDesvio + tiron) * uRect.z;

  // La palabra, borrosa y con fantasma mientras no hay señal.
  float a = 0.0;
  for (int i = -3; i <= 3; i++) a += texto(px + vec2(desplazo + float(i) * uBorroso * uRect.z, 0.0));
  a /= 7.0;
  float fantasma = texto(px + vec2(desplazo + 0.045 * uRect.z * ruido, 0.0)) * 0.4 * ruido;
  float letra = clamp(a + fantasma, 0.0, 1.0) * uVisible;

  // Adentro de las letras: estática gris (granos de 2 px que cambian en cada cuadro) y líneas de barrido.
  float grano = hash(floor(px / 2.0) + vec2(cuadro * 13.1, cuadro * 7.7));
  vec3 estatica = vec3(0.32 + 0.68 * grano) * mix(1.0, 0.72 + 0.28 * sin(px.y * 1.5708), ruido);
  vec3 tinta = mix(estatica, vec3(0.925, 0.925, 0.933), uSenal) + uFlash * 0.5;

  float alfa = letra * uAlfa;
  salida = vec4(tinta * alfa, alfa);
}`;

/** Los tiempos del efecto, en segundos. */
const T = { busqueda: 1.3, enganche: 1.45, aparece: 1.55, fin: 1.8 };

const limitar = (x: number) => Math.min(1, Math.max(0, x));
const suave = (x: number) => x * x * (3 - 2 * x);
/** El mismo azar que usa el sonido (video/scripts/sonido-intro-web.ts): los parpadeos coinciden. */
const azar = (n: number) => {
  const s = Math.sin(n * 91.3) * 437.1;
  return s - Math.floor(s);
};

/**
 * Si el efecto se desmonta a mitad, se da por terminado; pero en desarrollo
 * React monta los efectos dos veces (modo estricto) y el primer
 * "desmontaje" no es real: el segundo montaje cancela este cierre.
 */
let cierrePendiente: ReturnType<typeof setTimeout> | null = null;

function terminar() {
  const raiz = document.documentElement;
  if (raiz.dataset.intro === "si") raiz.dataset.intro = "lista";
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
  // La caja del rango es el área de la letra: la línea base queda a la altura del ascendente.
  const linea = ctx.measureText("Q").fontBoundingBoxAscent ?? cuerpo * 0.8;
  let x = 0;
  for (const letra of titulo.textContent ?? "") {
    ctx.fillText(letra, x, linea);
    x += ctx.measureText(letra).width + espaciado;
  }
  return { lienzo, caja };
}

/** El sonido, decodificado una sola vez. */
let audio: { ctx: AudioContext; buffer: Promise<AudioBuffer> } | null = null;
function sonido() {
  if (!audio) {
    const ctx = new AudioContext();
    const buffer = fetch("/sonidos/intro-logo.mp3")
      .then((r) => r.arrayBuffer())
      .then((datos) => ctx.decodeAudioData(datos));
    audio = { ctx, buffer };
  }
  return audio;
}

/** Suena solo si el navegador ya dejó (si no, el efecto sigue en silencio: nunca suena tarde). */
async function sonar() {
  try {
    const { ctx, buffer } = sonido();
    if (ctx.state === "suspended") await Promise.race([ctx.resume(), new Promise((r) => setTimeout(r, 60))]);
    if (ctx.state !== "running") return;
    const fuente = ctx.createBufferSource();
    fuente.buffer = await buffer;
    fuente.connect(ctx.destination);
    fuente.start();
  } catch {
    // Sin audio (navegador viejo, bloqueado): el efecto igual se ve.
  }
}

export function IntroTV() {
  const lienzo = useRef<HTMLCanvasElement>(null);
  /** Cada vuelta del efecto: la primera al entrar y otra por cada toque del logo. */
  const [vuelta, setVuelta] = useState(0);

  // Tocar el logo repite el efecto, con sonido.
  useEffect(() => {
    const titulo = document.querySelector<HTMLElement>("[data-titulo-portada]");
    if (!titulo) return;
    const alTocar = () => {
      if (document.documentElement.dataset.intro === "si") return;
      if (document.documentElement.dataset.vista === "texto") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      document.documentElement.dataset.intro = "si";
      setVuelta((v) => v + 1);
    };
    titulo.addEventListener("click", alTocar);
    return () => titulo.removeEventListener("click", alTocar);
  }, []);

  useEffect(() => {
    if (cierrePendiente) {
      clearTimeout(cierrePendiente);
      cierrePendiente = null;
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
    titulo.removeAttribute("data-aterrizo");

    let cancelado = false;
    let cuadro = 0;

    const compilar = (tipo: number, fuente: string) => {
      const s = gl.createShader(tipo)!;
      gl.shaderSource(s, fuente);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
      return s;
    };

    const arrancar = async () => {
      await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 900))]);
      if (cancelado) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { lienzo: textura, caja } = texturaDelTitulo(titulo, dpr);
      // El lienzo cubre el título con aire a los costados (la palabra se corre).
      const margenX = caja.width * 0.18;
      const margenY = caja.height * 0.3;
      const ancho = caja.width + margenX * 2;
      const alto = caja.height + margenY * 2;
      canvas.style.left = `${caja.left + window.scrollX - margenX}px`;
      canvas.style.top = `${caja.top + window.scrollY - margenY}px`;
      canvas.style.width = `${ancho}px`;
      canvas.style.height = `${alto}px`;
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

      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textura);

      const u = (n: string) => gl.getUniformLocation(programa, n);
      const uni = {
        res: u("uRes"), t: u("uT"), rect: u("uRect"), senal: u("uSenal"), desvio: u("uDesvio"),
        borroso: u("uBorroso"), visible: u("uVisible"), flash: u("uFlash"), alfa: u("uAlfa"),
      };
      gl.uniform2f(uni.res, canvas.width, canvas.height);
      // La palabra, en píxeles físicos y con el origen abajo (como cuenta el shader).
      gl.uniform4f(uni.rect, margenX * dpr, margenY * dpr, caja.width * dpr, caja.height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);

      canvas.style.opacity = "1";
      void sonar();
      const inicio = performance.now();
      const paso = (ahora: number) => {
        if (cancelado) return;
        const t = (ahora - inicio) / 1000;
        const enganchada = t >= T.busqueda;
        const senal = enganchada ? suave(limitar((t - T.busqueda) / (T.enganche - T.busqueda))) : azar(Math.floor(t * 9)) > 0.86 ? 0.3 : 0;
        const ruido = 1 - senal;
        const visible = enganchada ? 1 : limitar(t / 0.12) * (azar(Math.floor(t * 14) + 3) > 0.8 ? 0.35 : 0.95);

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(uni.t, t);
        gl.uniform1f(uni.senal, senal);
        gl.uniform1f(uni.desvio, ruido * (0.06 * Math.sin(t * 4.7) + 0.03 * Math.sin(t * 11.3 + 1)));
        gl.uniform1f(uni.borroso, 0.007 * ruido);
        gl.uniform1f(uni.visible, visible);
        gl.uniform1f(uni.flash, t >= T.enganche ? Math.max(0, 1 - (t - T.enganche) / 0.15) : 0);
        gl.uniform1f(uni.alfa, 1 - limitar((t - T.aparece) / (T.fin - T.aparece)));
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        // El título real aparece debajo cuando la palabra ya enganchó.
        if (t >= T.aparece) titulo.setAttribute("data-aterrizo", "");
        if (t >= T.fin) {
          canvas.style.opacity = "0";
          terminar();
          return;
        }
        cuadro = requestAnimationFrame(paso);
      };
      cuadro = requestAnimationFrame(paso);
    };

    arrancar().catch((error) => {
      console.error("[intro] No se pudo dibujar:", error);
      titulo.setAttribute("data-aterrizo", "");
      terminar();
    });

    return () => {
      cancelado = true;
      cancelAnimationFrame(cuadro);
      cierrePendiente = setTimeout(() => {
        cierrePendiente = null;
        titulo.setAttribute("data-aterrizo", "");
        if (raiz.dataset.intro === "si") terminar();
      }, 0);
    };
  }, [vuelta]);

  return <canvas ref={lienzo} aria-hidden className="intro-logo pointer-events-none absolute left-0 top-0 z-20 opacity-0" />;
}
