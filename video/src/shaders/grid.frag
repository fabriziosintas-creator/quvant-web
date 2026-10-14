// La grilla de puntos del manual: puntos cuadrados en gris profundo sobre el
// negro Quvant, con paso de 48 px a 4K. Respira entre 0.9 y 1.0 de opacidad
// con ruido simplex de baja frecuencia (ruido.glsl, antepuesto) que recorre
// un círculo en el tiempo: a los uPeriodo segundos vuelve exactamente al
// mismo estado (loop perfecto). Nunca más brillante que el gris profundo.

uniform vec2 uResolucion;      // en px
uniform float uPaso;           // px entre puntos
uniform float uLado;           // lado del punto, en px
uniform float uTiempo;         // segundos
uniform float uPeriodo;        // segundos del ciclo completo
uniform vec2 uDesplazamiento;  // parallax, en px (< 2 % del cuadro)
uniform float uOpacidad;       // 1 = la grilla del manual; menos, más tenue
uniform vec3 uFondo;
uniform vec3 uPunto;

varying vec2 vUv;

void main() {
  vec2 px = vUv * uResolucion + uDesplazamiento;
  vec2 celda = mod(px, uPaso) - uPaso * 0.5;
  float distancia = max(abs(celda.x), abs(celda.y));
  float punto = 1.0 - smoothstep(uLado * 0.5 - 0.5, uLado * 0.5 + 0.5, distancia);

  // El tiempo da una vuelta: el ruido se lee sobre un círculo de radio 1,5.
  float angulo = 6.2831853 * uTiempo / uPeriodo;
  vec3 lectura = vec3(px / (uPaso * 9.0) + vec2(cos(angulo), sin(angulo)) * 1.5, 0.37);
  float respira = 0.9 + 0.1 * (0.5 + 0.5 * simplex(lectura));

  gl_FragColor = vec4(mix(uFondo, uPunto, punto * respira * uOpacidad), 1.0);
}
