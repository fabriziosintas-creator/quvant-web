// "El salto", parte 2: la única transición del video. Recibe las dos
// escenas ya dibujadas (uSceneA, uSceneB). Mientras el punto vuela se ve A
// con el punto encima; al aterrizar, B se abre desde ese punto con una
// ventana que nace redonda y termina cuadrada, de borde duro (sin feather:
// solo el medio píxel de antialias).

uniform sampler2D uSceneA;
uniform sampler2D uSceneB;
uniform vec2 uResolucion;
uniform vec2 uJumpTarget;   // px, origen arriba-izquierda
uniform vec3 uColorPunto;

varying vec2 vUv;
varying vec2 vCentro;
varying float vForma;
varying float vTam;
varying float vVolando;
varying float vRevelado;

// Distancia con signo a una caja de esquinas redondeadas (media medida b, radio r).
float caja(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  // Píxel con origen arriba-izquierda, como uJumpOrigin/uJumpTarget.
  vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uResolucion;

  vec3 a = texture2D(uSceneA, vUv).rgb;
  vec3 b = texture2D(uSceneB, vUv).rgb;

  // La ventana: crece desde el aterrizaje hasta cubrir la esquina más lejana.
  vec2 t = uJumpTarget;
  vec2 r = uResolucion;
  float lejos = max(max(length(t), length(t - vec2(r.x, 0.0))), max(length(t - vec2(0.0, r.y)), length(t - r)));
  float medio = vRevelado * lejos;
  float radio = medio * (1.0 - vRevelado);
  float d = caja(px - t, vec2(medio), radio);
  float dentro = (1.0 - smoothstep(-0.5, 0.5, d)) * step(0.0001, vRevelado);
  vec3 color = mix(a, b, dentro);

  // El punto en vuelo, encima: de círculo a cuadrado.
  float mitad = vTam * 0.5;
  float dp = caja(px - vCentro, vec2(mitad), mitad * (1.0 - vForma));
  float punto = (1.0 - smoothstep(-0.5, 0.5, dp)) * vVolando;
  color = mix(color, uColorPunto, punto);

  gl_FragColor = vec4(color, 1.0);
}
