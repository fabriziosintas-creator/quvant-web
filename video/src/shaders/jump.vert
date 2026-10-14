// "El salto", parte 1: el vértice del pase de postproceso (un cuadro que
// cubre la pantalla). Además de pasar el uv, calcula una sola vez dónde está
// el punto en vuelo: es el mismo valor para todo el cuadro.
//
// uProgress va de 0 a 1 y cubre el vuelo (0 → uCorte) y el revelado
// (uCorte → 1). El vuelo dura 420 ms con cubic-bezier(.2,.8,.2,1): la curva
// se resuelve acá con Newton.

uniform float uProgress;
uniform float uCorte;
uniform vec2 uJumpOrigin;   // px, origen arriba-izquierda como en la pantalla
uniform vec2 uJumpTarget;   // px
uniform vec2 uResolucion;
uniform float uLado;        // lado del punto al aterrizar, px

varying vec2 vUv;
varying vec2 vCentro;       // centro del punto, px (origen arriba-izquierda)
varying float vForma;       // 0 círculo → 1 cuadrado
varying float vTam;         // lado actual, px
varying float vVolando;     // 1 mientras vuela
varying float vRevelado;    // 0..1 del revelado, ya con su curva

// Una coordenada de una Bézier cúbica con extremos 0 y 1.
float bezier(float t, float a, float b) {
  float u = 1.0 - t;
  return 3.0 * u * u * t * a + 3.0 * u * t * t * b + t * t * t;
}

float derivada(float t, float a, float b) {
  float u = 1.0 - t;
  return 3.0 * a * u * u + 6.0 * (b - a) * t * u + 3.0 * (1.0 - b) * t * t;
}

// cubic-bezier(.2,.8,.2,1): de x (tiempo) a y (avance).
float curva(float x) {
  float t = x;
  for (int i = 0; i < 8; i++) {
    t = clamp(t - (bezier(t, 0.2, 0.2) - x) / max(derivada(t, 0.2, 0.2), 0.0001), 0.0, 1.0);
  }
  return bezier(t, 0.8, 1.0);
}

float entradaSalida(float x) {
  return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0;
}

void main() {
  vUv = uv;

  float vuelo = clamp(uProgress / uCorte, 0.0, 1.0);
  float e = curva(vuelo);

  // El arco: el punto de control va por encima del tramo.
  vec2 control = vec2(
    (uJumpOrigin.x + uJumpTarget.x) * 0.5,
    min(uJumpOrigin.y, uJumpTarget.y) - abs(uJumpTarget.x - uJumpOrigin.x) * 0.35
  );
  float u = 1.0 - e;
  vCentro = u * u * uJumpOrigin + 2.0 * u * e * control + e * e * uJumpTarget;
  vForma = clamp(e / 0.85, 0.0, 1.0);
  vTam = uLado * mix(0.8, 1.2, e);
  vVolando = step(0.0001, uProgress) * (1.0 - step(1.0, vuelo));

  vRevelado = entradaSalida(clamp((uProgress - uCorte) / (1.0 - uCorte), 0.0, 1.0));

  gl_Position = vec4(position.xy, 0.0, 1.0);
}
