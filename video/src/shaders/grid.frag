// La grilla de puntos del manual: puntos cuadrados en gris profundo sobre el
// negro Quvant. Respira entre 0.9 y 1.0 de opacidad con un ruido de baja
// frecuencia que recorre un círculo: a los uPeriodo segundos vuelve
// exactamente al mismo estado (loop perfecto). Nunca más brillante que el
// gris profundo.

uniform vec2 uResolucion;      // en px
uniform float uPaso;           // px entre puntos
uniform float uLado;           // lado del punto, en px
uniform float uTiempo;         // segundos
uniform float uPeriodo;        // segundos del ciclo completo
uniform vec2 uDesplazamiento;  // parallax, en px
uniform vec3 uFondo;
uniform vec3 uPunto;

varying vec2 vUv;

float azar(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float ruido(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(azar(i), azar(i + vec2(1.0, 0.0)), u.x),
             mix(azar(i + vec2(0.0, 1.0)), azar(i + vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
  vec2 px = vUv * uResolucion + uDesplazamiento;
  vec2 celda = mod(px, uPaso) - uPaso * 0.5;
  float distancia = max(abs(celda.x), abs(celda.y));
  float punto = 1.0 - smoothstep(uLado * 0.5 - 0.5, uLado * 0.5 + 0.5, distancia);

  float angulo = 6.2831853 * uTiempo / uPeriodo;
  float r = ruido(px / (uPaso * 9.0) + vec2(cos(angulo), sin(angulo)) * 1.5);
  float opacidad = 0.9 + 0.1 * r;

  gl_FragColor = vec4(mix(uFondo, uPunto, punto * opacidad), 1.0);
}
