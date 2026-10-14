// Gradación final de TODO el video: lo que hace que stock, capturas y 3D
// parezcan una sola pieza. Es un efecto de postprocessing (mainImage), el
// último de la cadena, después del bloom y la aberración.
//
// - Saturación global (1 = sin cambio; el stock ya llega desaturado).
// - Viñeta 0.25.
// - Scanline casi invisible (0.02) y grano fino (0.015): solo donde hay
//   imagen. El negro vacío queda limpio.
// - Negros: nunca por debajo de #0D0D0F. Los cuadros vacíos dan el negro
//   Quvant exacto, y lo aplastado del stock sube a ese negro.
// - El grano se siembra con el cuadro módulo el largo del loop: el último
//   cuadro del loop y el primero llevan el mismo grano.

uniform vec3 uNegro;
uniform float uSaturacion;
uniform float uVineta;
uniform float uScanline;
uniform float uGrano;
uniform float uCuadro;
uniform float uPeriodo;

// Hash sin seno (Dave Hoskins, licencia MIT): estable en cualquier GPU.
float azar(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 color = inputColor.rgb;
  const vec3 pesos = vec3(0.2126, 0.7152, 0.0722);
  float luma = dot(color, pesos);
  color = mix(vec3(luma), color, uSaturacion);

  vec2 q = (uv - 0.5) * vec2(aspect, 1.0);
  color *= 1.0 - uVineta * smoothstep(0.35, 1.05, length(q));

  float contenido = smoothstep(0.0, 0.06, luma - dot(uNegro, pesos));

  float linea = 0.5 + 0.5 * sin(uv.y * resolution.y * 3.14159265);
  color *= 1.0 - uScanline * linea * contenido;

  float semilla = mod(uCuadro, uPeriodo);
  float grano = azar(uv * resolution + semilla * 17.13) - 0.5;
  color += grano * 2.0 * uGrano * contenido;

  color = max(color, uNegro);
  outputColor = vec4(color, inputColor.a);
}
